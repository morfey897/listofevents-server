const { GraphQLString, GraphQLID, GraphQLNonNull } = require('graphql')

const CityModel = require('../../models/city-model');
const CityType = require('../types/city-type');

const { isValidId, jsLowerCase, inlineArgs, jsTrim } = require('../../utils/validation-utill');
const CountryModel = require('../../models/country-model');
const TranslateInputType = require('../inputs/translate-input-type');
const CoordsInputType = require('../inputs/coords-input-type');

const _prepareArgs = (args, filter) => jsLowerCase(jsTrim(args, filter), filter);

const createCity = {
  type: CityType,
  args: {
    country: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(TranslateInputType) },
    coords: { type: CoordsInputType },
  },
  resolve: async function (_, args) {

    const country = args.country.trim();
    const countryModel = await CountryModel.findOne(isValidId(country) ? { _id: country } : { $or: [{ iso_code: { $regex: country, $options: "i" } }, { 'name.ru': { $regex: country, $options: "i" } }, { 'name.en': { $regex: country, $options: "i" } }] });

    if (!countryModel) {
      console.warn('Country not found:', args);
      return;
    }

    args = Object.assign({}, args, { country_id: countryModel._id.toString() });
    let oneModel = await (new CityModel(_prepareArgs(args, { name: true }))).save();
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
  resolve: async function (_, { id, ...args }) {
    let updateCityInfo;
    if (isValidId(id)) {

      if (args.country) {
        const country = args.country.trim();
        const countryModel = await CountryModel.findOne(isValidId(country) ? { _id: country } : { $or: [{ iso_code: { $regex: country, $options: "i" } }, { 'name.ru': { $regex: country, $options: "i" } }, { 'name.en': { $regex: country, $options: "i" } }] });
        if (countryModel) {
          args = Object.assign({}, args, { country_id: countryModel._id.toString() });
        }
      }
      updateCityInfo = await CityModel.findOneAndUpdate({ _id: id }, { $set: inlineArgs(_prepareArgs(args, { name: true })) }, { new: true });
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

module.exports = { createCity, updateCity, deleteCity }