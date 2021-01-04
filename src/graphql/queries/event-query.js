const { GraphQLList, GraphQLID, GraphQLString, GraphQLInt, GraphQLInputObjectType, GraphQLError, GraphQLObjectType } = require('graphql');
const { GraphQLDate } = require('graphql-iso-date');

const EventModel = require('../../models/event-model');
const EventType = require('../types/event-type');

const { isValidId } = require('../../utils/validation-utill');
const PaginateType = require('../types/paginate-type');
const SortByType = require('../types/sortby-type');
const { ERRORCODES } = require('../../errors');

const MAX_SIZE = 100;

const ResultType = new GraphQLObjectType({
  name: "ResultTypeEvents",
  fields: () => ({
    offset: { type: GraphQLInt },
    total: { type: GraphQLInt },
    list: { type: new GraphQLList(EventType) }
  })
});

const FilterEventType = new GraphQLInputObjectType({
  name: "FilterEventType",
  fields: () => ({
    dateFrom: { type: GraphQLDate },
    dateTo: { type: GraphQLDate },
    cities_id: { type: new GraphQLList(GraphQLString) },
    categories_id: { type: new GraphQLList(GraphQLString) },
    tags: { type: new GraphQLList(GraphQLString) },
  })
});

const getEvent = {
  type: EventType,
  args: {
    id: { type: GraphQLString },
    url: { type: GraphQLString }
  },
  description: "Single event by ID",
  resolve: async function (_, { id, url }) {
    let one = null;
    if (id && isValidId(id)) {
      one = await EventModel.findById(id);
    } else if (url) {
      one = await EventModel.findOne({ url: url });
    } else {
      throw new GraphQLError(ERRORCODES.ERROR_INCORRECT_ID);
    }
    return one;
  }
}

const getEvents = {
  type: ResultType,
  description: "List of all events",
  args: {
    filter: { type: FilterEventType },
    sortBy: { type: SortByType },
    paginate: { type: PaginateType }
  },
  resolve: async function (_, args) {
    const { filter, sortBy, paginate } = args || {};
    const filterCityId = filter && filter.cities_id || [];
    const filterCategoryId = filter && filter.categories_id || [];
    const filterTags = filter && filter.tags || [];
    const dateFrom = filter && filter.dateFrom;
    const dateTo = filter && filter.dateTo;

    const filterObj = [];
    dateFrom && filterObj.push({ date: { $gte: dateFrom } });
    dateTo && filterObj.push({ date: { $lte: dateTo } });

    filterCityId.length && filterObj.push({ city_id: { $in: filterCityId } });
    filterCategoryId.length && filterObj.push({ category_id: { $in: filterCategoryId } });
    filterTags.length && filterObj.push({ tags: { $in: filterTags } });

    const limit = paginate && Math.min(paginate.limit || MAX_SIZE, MAX_SIZE);
    const total = await EventModel.countDocuments();
    const offset = Math.min(paginate && paginate.offset || 0, total);

    let list = await EventModel.find(
      filterObj.length ? { $and: filterObj } : {},
      null,
      {
        sort: sortBy ? { [sortBy.field]: sortBy.sort } : {}
      })
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
    getEvent,
    getEvents,
  }
};