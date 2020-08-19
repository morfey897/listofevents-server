const { GraphQLList, GraphQLID, GraphQLString } = require('graphql');

const CategoryModel = require('../../models/category-model');
const CategoryType = require('../types/category-type');
const { isValidId } = require('../../utils/validation-utill');

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
    }
    if (!category) {
      console.warn("NotFound:", id);
    }
    return category;
  }
}

const getCategories = {
  type: new GraphQLList(CategoryType),
  description: "List of all categories",
  args: {
    filter: { type: GraphQLString }
  },
  resolve: async function (_, {filter}) {
    let findObj = filter ? {$or: [{ru: {$regex: filter, $options: "i"}}, {en: {$regex: filter, $options: "i"}}]} : {};
    let categories = await CategoryModel.find(findObj);
    return categories;
  }
}

module.exports = {
  getCategory,
  getCategories
};