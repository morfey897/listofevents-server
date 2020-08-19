const EventQuery = require('./event-query');
const CountryQuery = require('./country-query');
const CityQuery = require('./city-query');
const CategoryQuery = require('./category-query');

module.exports = {
  ...EventQuery,
  ...CategoryQuery,
  ...CountryQuery,
  ...CityQuery
};