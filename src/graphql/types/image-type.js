
const { GraphQLObjectType, GraphQLString, GraphQLID } = require('graphql');

const ImageType = new GraphQLObjectType({
  name: 'ImageType',
  description: "This is image type",
  fields: () => ({
    _id: { type: GraphQLID },
    url: { type: GraphQLString },
  })
});

module.exports = ImageType;