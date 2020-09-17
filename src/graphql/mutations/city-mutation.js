const { GraphQLString, GraphQLID, GraphQLNonNull } = require('graphql')

const CityModel = require('../../models/city-model');
const CityType = require('../types/city-type');

const { isValidId, inlineArgs, jsTrim } = require('../../utils/validation-utill');
const TranslateInputType = require('../inputs/translate-input-type');
const CoordsInputType = require('../inputs/coords-input-type');

const { findCountry } = require('../queries/country-query');

const createCity = {
  type: CityType,
  args: {
    country: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(TranslateInputType) },
    coords: { type: CoordsInputType },
  },
  resolve: async function (_, {country, ...args}) {

    let countryModel = await findCountry(jsTrim(country || ""));
    
    if (!countryModel) {
      console.warn('Country not found:', args);
      return;
    }

    args = Object.assign({}, args, { country_id: countryModel._id.toString() });
    let oneModel = await (new CityModel(jsTrim(args, { name: true }))).save();
    return oneModel;
  }
}

const updateCity = {
  type: CityType,
  args: {
    id: { type: GraphQLID },
    country: { type: GraphQLString },
    name: { type: TranslateInputType },
    coords: { type: CoordsInputType },
  },
  resolve: async function (_, { id, country, ...args }) {
    let updateCityInfo;
    if (isValidId(id)) {

      if (country) {
        let countryModel = await findCountry(jsTrim(country || ""));
        if (countryModel) {
          args = Object.assign({}, args, { country_id: countryModel._id.toString() });
        }
      }
      updateCityInfo = await CityModel.findOneAndUpdate({ _id: id }, { $set: inlineArgs(jsTrim(args, { name: true })) }, { new: true });
    }

    if (!updateCityInfo) {
      console.warn('Update city:', id, args);
    }
    return updateCityInfo;
  }
}

const deleteCity = {
  type: CityType,
  args: {
    id: { type: GraphQLID }
  },
  resolve: async function (_, { id }) {
    let deleteCity;
    if (isValidId(id)) {
      deleteCity = await CityModel.findByIdAndRemove(id);
    }
    if (!deleteCity) {
      console.error("Delete city:", id);
    }
    return deleteCity;
  }
}

module.exports = { graphql: {createCity, updateCity, deleteCity} }