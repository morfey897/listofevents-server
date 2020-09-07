const { GraphQLString, GraphQLID, GraphQLNonNull } = require('graphql')

const TagModel = require('../../models/tag-model');
const TagType = require('../types/tag-type');

const { isValidId } = require('../../utils/validation-utill');

const createTag = {
  type: TagType,
  args: {
    label: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async function (_, args) {
    let one = await (new TagModel(args)).save();
    return one;
  }
}

const updateTag = {
  type: TagType,
  args: {
    id: {type: GraphQLID},
    label: { type: GraphQLString },
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
  
      updateInfo = await TagModel.findByIdAndUpdate(id, args, { new: true });
    }
    
    if (!updateInfo) {
      console.warn('Update tag:', id, args);
    }
    return updateInfo;
  }
}

const deleteTag = {
  type: TagType,
  args: {
    id: { type: GraphQLID }
  },
  resolve: async function (_, {id}) {
    let deleteInfo;
    if (isValidId(id)) {
      deleteInfo = await TagModel.findByIdAndRemove(id);
    }
    if (!deleteInfo) {
      console.error("Delete tag:", id);
    }
    return deleteInfo;
  }
}

module.exports = { createTag, updateTag, deleteTag }