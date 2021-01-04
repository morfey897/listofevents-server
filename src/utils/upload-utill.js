const { createWriteStream, unlink } = require('fs');
const shortid = require('shortid');
const mime = require('mime-types')
const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
});

const imageMaxWidth = parseInt(process.env.IMAGE_MAX_WIDTH);

const fileName = (filename, mimetype) => `${filename.replace(/\.\w+$/, "")}-${shortid.generate()}.${mime.extension(mimetype)}`;

const streamToBuffer = (fileStream) => new Promise((resolve, reject) => {
  let chunks = [];

  fileStream.once('error', () => {
    reject();
  });

  fileStream.once('end', () => {
    resolve(Buffer.concat(chunks))
  });

  fileStream.on('data', (chunk) => {
    chunks.push(chunk);
  });
});

async function uploadFile(upload) {
  const { createReadStream, filename, mimetype } = await upload;
  const stream = createReadStream();
  const fName = fileName(filename, mimetype);
  const path = `${process.env.UPLOAD_DIR}/${fName}`;
  const file = { filename: fName, mimetype, path };

  const transformer = sharp().resize({
    width: imageMaxWidth,
    fit: sharp.fit.cover,
    position: sharp.strategy.entropy,
    withoutEnlargement: true
  });

  // Store the file in the filesystem.
  await new Promise((resolve, reject) => {
    // Create a stream to which the upload will be written.
    const writeStream = createWriteStream(path);

    // When the upload is fully written, resolve the promise.
    writeStream.on('finish', () => {
      resolve();
    });

    // If there's an error writing the file, remove the partially written file
    // and reject the promise.
    writeStream.on('error', (error) => {
      unlink(path, () => {
        reject(error);
      });
    });

    // In Node.js <= v13, errors are not automatically propagated between piped
    // streams. If there is an error receiving the upload, destroy the write
    // stream with the corresponding error.
    stream.on('error', (error) => {
      writeStream.destroy(error);
    });

    // Pipe the upload into the write stream.
    stream.pipe(transformer).pipe(writeStream);
  });

  // Record the file metadata in the DB.
  // db.get('uploads').push(file).write();

  return file;
}

async function uploadFileAWS(upload) {
  const { createReadStream, filename, mimetype } = await upload;
  const stream = createReadStream();
  const fName = fileName(filename, mimetype);

  const fileBuffer = await streamToBuffer(stream);
  
  const body = await sharp(fileBuffer).resize({
    width: imageMaxWidth,
    fit: sharp.fit.cover,
    withoutEnlargement: true
  }).toBuffer();

  const { Location } = await s3.upload({
    Bucket: process.env.S3_BUCKET,
    Body: body,
    Key: fName,
    ContentType: mimetype
  }).promise();

  return { filename: fName, mimetype, path: Location }
}

module.exports = {
  uploadFile,
  uploadFileAWS
};