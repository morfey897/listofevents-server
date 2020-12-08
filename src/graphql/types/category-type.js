
const { GraphQLString, GraphQLObjectType, GraphQLID, GraphQLList } = require('graphql');
const TranslateType = require('./translate-type');

const ImageType = require('./image-type');
const ImageModel = require('../../models/image-model');

const CategoryType = new GraphQLObjectType({
  name: 'CategoryType',
  description: "This is category type",
  fields: () => ({
    _id: { type: GraphQLID },
    url: { type: GraphQLString },
    name: { type: TranslateType },
    description: { type: TranslateType },
    tags: { type: new GraphQLList(GraphQLString) },
    images: {
      type: new GraphQLList(ImageType),
      resolve: async function (_) {
        let list = await ImageModel.find({ '_id': { $in: _.images_id } });
        return list;
      }
    }
  })
});

module.exports = CategoryType;