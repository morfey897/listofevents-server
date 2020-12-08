const EventQuery = require('./event-query');
const CityQuery = require('./city-query');
const CategoryQuery = require('./category-query');
const TagQuery = require('./tag-query');
const ImageQuery = require('./image-query');
const UserQuery = require('./user-query');

module.exports = {
  ...EventQuery.graphql,
  ...CategoryQuery.graphql,
  ...CityQuery.graphql,
  ...TagQuery.graphql,
  ...ImageQuery.graphql,
  ...UserQuery.graphql
};