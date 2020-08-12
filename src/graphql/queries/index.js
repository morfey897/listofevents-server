const { GraphQLObjectType } = require('graphql');
const EventQuery = require('./event-query');

const QueryRootType = new GraphQLObjectType({
  name: 'ServiceAppSchema',
  description: "Application Schema Query Root",
  fields: {
    ...EventQuery
  }
});

module.exports = QueryRootType;