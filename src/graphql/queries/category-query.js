const { GraphQLList, GraphQLID, GraphQLObjectType, GraphQLInt, GraphQLError, GraphQLString } = require('graphql');

const CategoryModel = require('../../models/category-model');
const CategoryType = require('../types/category-type');
const { isValidId } = require('../../utils/validation-utill');
const PaginateType = require('../types/paginate-type');
const { filterField } = require('../../utils/filter-utill');
const { ERRORCODES } = require('../../errors');

const MAX_SIZE = 100;

const findCategory = async (category) => {
  const categoryModel = await CategoryModel.findOne(isValidId(category) ? { _id: category } : { $or: filterField(category, ['name']) });
  return categoryModel;
}

const ResultType = new GraphQLObjectType({
  name: "ResultTypeCategories",
  fields: () => ({
    offset: { type: GraphQLInt },
    total: { type: GraphQLInt },
    list: { type: new GraphQLList(CategoryType) }
  })
});

const getCategory = {
  type: CategoryType,
  args: {
    id: { type: GraphQLString },
    url: { type: GraphQLString }
  },
  description: "Single category by ID",
  resolve: async function (_, { id, url }) {
    let one = null;
    if (isValidId(id)) {
      one = await CategoryModel.findById(id);
    } else if (url) {
      one = await CategoryModel.findOne({ url: url });
    } else {
      throw new GraphQLError(ERRORCODES.ERROR_INCORRECT_ID);
    }
    return one;
  }
}

const getCategories = {
  type: ResultType,
  description: "List of all categories",
  args: {
    ids: { type: new GraphQLList(GraphQLString) },
    paginate: { type: PaginateType },
  },
  resolve: async function (_, args) {
    const { paginate, ids } = args || {};
    let idList = ids && ids.filter(id => isValidId(id)) || [];
    let list = [];
    let offset = 0;
    const total = await CategoryModel.countDocuments();
    if (idList.length) {
      list = await CategoryModel.find({ '_id': { $in: idList } });
    } else {
      const limit = paginate && Math.min(paginate.limit || MAX_SIZE, MAX_SIZE);
      offset = Math.min(paginate && paginate.offset || 0, total);
      list = await CategoryModel.find({})
        .skip(offset)
        .limit(limit);
    }

    return {
      list,
      offset,
      total
    };
  }
}

module.exports = {
  graphql: {
    getCategory,
    getCategories,
  },
  findCategory
};