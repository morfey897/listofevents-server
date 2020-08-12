const { GraphQLObjectType } = require('graphql');
const EventMutation = require('./event-muration');

const MurationRootType = new GraphQLObjectType({
  name: 'Mutation',
  description: "Application mutation",
  fields: {
    ...EventMutation,
  }
});

module.exports = MurationRootType;