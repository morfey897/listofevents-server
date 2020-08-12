const { GraphQLSchema } = require('graphql');
const MurationRootType = require('./mutations')
const QueryRootType = require('./queries')

const AppSchema = new GraphQLSchema({
   query: QueryRootType,
   mutation: MurationRootType
});

module.exports = AppSchema;