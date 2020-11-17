
const { GraphQLObjectType, GraphQLString, GraphQLID, GraphQLInt } = require('graphql');

const UserType = new GraphQLObjectType({
    name: 'UserType',
    description: "This is user type",
    fields: () => ({
      _id: { type: GraphQLID },
      email: {type: GraphQLString},
      phone: {type: GraphQLString},

      name: {type: GraphQLString},
      surname: {type: GraphQLString},
      password: {type: GraphQLString},
      role: {type: GraphQLInt}
    })
});

module.exports = UserType;