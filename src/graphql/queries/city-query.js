const { GraphQLList, GraphQLID, GraphQLInputObjectType, GraphQLString } = require('graphql');

const CityModel = require('../../models/city-model');
const CityType = require('../types/city-type');
const { isValidId } = require('../../utils/validation-utill');
const PaginateType = require('../types/paginate-type');
const { filterField } = require('../../utils/filter-utill');

const MAX_SIZE = 100;

const FilterCityType = new GraphQLInputObjectType({
  name: "FilterCityType",
  fields: () => ({
    country_id: { type: GraphQLString },
    token: { type: GraphQLString },
    fields: { type: new GraphQLList(GraphQLString) }
  })
});

const findCity = async (city) => {
  const cityModel = await CityModel.findOne(isValidId(city) ? { _id: city } : { $or: filterField(city, ['name'])});
  return cityModel;
}

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
    filter: { type: FilterCityType },
    paginate: { type: PaginateType },
  },
  resolve: async function (_, args) {
    const { filter, paginate } = args || {};

    const filterCountryId = filter && filter.country_id || "";
    const filterFields = filter && filter.fields || [];
    const filterToken = filter && filter.token || "";
    if (filterToken && !filterFields.length) {
      filterFields.push("name");
    }

    let filterObj;
    if (isValidId(filterCountryId)) {
      filterObj = {country_id: filterCountryId};
    }
    if (filterToken) {
      const orCond = { $or: filterField(filterToken, filterFields) };
      if (filterObj) {
        filterObj = {$and: [filterObj, orCond]};
      } else {
        filterObj = orCond;
      }
    }

    let list = await CityModel.find(filterObj || {})
      .skip(paginate && paginate.offset || 0)
      .limit(paginate && Math.min(paginate.limit || MAX_SIZE, MAX_SIZE));
    return list;
  }
}

module.exports = {
  graphql: {
    getCity,
    getCities,
  },
  findCity
};