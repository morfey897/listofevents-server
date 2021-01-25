const { GraphQLString, GraphQLID, GraphQLNonNull, GraphQLList, GraphQLFloat, GraphQLError } = require('graphql')
const { GraphQLUpload } = require('graphql-upload');

const CategoryModel = require('../../models/category-model');
const ImageModel = require('../../models/image-model');
const CategoryType = require('../types/category-type');

const { isValidId, jsTrim, jsSanitize, isValidUrl, inlineArgs, isValidTag, generateUrl } = require('../../utils/validation-utill');
const TranslateInputType = require('../inputs/translate-input-type');
const { ROLES } = require('../../config');
const { ERRORCODES } = require('../../errors');
const { uploadFileAWS } = require('../../utils/upload-utill');

const createCategory = {
  type: CategoryType,
  args: {
    url: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(TranslateInputType) },
    description: { type: new GraphQLNonNull(TranslateInputType) },
    tags: { type: new GraphQLList(GraphQLString) },
    images: { type: new GraphQLList(GraphQLUpload) },
  },
  resolve: async function (_, body, context) {
    let { url, name, tags, description, images } = body;
    const { user } = context;

    let error = null;
    let success = null;

    if (!user || (user.role & ROLES.moderator) !== ROLES.moderator) {
      error = new GraphQLError(ERRORCODES.ERROR_ACCESS_DENIED);
    } if (!isValidUrl(url)) {
      error = new GraphQLError(ERRORCODES.ERROR_INCORRECT_URL);
    } else {
      url = generateUrl(url);

      const fileResults = await Promise.allSettled(images.map(uploadFileAWS));

      let filesComplete = [];
      fileResults.forEach(({ value }) => {
        if (value) {
          filesComplete.push((new ImageModel({
            url: value.path
          })).save());
        }
      });

      let imagesData = await Promise.allSettled(filesComplete);

      success = await (new CategoryModel({
        images_id: imagesData.filter(({ status }) => status == 'fulfilled').map(({ value: { _id } }) => _id),
        tags: (tags || []).map(tag => jsTrim(tag)).filter(tag => isValidTag(tag)),
        description: jsSanitize(description),
        author_id: user._id,
        created_at: Date.now(),
        updated_at: Date.now(),
        ...jsTrim({ url, name })
      })).save();
    }

    if (!success) {
      throw (error || new GraphQLError(ERRORCODES.ERROR_WRONG));
    }

    return success;
  }
}

const updateCategory = {
  type: CategoryType,
  args: {
    _id: { type: GraphQLID },
    url: { type: GraphQLString },
    name: { type: TranslateInputType },
    description: { type: TranslateInputType },
    tags: { type: new GraphQLList(GraphQLString) },
    images: { type: new GraphQLList(GraphQLString) },
    add_images: { type: new GraphQLList(GraphQLUpload) },
  },
  resolve: async function (_, body, context) {
    let { _id, url, tags, description, name, images, add_images } = body;
    const { user } = context;
    let success = null;
    let error = null;

    if (!isValidId(_id)) {
      error = new GraphQLError(ERRORCODES.ERROR_INCORRECT_ID);
    } else {
      let categoryModel = await CategoryModel.findOne({ _id });
      if (!user || !categoryModel || (user.role & ROLES.moderator) !== ROLES.moderator) {
        error = new GraphQLError(ERRORCODES.ERROR_ACCESS_DENIED);
      } else {
        url = isValidUrl(url) && categoryModel.url != url ? generateUrl(url) : "";

        const fileResults = await Promise.allSettled(add_images.map(uploadFileAWS));

        let filesComplete = [];
        fileResults.forEach(({ value }) => {
          if (value) {
            filesComplete.push((new ImageModel({
              url: value.path
            })).save());
          }
        });

        let imagesData = await Promise.allSettled(filesComplete);

        let args = {
          images_id: [...images].concat(imagesData.filter(({ status }) => status == 'fulfilled').map(({ value: { _id } }) => _id)),
          tags: (tags || []).map(tag => jsTrim(tag)).filter(tag => isValidTag(tag)),
          description: jsSanitize(description),
          updated_at: Date.now(),
          ...jsTrim({ url, name }),
        };
        success = await CategoryModel.findOneAndUpdate({ _id }, { $set: inlineArgs(args) }, { new: true });
      }
    }

    if (!success) {
      throw (error || new GraphQLError(ERRORCODES.ERROR_WRONG));
    }
    return success;
  }
}

const deleteCategories = {
  type: GraphQLFloat,
  args: {
    ids: { type: new GraphQLList(GraphQLID) }
  },
  resolve: async function (_, { ids }, context) {
    const { user } = context;

    if (!user || (user.role & ROLES.admin) !== ROLES.admin) {
      throw new GraphQLError(ERRORCODES.ERROR_ACCESS_DENIED);
    } else {
      ids = ids && ids.filter(id => isValidId(id)) || [];
      if (ids.length) {
        let deleteInfo = await CategoryModel.deleteMany({ _id: { $in: ids } });
        return deleteInfo.deletedCount;
      }
    }

    return 0;
  }
}

module.exports = { graphql: { createCategory, updateCategory, deleteCategories } }