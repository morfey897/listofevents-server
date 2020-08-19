const { GraphQLInputObjectType, GraphQLInt } = require("graphql");

const PaginateType = new GraphQLInputObjectType({
  name: "PaginateType",
  fields: () => ({
    limit: { type: GraphQLInt },
    offset: { type: GraphQLInt },
  })
});

module.exports = PaginateType;
