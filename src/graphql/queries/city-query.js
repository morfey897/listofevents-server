const { GraphQLList, GraphQLID, GraphQLInt } = require('graphql');

const CityModel = require('../../models/city-model');
const CityType = require('../types/city-type');
const { isValidId } = require('../../utils/validation-utill');
const FilterType = require('../types/filter-type');
const PaginateType = require('../types/paginate-type');
const { filterField } = require('../../utils/filter-utill');

const MAX_SIZE = 100;

const getCity = {
  type: CityType,
  args: {
    id: { type: GraphQLID }
  },
  description: "Single city by ID",
  resolve: async function (_, { id }) {
    let one = null;
    if (isValidId(id)) {
      one = await CityModel.findById(id);
    }
    if (!one) {
      console.warn("NotFound:", id);
    }
    return one;
  }
}

const getCities = {
  type: new GraphQLList(CityType),
  description: "List of all cities",
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

    let list = await CityModel.find(
      filterToken ? { $or: filterField(filterToken, filterFields) } : {},
      )
      .skip(paginate && paginate.offset || 0)
      .limit(paginate && Math.min(paginate.limit || MAX_SIZE, MAX_SIZE));
    return list;
  }
}

module.exports = {
  getCity,
  getCities,
};