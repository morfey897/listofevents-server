const { GraphQLList, GraphQLID, GraphQLString } = require('graphql');

const CityModel = require('../../models/city-model');
const CityType = require('../types/city-type');
const { isValidId } = require('../../utils/validation-utill');

const getCity = {
  type: CityType,
  args: {
    id: { type: GraphQLID }
  },
  description: "Single city by ID",
  resolve: async function (_, { id }) {
    let city = null;
    if (isValidId(id)) {
      city = await CityModel.findById(id);
    }
    if (!city) {
      console.warn("NotFound:", id);
    }
    return city;
  }
}

const getCities = {
  type: new GraphQLList(CityType),
  description: "List of all cities",
  args: {
    filter: { type: GraphQLString }
  },
  resolve: async function (_, {filter}) {
    let findObj = filter ? {$or: [{ru: {$regex: filter, $options: "i"}}, {en: {$regex: filter, $options: "i"}}]} : {};
    let countries = await CityModel.find(findObj);
    return countries;
  }
}

module.exports = {
  getCity,
  getCities
};