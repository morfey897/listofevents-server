const { GraphQLID, GraphQLString, GraphQLNonNull } = require('graphql')

const CountryModel = require('../../models/country-model');
const CountryType = require('../types/country-type');
const TranslateInputType = require('../inputs/translate-input-type');
const CoordsInputType = require('../inputs/coords-input-type');

const { isValidId, jsTrim, inlineArgs } = require('../../utils/validation-utill');

const createCountry = {
  type: CountryType,
  args: {
    iso_code: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(TranslateInputType) },
    coords: { type: CoordsInputType },
  },
  resolve: async function (_, args) {
    let oneModel = await (new CountryModel(jsTrim(args, {name: true, iso_code: true}))).save();
    return oneModel;
  }
}

const updateCountry = {
  type: CountryType,
  args: {
    id: {type: GraphQLID},
    iso_code: { type: GraphQLString },
    name: { type: TranslateInputType },
    coords: { type: CoordsInputType },
  },
  resolve: async function (_, {id, ...args}) {
    let updateCountryInfo;
    if (isValidId(id)) {
      updateCountryInfo = await CountryModel.findOneAndUpdate({_id: id}, {$set: inlineArgs(jsTrim(args, {name: true, iso_code: true}))}, { new: true });
    }
    
    if (!updateCountryInfo) {
      console.warn('Update country:', id, args);
    }
    return updateCountryInfo;
  }
}

const deleteCountry = {
  type: CountryType,
  args: {
    id: { type: GraphQLID }
  },
  resolve: async function (_, {id}) {
    let deleteInfo;
    if (isValidId(id)) {
      deleteInfo = await CountryModel.findByIdAndRemove(id);
    }
    if (!deleteInfo) {
      console.error("Delete country:", id);
    }
    return deleteInfo;
  }
}

module.exports = { graphql: {createCountry, updateCountry, deleteCountry} }