const { GraphQLList, GraphQLString, GraphQLObjectType, GraphQLInt } = require('graphql');

const CategoryModel = require('../../models/category-model');
const EventModel = require('../../models/event-model');

const PaginateType = require('../types/paginate-type');

const MAX_SIZE = 100;

const ResultType = new GraphQLObjectType({
  name: "ResultTypeTags",
  fields: () => ({
    offset: { type: GraphQLInt},
    total: { type: GraphQLInt },
    list: { type: new GraphQLList(GraphQLString) }
  })
});

const getTags = {
  type: ResultType,
  description: "List of all tags",
  args: {
    paginate: { type: PaginateType }
  },
  resolve: async function (_, args) {
    const { paginate } = args;

    const limit = paginate && Math.min(paginate.limit || MAX_SIZE, MAX_SIZE);

    let events = await EventModel.find({}).limit(limit);
    let categories = await CategoryModel.find({}).limit(limit);
    
    const list = [].concat(categories.map(({ tags }) => tags), events.map(({ tags }) => tags)).reduce((prev, tags) => {
      return [...new Set(prev.concat(tags))];
    }, []).slice(0, limit);

    return {
      offset: 0,
      list,
      total: list.length
    };
  }
}

module.exports = {
  graphql: {
    getTags,
  }
};