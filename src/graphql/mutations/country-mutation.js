const { GraphQLString, GraphQLID, GraphQLNonNull } = require('graphql')

const CountryModel = require('../../models/country-model');
const CountryType = require('../types/country-type');

const { isValidId, jsUcfirst } = require('../../utils/validation-utill');

const createCountry = {
  type: CountryType,
  args: {
    ru: { type: new GraphQLNonNull(GraphQLString) },
    en: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async function (_, args) {
    Object.keys(args).forEach(name => {
      args[name] = jsUcfirst(args[name]);
    });

    let countryModel = await (new CountryModel(args)).save();
    return countryModel;
  }
}

const updateCountry = {
  type: CountryType,
  args: {
    id: {type: GraphQLID},
    ru: { type: GraphQLString },
    en: { type: GraphQLString }
  },
  resolve: async function (_, {id, ...args}) {
    let updateCountryInfo;
    if (isValidId(id)) {
      Object.keys(args).forEach(name => {
        let value = jsUcfirst(args[name]);
        if (!value) {
          delete args[name];
        } else {
          args[name] = value;
        }
      });
  
      updateCountryInfo = await CountryModel.findByIdAndUpdate(id, args, { new: true });
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
    let deleteCountry;
    if (isValidId(id)) {
      deleteCountry = await CountryModel.findByIdAndRemove(id);
    }
    if (!deleteCountry) {
      console.error("Delete country:", id);
    }
    return deleteCountry;
  }
}

module.exports = { createCountry, updateCountry, deleteCountry }