const { GraphQLString, GraphQLID, GraphQLList, GraphQLFloat, GraphQLInt, GraphQLError } = require('graphql')

const UserModel = require('../../models/user-model');
const UserType = require('../types/user-type');

const { isValidId, inlineArgs, jsTrim } = require('../../utils/validation-utill');

const { ROLES } = require("../../config");
const { ERRORCODES } = require('../../errors');

const updateUser = {
  type: UserType,
  args: {
    id: { type: GraphQLString },
    email: { type: GraphQLString },
    phone: { type: GraphQLString },
    password: { type: GraphQLString },

    name: { type: GraphQLString },
    surname: { type: GraphQLString },
    role: { type: GraphQLInt }
  },
  resolve: async function (_, { id, role, ...args }, context) {
    const { user } = context;
    
    let success;
    let error;
    if (!user || ((user.role & ROLES.super_admin) !== ROLES.super_admin && (user.role & ROLES.admin) !== ROLES.admin && user.id !== id)) {
      error = new GraphQLError(ERRORCODES.ERROR_ACCESS_DENIED);
    } else if (!isValidId(id)) {
      error = new GraphQLError(ERRORCODES.ERROR_INCORRECT_ID);
    } else {
      if ((user.role & ROLES.super_admin) == ROLES.super_admin) {
        success = await UserModel.findOneAndUpdate({ _id: id }, { $set: inlineArgs(jsTrim({ ...args, role: role || ROLES.user }, ["email", "phone", "name", "surname"])) }, { new: true });
      } else if ((user.role & ROLES.admin) == ROLES.admin) {
        success = await UserModel.findOneAndUpdate({ _id: id }, { $set: inlineArgs(jsTrim(args, ["email", "phone", "name", "surname"])) }, { new: true });
      } else if (user.id === id) {
        success = await UserModel.findOneAndUpdate({ _id: id }, { $set: inlineArgs(jsTrim(args, ["email", "phone", "name", "surname"])) }, { new: true });
      }
    }
    if (!success) {
      throw (error || new GraphQLError(ERRORCODES.ERROR_WRONG));
    }
    return success;
  }
}

const deleteUser = {
  type: GraphQLInt,
  args: {
    ids: { type: new GraphQLList(GraphQLString) }
  },
  resolve: async function (_, { ids }, context) {
    const { user } = context;
    if (!user || (user.role & ROLES.super_admin) !== ROLES.super_admin) {
      throw new GraphQLError(ERRORCODES.ERROR_ACCESS_DENIED);
    } else {
      ids = ids && ids.filter(id => isValidId(id)) || [];
      if (ids.length) {
        let deleteInfo = await UserModel.deleteMany({ _id: { $in: ids } });
        return deleteInfo.deletedCount;
      }
    }
    return 0;
  }
}

module.exports = {
  graphql: { updateUser, deleteUser },
}