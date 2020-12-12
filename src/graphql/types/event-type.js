
const { GraphQLString, GraphQLObjectType, GraphQLID, GraphQLList, GraphQLInt } = require('graphql');
const { GraphQLDateTime } = require('graphql-iso-date');

const CityType = require('./city-type');
const CityModel = require('../../models/city-model');

const UserType = require('./user-type');
const UserModel = require('../../models/user-model');

const CategoryType = require('./category-type');
const CategoryModel = require('../../models/category-model');
const TranslateType = require('./translate-type');
const ImageType = require('./image-type');
const ImageModel = require('../../models/image-model');

const EventType = new GraphQLObjectType({
  name: 'EventType',
  description: "This is event type",
  fields: () => ({
    _id: { type: GraphQLID },
    date: { type: GraphQLDateTime },
    duration: { type: GraphQLInt },
    created_at: { type: GraphQLDateTime },
    updated_at: { type: GraphQLDateTime },
    url: { type: GraphQLString },
    name: { type: TranslateType },
    description: { type: TranslateType },
    location: { type: TranslateType },
    tags: { type: new GraphQLList(GraphQLString) },
    images: {
      type: new GraphQLList(ImageType),
      resolve: async function (_) {
        let list = await ImageModel.find({ '_id': { $in: _.images_id } });
        return list;
      }
    },
    category: {
      type: CategoryType,
      resolve: async function (_) {
        let category = await CategoryModel.findById(_.category_id);
        return category;
      }
    },
    city: {
      type: CityType,
      resolve: async function (_) {
        let city = await CityModel.findById(_.city_id);
        return city;
      }
    },
    author: {
      type: UserType,
      resolve: async function (_) {
        let user = await UserModel.findById(_.author_id);
        return user;
      }
    },
  })
});

module.exports = EventType;