
const { GraphQLObjectType, GraphQLID, GraphQLString } = require('graphql');
const TranslateType = require('./translate-type');

const CityType = new GraphQLObjectType({
  name: 'CityType',
  description: "This is city type",
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: TranslateType },
    description: { type: TranslateType },
    place_id: { type: GraphQLString },
  })
});

module.exports = CityType;