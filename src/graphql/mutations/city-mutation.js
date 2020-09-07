const { GraphQLString, GraphQLID, GraphQLNonNull, GraphQLInputObjectType } = require('graphql')

const CityModel = require('../../models/city-model');
const CityType = require('../types/city-type');

const { isValidId, jsLowerCase, inlineArgs } = require('../../utils/validation-utill');
const CountryModel = require('../../models/country-model');
const TranslateInputType = require('../inputs/translate-input-type');
const CoordsInputType = require('../inputs/coords-input-type');

const CountryCityInputType = new GraphQLInputObjectType({
  name: "CountryCityInputType",
  fields: () => ({
    name: { type: new GraphQLNonNull(TranslateInputType) },
    coords: { type: CoordsInputType },
  })
});


const createCity = {
  type: CityType,
  args: {
    country_id: { type: GraphQLString},
    country: { type: CountryCityInputType},

    name: { type: TranslateInputType },
    coords: { type: CoordsInputType },
  },
  resolve: async function (_, args) {
    let countryModel;

    if ((args.country_id || !isValidId(args.country_id)) && args.country) {
      countryModel = await (new CountryModel(jsLowerCase(args.country, {name: true}))).save();
    } else {
      countryModel = await CountryModel.findOne({_id: args.country_id});
    }
    if (!countryModel) {
      console.warn('Country not found:', args);
      return;
    }
    delete args.country;
    args.country_id = countryModel._id;
    let oneModel = await (new CityModel(jsLowerCase(args, {name: true}))).save();
    return oneModel;
  }
}

const updateCity = {
  type: CityType,
  args: {
    id: {type: GraphQLID},
    country_id: { type: GraphQLString},
    name: { type: TranslateInputType },
    coords: { type: CoordsInputType },
  },
  resolve: async function (_, {id, ...args}) {
    let updateCityInfo;
    if (isValidId(id)) {

      if (args.country_id) {
        let countryModel = await CountryModel.findOne({_id: args.country_id});
        if (!countryModel) {
          delete args.country_id;
        }
      }
      
      updateCityInfo = await CityModel.findOneAndUpdate({_id: id}, {$set: inlineArgs(jsLowerCase(args, {name: true}))}, { new: true });
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
  resolve: async function (_, {id}) {
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