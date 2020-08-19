
const { GraphQLString, GraphQLObjectType, GraphQLID } = require('graphql');

const CountryType = new GraphQLObjectType({
    name: 'CountryType',
    description: "This is country type",
    fields: () => ({
        _id: {type: GraphQLID},
        ru: {type: GraphQLString},
        en: {type: GraphQLString},
    })
});

module.exports = CountryType;