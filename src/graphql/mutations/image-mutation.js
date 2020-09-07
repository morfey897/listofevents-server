const { GraphQLString, GraphQLID, GraphQLNonNull } = require('graphql')

const ImageModel = require('../../models/image-model');
const ImageType = require('../types/image-type');

const { isValidId } = require('../../utils/validation-utill');

const createImage = {
  type: ImageType,
  args: {
    url: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async function (_, args) {
    let one = await (new ImageModel(args)).save();
    return one;
  }
}

const updateImage = {
  type: ImageType,
  args: {
    id: {type: GraphQLID},
    url: { type: GraphQLString },
  },
  resolve: async function (_, {id, ...args}) {
    let updateInfo;
    if (isValidId(id)) {
      Object.keys(args).forEach(name => {
        let value = args[name];
        if (!value) {
          delete args[name];
        } else {
          args[name] = value;
        }
      });
  
      updateInfo = await ImageModel.findByIdAndUpdate(id, args, { new: true });
    }
    
    if (!updateInfo) {
      console.warn('Update image:', id, args);
    }
    return updateInfo;
  }
}

const deleteImage = {
  type: ImageType,
  args: {
    id: { type: GraphQLID }
  },
  resolve: async function (_, {id}) {
    let deleteInfo;
    if (isValidId(id)) {
      deleteInfo = await ImageModel.findByIdAndRemove(id);
    }
    if (!deleteInfo) {
      console.error("Delete image:", id);
    }
    return deleteInfo;
  }
}

module.exports = { createImage, updateImage, deleteImage }