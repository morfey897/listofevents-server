const { GraphQLList, GraphQLID, GraphQLObjectType, GraphQLInt, GraphQLError } = require('graphql');

const CategoryModel = require('../../models/category-model');
const CategoryType = require('../types/category-type');
const { isValidId } = require('../../utils/validation-utill');
const PaginateType = require('../types/paginate-type');
const { filterField } = require('../../utils/filter-utill');
const { ERRORCODES } = require('../../errors');

const MAX_SIZE = 100;

const findCategory = async (category) => {
  const categoryModel = await CategoryModel.findOne(isValidId(category) ? { _id: category } : { $or: filterField(category, ['name'])});
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
    id: { type: GraphQLID }
  },
  description: "Single category by ID",
  resolve: async function (_, { id }) {
    let category = null;
    if (isValidId(id)) {
      category = await CategoryModel.findById(id);
    } else {
      throw new GraphQLError(ERRORCODES.ERROR_INCORRECT_ID);
    }
    if (!category) {
      console.warn("NotFound:", id);
    }
    return category;
  }
}

const getCategories = {
  type: ResultType,
  description: "List of all categories",
  args: {
    paginate: { type: PaginateType },
  },
  resolve: async function (_, args) {
    const { paginate } = args || {};
    const limit = paginate && Math.min(paginate.limit || MAX_SIZE, MAX_SIZE);
    const total = await CategoryModel.countDocuments();
    const offset = Math.min(paginate && paginate.offset || 0, total);
    let list = await CategoryModel.find({})
      .skip(offset)
      .limit(limit);

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