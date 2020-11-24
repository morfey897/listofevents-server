const { GraphQLString, GraphQLID, GraphQLList, GraphQLFloat, GraphQLInt } = require('graphql')

const UserModel = require('../../models/user-model');
const UserType = require('../types/user-type');

const { isValidId, inlineArgs, jsTrim } = require('../../utils/validation-utill');

const { ROLES } = require("../../config");

const updateUser = {
  type: UserType,
  args: {
    id: {type: GraphQLID},
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    password: { type: GraphQLString },

    name: {type: GraphQLString},
    surname: {type: GraphQLString},
    role: {type: GraphQLInt}
  },
  resolve: async function (_, {id, role, ...args}, context) {
    const {user} = context;

    let updateInfo;
    if (user && isValidId(id)) {
      if ((user.role & ROLES.super_admin) == ROLES.super_admin) {
        updateInfo = await UserModel.findOneAndUpdate({ _id: id }, { $set: inlineArgs(jsTrim({...args, role: role || ROLES.user}, ["email", "phone", "name", "surname"])) }, { new: true });
      } else if ((user.role & ROLES.admin) == ROLES.admin) {
        updateInfo = await UserModel.findOneAndUpdate({ _id: id }, { $set: inlineArgs(jsTrim(args, ["email", "phone", "name", "surname"])) }, { new: true });
      } else if (user.id === id) {
        updateInfo = await UserModel.findOneAndUpdate({ _id: id }, { $set: inlineArgs(jsTrim(args, ["email", "phone", "name", "surname"])) }, { new: true });
      } 
    }
    return updateInfo;
  }
}

const deleteUser = {
  type: GraphQLFloat,
  args: {
    ids: { type: new GraphQLList(GraphQLID) }
  },
  resolve: async function (_, {ids}, context) {
    const {user} = context;
    if (ids && user && (user.role & ROLES.super_admin) === ROLES.super_admin) {
      ids = ids.filter(id => isValidId(id));
      if (ids.length) {
        let deleteInfo = await UserModel.deleteMany({_id: {$in: ids}});
        return deleteInfo.deletedCount;
      }
    }
    return 0;
  }
}

module.exports = {  
  graphql: {updateUser, deleteUser},
}