
const { GraphQLObjectType, GraphQLString, GraphQLID } = require('graphql');

const TagType = new GraphQLObjectType({
    name: 'TagType',
    description: "This is tag type",
    fields: () => ({
      _id: { type: GraphQLID },
      label: {type: GraphQLString},
    })
});

module.exports = TagType;