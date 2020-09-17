const { GraphQLString, GraphQLID, GraphQLNonNull, GraphQLList, GraphQLFloat } = require('graphql')

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

const deleteImages = {
  type: GraphQLFloat,
  args: {
    ids: { type: new GraphQLList(GraphQLID) }
  },
  resolve: async function (_, {ids}) {
    if (ids) {
      ids = ids.filter(id => isValidId(id));
      if (ids.length) {
        let deleteInfo = await ImageModel.remove({_id: {$in: ids}});
        return deleteInfo.deletedCount;
      }
    }
    return 0;
  }
}

module.exports = { graphql: {createImage, updateImage, deleteImages} }