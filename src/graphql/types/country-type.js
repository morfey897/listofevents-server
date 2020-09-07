const { GraphQLObjectType, GraphQLID } = require('graphql');
const TranslateType = require('./translate-type');
const CoordsType = require('./coords-type');

const CountryType = new GraphQLObjectType({
  name: 'CountryType',
  description: "This is country type",
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: TranslateType },
    coords: { type: CoordsType },
  })
});

module.exports = CountryType;
