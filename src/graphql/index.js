const { GraphQLSchema, GraphQLObjectType } = require('graphql');
const mutations = require('./mutations')
const queries = require('./queries')

const MurationRootType = new GraphQLObjectType({
  name: 'Mutation',
  description: "Application mutation",
  fields: mutations
});


const QueryRootType = new GraphQLObjectType({
  name: 'ServiceAppSchema',
  description: "Application Schema Query Root",
  fields: queries
});


const AppSchema = new GraphQLSchema({
   query: QueryRootType,
   mutation: MurationRootType
});

module.exports = AppSchema;