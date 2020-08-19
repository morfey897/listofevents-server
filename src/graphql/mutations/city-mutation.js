const { GraphQLString, GraphQLID, GraphQLNonNull } = require('graphql')

const CityModel = require('../../models/city-model');
const CityType = require('../types/city-type');

const { isValidId, jsUcfirst } = require('../../utils/validation-utill');

const createCity = {
  type: CityType,
  args: {
    ru: { type: new GraphQLNonNull(GraphQLString) },
    en: { type: new GraphQLNonNull(GraphQLString) },
  },
  resolve: async function (_, args) {
    Object.keys(args).forEach(name => {
      args[name] = jsUcfirst(args[name]);
    });

    let cityModel = await (new CityModel(args)).save();
    return cityModel;
  }
}

const updateCity = {
  type: CityType,
  args: {
    id: {type: GraphQLID},
    ru: { type: GraphQLString },
    en: { type: GraphQLString }
  },
  resolve: async function (_, {id, ...args}) {
    let updateCityInfo;
    if (isValidId(id)) {
      Object.keys(args).forEach(name => {
        let value = jsUcfirst(args[name]);
        if (!value) {
          delete args[name];
        } else {
          args[name] = value;
        }
      });
  
      updateCityInfo = await CityModel.findByIdAndUpdate(id, args, { new: true });
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