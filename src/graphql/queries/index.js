const EventQuery = require('./event-query');
const CountryQuery = require('./country-query');
const CityQuery = require('./city-query');
const CategoryQuery = require('./category-query');
const TagQuery = require('./tag-query');
const ImageQuery = require('./image-query');

module.exports = {
  ...EventQuery.graphql,
  ...CategoryQuery.graphql,
  ...CountryQuery.graphql,
  ...CityQuery.graphql,
  ...TagQuery.graphql,
  ...ImageQuery.graphql,
};