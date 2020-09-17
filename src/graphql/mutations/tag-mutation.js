const { GraphQLString, GraphQLID, GraphQLNonNull, GraphQLList, GraphQLFloat } = require('graphql')

const TagModel = require('../../models/tag-model');
const TagType = require('../types/tag-type');

const { isValidId, isValidTag, inlineArgs, jsTrim } = require('../../utils/validation-utill');

const addTags = async (input) => {
  let tags = (Array.isArray(input) ? input : [input]).map(t => jsTrim(t || "")).filter(t => isValidTag(t) || isValidId(t));
  if (tags.length) {
    const newListTags = tags.filter(t => isValidTag(t));

    const tagModels = await TagModel.find({ $or: [{ label: { $in: newListTags } }] });
    const needCreate = newListTags.filter(t => !tagModels.find(({ label }) => label === t));
    const newTags = await Promise.all(needCreate.map(async label => await (new TagModel({ label })).save()));

    tags = tags.map(v => {
      if (isValidId(v)) return v;
      let newTag = tagModels.find(({ label }) => label === v) || newTags.find(({ label }) => label === v);
      return newTag ? newTag._id.toString() : "";
    }).filter(t => isValidId(t));
  }
  return tags;
};

const createTags = {
  type: new GraphQLList(TagType),
  args: {
    labels: { type: new GraphQLList(GraphQLString) },
  },
  resolve: async function (_, {labels}) {
    let tags = (labels || []).map(t => jsTrim(t || "")).filter(t => isValidTag(t));
    if (tags.length) {
      const newListTags = tags.filter(t => isValidTag(t));
      const tagModels = await TagModel.find({ $or: [{ label: { $in: newListTags } }] });
      const needCreate = newListTags.filter(t => !tagModels.find(({ label }) => label === t));
      await Promise.all(needCreate.map(async label => await (new TagModel({ label })).save()));
    }

    let list = await TagModel.find({$or: [{ label: { $in: tags } }] });
    return list;
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
      updateInfo = await TagModel.findOneAndUpdate({ _id: id }, { $set: inlineArgs(jsTrim(args, { label: true })) }, { new: true });
    }
    
    if (!updateInfo) {
      console.warn('Update tag:', id, args);
    }
    return updateInfo;
  }
}

const deleteTags = {
  type: GraphQLFloat,
  args: {
    ids: { type: new GraphQLList(GraphQLID) }
  },
  resolve: async function (_, {ids}) {
    if (ids) {
      ids = ids.filter(id => isValidId(id));
      if (ids.length) {
        let deleteInfo = await TagModel.remove({_id: {$in: ids}});
        return deleteInfo.deletedCount;
      }
    }
    return 0;
  }
}

module.exports = {  
  graphql: {createTags, updateTag, deleteTags},
  addTags,
}