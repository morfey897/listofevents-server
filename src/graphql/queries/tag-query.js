const { GraphQLList, GraphQLID, GraphQLInt } = require('graphql');
const { isValidId } = require('../../utils/validation-utill');

const TagModel = require('../../models/tag-model');
const TagType = require('../types/tag-type');
const PaginateType = require('../types/paginate-type');
const FilterType = require('../types/filter-type');

const MAX_SIZE = 100;

const getTag = {
  type: TagType,
  args: {
    id: { type: GraphQLID }
  },
  description: "Single tag by ID",
  resolve: async function (_, { id }) {
    let one = null;
    if (isValidId(id)) {
      one = await TagModel.findById(id);
    }
    if (!one) {
      console.warn("NotFound:", id);
    }
    return one;
  }
}

const getTags = {
  type: new GraphQLList(TagType),
  description: "List of all tags",
  args: {
    filter: {type: FilterType},
    paginate: { type: PaginateType },
  },
  resolve: async function (_, args) {
    const {filter, paginate} = args || {};

    const filterFields = filter && filter.fields || [];
    const filterToken = filter && filter.token || "";
    if (filterToken && !filterFields.length) {
      filterFields.push("label");
    }
    
    let list = await TagModel.find(
      filterToken ? { $or: filterFields.map((f) => ({[f]: {$regex: filter.token, $options: "i"}})) } : {},
      )
      .skip(paginate && paginate.offset || 0)
      .limit(paginate && Math.min(paginate.limit || MAX_SIZE, MAX_SIZE));

    return list;
  }
}

module.exports = {
  getTag,
  getTags
};