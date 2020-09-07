
const { GraphQLObjectType, GraphQLString } = require('graphql');

const TagType = new GraphQLObjectType({
    name: 'TagType',
    description: "This is tag type",
    fields: () => ({
      label: {type: GraphQLString},
    })
});

module.exports = TagType;