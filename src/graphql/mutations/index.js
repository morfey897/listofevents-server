const EventMutation = require('./event-muration');
const CountryMutation = require('./country-mutation');
const CityMutation = require('./city-mutation');
const CategoryMutation = require('./category-mutation');
const TagMutation = require('./tag-mutation');
const ImageMutation = require('./image-mutation');

module.exports = {
  ...EventMutation,
  ...CountryMutation,
  ...CityMutation,
  ...CategoryMutation,
  ...TagMutation,
  ...ImageMutation,
};