
const { GraphQLString, GraphQLObjectType, GraphQLID, GraphQLList } = require('graphql');
const { GraphQLDateTime } = require('graphql-iso-date');

const CityType = require('./city-type');
const CityModel = require('../../models/city-model');

const CategoryType = require('./category-type');
const CategoryModel = require('../../models/category-model');
const TranslateType = require('./translate-type');
const TagType = require('./tag-type');
const TagModel = require('../../models/tag-model');
const ImageType = require('./image-type');
const ImageModel = require('../../models/image-model');
const CoordsType = require('./coords-type');

const EventType = new GraphQLObjectType({
    name: 'EventType',
    description: "This is event type",
    fields: () => ({
        _id: {type: GraphQLID},
        date: {type: GraphQLDateTime},
        url: {type: GraphQLString},
        name: {type: TranslateType},
        description: {type: TranslateType},
        place: {type: TranslateType},
        coords: {type: CoordsType},
        tags: {
          type: new GraphQLList(TagType),
          resolve: async function(_) {
            let list = await TagModel.find({'_id': { $in: _.tags_id}});
            return list;
          }
        },
        images: {
          type: new GraphQLList(ImageType),
          resolve: async function(_) {
            let list = await ImageModel.find({'_id': { $in: _.images_id}});
            return list;
          }
        },
        category: {
          type: CategoryType,
          resolve: async function(_) {
            let category = await CategoryModel.findById(_.category_id);
            return category;
          }
        },
        city: {
          type: CityType,
          resolve: async function(_) {
            let city = await CityModel.findById(_.city_id);
            return city;
          }
        },
    })
});

module.exports = EventType;