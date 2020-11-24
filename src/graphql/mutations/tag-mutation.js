const { GraphQLString, GraphQLID, GraphQLList, GraphQLFloat } = require('graphql')

const TagModel = require('../../models/tag-model');
const TagType = require('../types/tag-type');

const { isValidId, isValidTag, inlineArgs, jsTrim } = require('../../utils/validation-utill');
const { ROLES } = require('../../config');

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
  resolve: async function (_, { labels }, context) {
    const { user } = context;
    let list = null;
    if (user && (user.role & ROLES.editor) === ROLES.editor) {
      let tags = (labels || []).map(t => jsTrim(t || "")).filter(t => isValidTag(t));
      if (tags.length) {
        const newListTags = tags.filter(t => isValidTag(t));
        const tagModels = await TagModel.find({ $or: [{ label: { $in: newListTags } }] });
        const needCreate = newListTags.filter(t => !tagModels.find(({ label }) => label === t));
        await Promise.all(needCreate.map(async label => await (new TagModel({ label })).save()));
      }

      list = await TagModel.find({ $or: [{ label: { $in: tags } }] });
    }
    return list;
  }
}

const updateTag = {
  type: TagType,
  args: {
    id: { type: GraphQLID },
    label: { type: GraphQLString },
  },
  resolve: async function (_, { id, ...args }, context) {
    const { user } = context;
    let updateInfo;
    if (user && isValidId(id) && (user.role & ROLES.moderator) === ROLES.moderator) {
      updateInfo = await TagModel.findOneAndUpdate({ _id: id }, { $set: inlineArgs(jsTrim(args, { label: true })) }, { new: true });
    }
    return updateInfo;
  }
}

const deleteTags = {
  type: GraphQLFloat,
  args: {
    ids: { type: new GraphQLList(GraphQLID) }
  },
  resolve: async function (_, { ids }, context) {
    const { user } = context;
    if (ids && user && (user.role & ROLES.moderator) === ROLES.moderator) {
      ids = ids.filter(id => isValidId(id));
      if (ids.length) {
        let deleteInfo = await TagModel.deleteMany({ _id: { $in: ids } });
        return deleteInfo.deletedCount;
      }
    }
    return 0;
  }
}

module.exports = {
  graphql: { createTags, updateTag, deleteTags },
  addTags,
}