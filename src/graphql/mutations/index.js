const EventMutation = require('./event-muration');
const CountryMutation = require('./country-mutation');
const CityMutation = require('./city-mutation');
const CategoryMutation = require('./category-mutation');
const TagMutation = require('./tag-mutation');
const ImageMutation = require('./image-mutation');
const UserMutation = require('./user-mutation');

module.exports = {
  ...EventMutation.graphql,
  ...CountryMutation.graphql,
  ...CityMutation.graphql,
  ...CategoryMutation.graphql,
  ...TagMutation.graphql,
  ...ImageMutation.graphql,
  ...UserMutation.graphql,
};