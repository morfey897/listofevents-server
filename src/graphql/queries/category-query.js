const { GraphQLList, GraphQLID, GraphQLInt } = require('graphql');

const CategoryModel = require('../../models/category-model');
const CategoryType = require('../types/category-type');
const { isValidId } = require('../../utils/validation-utill');
const FilterType = require('../types/filter-type');
const PaginateType = require('../types/paginate-type');
const { filterField } = require('../../utils/filter-utill');

const MAX_SIZE = 100;

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
    filter: {type: FilterType},
    paginate: { type: PaginateType },
  },
  resolve: async function (_, args) {
    const {filter, paginate} = args || {};
    
    const filterFields = filter && filter.fields || [];
    const filterToken = filter && filter.token || "";
    if (filterToken && !filterFields.length) {
      filterFields.push("name");
    }

    let list = await CategoryModel.find(
      filterToken ? { $or: filterField(filterToken, filterFields) } : {},
      )
      .skip(paginate && paginate.offset || 0)
      .limit(paginate && Math.min(paginate.limit || MAX_SIZE, MAX_SIZE));
    return list;
  }
}

module.exports = {
  getCategory,
  getCategories,
};