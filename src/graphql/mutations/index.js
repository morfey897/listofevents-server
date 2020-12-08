const EventMutation = require('./event-muration');
const CityMutation = require('./city-mutation');
const CategoryMutation = require('./category-mutation');
const ImageMutation = require('./image-mutation');
const UserMutation = require('./user-mutation');

module.exports = {
  ...EventMutation.graphql,
  ...CityMutation.graphql,
  ...CategoryMutation.graphql,
  ...ImageMutation.graphql,
  ...UserMutation.graphql,
};