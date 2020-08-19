
const { GraphQLString, GraphQLObjectType, GraphQLID } = require('graphql');

const CityType = new GraphQLObjectType({
    name: 'CityType',
    description: "This is city type",
    fields: () => ({
        _id: {type: GraphQLID},
        ru: {type: GraphQLString},
        en: {type: GraphQLString},
    })
});

module.exports = CityType;