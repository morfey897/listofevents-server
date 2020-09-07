
const { GraphQLObjectType, GraphQLFloat } = require('graphql');

const CoordsType = new GraphQLObjectType({
    name: 'CoordsType',
    description: "This is coords type",
    fields: () => ({
      lat: {type: GraphQLFloat},
      lon: {type: GraphQLFloat},
    })
});

module.exports = CoordsType;