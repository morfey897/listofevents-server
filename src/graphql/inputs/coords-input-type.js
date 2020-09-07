
const { GraphQLFloat, GraphQLInputObjectType } = require('graphql');

const CoordsInputType = new GraphQLInputObjectType({
    name: 'CoordsInputType',
    description: "This is input coords type",
    fields: () => ({
      lat: {type: GraphQLFloat},
      lon: {type: GraphQLFloat},
    })
});

module.exports = CoordsInputType;