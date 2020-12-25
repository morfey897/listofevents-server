const { GraphQLInputObjectType, GraphQLInt, GraphQLString } = require("graphql");

const SortByType = new GraphQLInputObjectType({
  name: "SortByType",
  fields: () => ({
    sort: { type: GraphQLInt },
    field: { type: GraphQLString },
  })
});

module.exports = SortByType;
