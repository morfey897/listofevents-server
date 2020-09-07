
const { GraphQLString, GraphQLObjectType, GraphQLID, GraphQLInt, GraphQLList } = require('graphql');
const TranslateType = require('./translate-type');
const TagType = require('./tag-type');
const ImageType = require('./image-type');

const CategoryType = new GraphQLObjectType({
  name: 'CategoryType',
  description: "This is category type",
  fields: () => ({
    _id: { type: GraphQLID },
    url: { type: GraphQLString },
    name: { type: TranslateType },
    description: { type: TranslateType },
    tags: {
      type: new GraphQLList(TagType),
      resolve: async function(_) {
        let list = await TagType.find({'_id': { $in: _.tags_id}});
        return list;
      }
    },
    images: {
      type: new GraphQLList(ImageType),
      resolve: async function(_) {
        let list = await ImageType.find({'_id': { $in: _.images_id}});
        return list;
      }
    }
  })
});

module.exports = CategoryType;