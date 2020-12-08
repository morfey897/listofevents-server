const { GraphQLList, GraphQLID, GraphQLObjectType, GraphQLInt } = require('graphql');

const CityModel = require('../../models/city-model');
const CityType = require('../types/city-type');
const { isValidId } = require('../../utils/validation-utill');
const PaginateType = require('../types/paginate-type');

const MAX_SIZE = 100;

const ResultType = new GraphQLObjectType({
  name: "ResultTypeCities",
  fields: () => ({
    offset: { type: GraphQLInt },
    total: { type: GraphQLInt },
    list: { type: new GraphQLList(CityType) }
  })
});

const getCity = {
  type: CityType,
  args: {
    id: { type: GraphQLID }
  },
  description: "Single city by ID",
  resolve: async function (_, { id }) {
    let one = null;
    if (isValidId(id)) {
      one = await CityModel.findById(id);
    }
    if (!one) {
      console.warn("NotFound:", id);
    }
    return one;
  }
}

const getCities = {
  type: ResultType,
  description: "List of all cities",
  args: {
    paginate: { type: PaginateType },
  },
  resolve: async function (_, args) {
    const { paginate } = args || {};
    const limit = paginate && Math.min(paginate.limit || MAX_SIZE, MAX_SIZE);
    const total = await CityModel.countDocuments();
    const offset = Math.min(paginate && paginate.offset || 0, total);
    let list = await CityModel.find({})
      .skip(offset)
      .limit(limit);

    return {
      list,
      offset,
      total 
    };
  }
}

module.exports = {
  graphql: {
    getCity,
    getCities,
  },
};