const { GraphQLList, GraphQLID } = require('graphql');

const CountryModel = require('../../models/country-model');
const CountryType = require('../types/country-type');
const { isValidId } = require('../../utils/validation-utill');
const FilterType = require('../types/filter-type');
const { filterField } = require('../../utils/filter-utill');
const PaginateType = require('../types/paginate-type');

const MAX_SIZE = 100;

const getCountry = {
  type: CountryType,
  args: {
    id: { type: GraphQLID }
  },
  description: "Single country by ID",
  resolve: async function (_, { id }) {
    let one = null;
    if (isValidId(id)) {
      one = await CountryModel.findById(id);
    }
    if (!one) {
      console.warn("NotFound:", id);
    }
    return one;
  }
}

const getCountries = {
  type: new GraphQLList(CountryType),
  description: "List of all countries",
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

    let list = await CountryModel.find(
      filterToken ? { $or: filterField(filterToken, filterFields) } : {},
      )
      .skip(paginate && paginate.offset || 0)
      .limit(paginate && Math.min(paginate.limit || MAX_SIZE, MAX_SIZE));
    return list;
  }
}

module.exports = {
  getCountry,
  getCountries
};