const { GraphQLList, GraphQLID, GraphQLString } = require('graphql');

const CountryModel = require('../../models/country-model');
const CountryType = require('../types/country-type');
const { isValidId } = require('../../utils/validation-utill');

const getCountry = {
  type: CountryType,
  args: {
    id: { type: GraphQLID }
  },
  description: "Single country by ID",
  resolve: async function (_, { id }) {
    let country = null;
    if (isValidId(id)) {
      country = await CountryModel.findById(id);
    }
    if (!country) {
      console.warn("NotFound:", id);
    }
    return country;
  }
}

const getCountries = {
  type: new GraphQLList(CountryType),
  description: "List of all countries",
  args: {
    filter: { type: GraphQLString }
  },
  resolve: async function (_, {filter}) {
    let findObj = filter ? {$or: [{ru: {$regex: filter, $options: "i"}}, {en: {$regex: filter, $options: "i"}}]} : {};
    let countries = await CountryModel.find(findObj);
    return countries;
  }
}

module.exports = {
  getCountry,
  getCountries
};