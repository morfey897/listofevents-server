const { GraphQLString, GraphQLID, GraphQLFloat, GraphQLInputObjectType } = require('graphql')

const CountryModel = require('../../models/country-model');
const CountryType = require('../types/country-type');
const TranslateInputType = require('../inputs/translate-input-type');
const CoordsInputType = require('../inputs/coords-input-type');

const { isValidId, jsLowerCase, inlineArgs } = require('../../utils/validation-utill');

const createCountry = {
  type: CountryType,
  args: {
    name: { type: TranslateInputType },
    coords: { type: CoordsInputType },
  },
  resolve: async function (_, args) {
    let oneModel = await (new CountryModel(jsLowerCase(args, {name: true}))).save();
    return oneModel;
  }
}

const updateCountry = {
  type: CountryType,
  args: {
    id: {type: GraphQLID},
    name: { type: TranslateInputType },
    coords: { type: CoordsInputType },
  },
  resolve: async function (_, {id, ...args}) {
    let updateCountryInfo;
    if (isValidId(id)) {
      updateCountryInfo = await CountryModel.findOneAndUpdate({_id: id}, {$set: inlineArgs(jsLowerCase(args, {name: true}))}, { new: true });
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

module.exports = { createCountry, updateCountry, deleteCountry }