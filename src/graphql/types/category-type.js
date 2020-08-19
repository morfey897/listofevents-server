
const { GraphQLString, GraphQLObjectType, GraphQLID } = require('graphql');

const CategoryType = new GraphQLObjectType({
    name: 'CategoryType',
    description: "This is category type",
    fields: () => ({
        _id: {type: GraphQLID},
        ru: {type: GraphQLString},
        en: {type: GraphQLString},
    })
});

module.exports = CategoryType;