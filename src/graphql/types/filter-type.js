const { GraphQLInputObjectType, GraphQLString, GraphQLList } = require("graphql");

const FilterType = new GraphQLInputObjectType({
  name: "FilterType",
  fields: () => ({
    token: { type: GraphQLString },
    fields: { type: new GraphQLList(GraphQLString) }
  })
});

module.exports = FilterType;
