const EventQuery = require('./event-query');
const CountryQuery = require('./country-query');
const CityQuery = require('./city-query');
const CategoryQuery = require('./category-query');
const TagQuery = require('./tag-query');
const ImageQuery = require('./image-query');

module.exports = {
  ...EventQuery,
  ...CategoryQuery,
  ...CountryQuery,
  ...CityQuery,
  ...TagQuery,
  ...ImageQuery,
};