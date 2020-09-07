
const { GraphQLObjectType, GraphQLID } = require('graphql');
const TranslateType = require('./translate-type');
const CoordsType = require('./coords-type');
const CountryType = require('./country-type');
const countryModel = require('../../models/country-model');

const CityType = new GraphQLObjectType({
  name: 'CityType',
  description: "This is city type",
  fields: () => ({
    _id: { type: GraphQLID },
    name: { type: TranslateType },
    coords: { type: CoordsType },
    country: {
      type: CountryType,
      resolve: async function(_) {
        let one = await countryModel.findById(_.country_id);
        return one;
      }
    }
  })
});

module.exports = CityType;