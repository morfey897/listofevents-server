const { GraphQLList, GraphQLID } = require('graphql');
const { isValidId } = require('../../utils/validation-utill');

const UserModel = require('../../models/user-model');
const UserType = require('../types/user-type');
const PaginateType = require('../types/paginate-type');

const { ROLES } = require("../../config");
const MAX_SIZE = 100;

const getUser = {
  type: UserType,
  args: {
    id: { type: GraphQLID }
  },
  description: "Single user by ID",
  resolve: async function (_, { id }, context) {
    const { user } = context || {};
    let one = null;
    if (user && (user.role & ROLES.moderator == ROLES.moderator) && isValidId(id)) {
      one = await UserModel.findById(id);
    }
    return one;
  }
}

const getUsers = {
  type: new GraphQLList(UserType),
  description: "List of all users",
  args: {
    paginate: { type: PaginateType },
  },
  resolve: async function (_, args, context) {
    const { paginate } = args || {};
    const { user } = context || {};
    let list = null;

    if (user && (user.role & ROLES.moderator == ROLES.moderator)) {
      list = await UserModel.find({})
        .skip(paginate && paginate.offset || 0)
        .limit(paginate && Math.min(paginate.limit || MAX_SIZE, MAX_SIZE))
    }

    return list;
  }
}

module.exports = {
  graphql: {
    getUser,
    getUsers,
  }
};