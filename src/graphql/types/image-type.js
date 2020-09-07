
const { GraphQLObjectType, GraphQLString } = require('graphql');

const ImageType = new GraphQLObjectType({
    name: 'ImageType',
    description: "This is image type",
    fields: () => ({
      url: {type: GraphQLString},
    })
});

module.exports = ImageType;