
const { GraphQLString, GraphQLObjectType, GraphQLID, GraphQLFloat } = require('graphql');
const { GraphQLDateTime } = require('graphql-iso-date');

const CountryType = require('./country-type');
const CountryModel = require('../../models/country-model');

const CityType = require('./city-type');
const CityModel = require('../../models/city-model');

const CategoryType = require('./category-type');
const CategoryModel = require('../../models/category-model');

const EventType = new GraphQLObjectType({
    name: 'EventType',
    description: "This is event type",
    fields: () => ({
        _id: {type: GraphQLID},
        date: {type: GraphQLDateTime},
        
        country_id: {type: GraphQLString},
        city_id: {type: GraphQLString},
        category_id: {type: GraphQLString},
        
        // country: {
        //   type: CountryType,
        //   resolve: async function(_) {
        //     let country = await CountryModel.findById(_.country_id);
        //     return country;
        //   }
        // },
        // city: {
        //   type: CityType,
        //   resolve: async function(_) {
        //     let city = await CityModel.findById(_.city_id);
        //     return city;
        //   }
        // },
        // category: {
        //   type: CategoryType,
        //   resolve: async function(_) {
        //     let category = await CategoryModel.findById(_.category_id);
        //     return category;
        //   }
        // },

        description: {type: GraphQLString},
        place: {type: new GraphQLObjectType({
          name: "GEOType",
          description: "geo position",
          fields: () => ({
            name: {type: GraphQLString},
            lat: {type: GraphQLFloat},
            lon: {type: GraphQLFloat},
          })
        })
        }
    })
});

module.exports = EventType;