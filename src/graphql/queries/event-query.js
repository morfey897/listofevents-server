const { GraphQLList, GraphQLID, GraphQLString, GraphQLInt, GraphQLInputObjectType } = require('graphql');
const { GraphQLDateTime } = require('graphql-iso-date');

const EventModel = require('../../models/event-model');
const EventType = require('../types/event-type');

const { isValidId } = require('../../utils/validation-utill');
const PaginateType = require('../types/paginate-type');

const MAX_SIZE = 100;

const FilterEventType = new GraphQLInputObjectType({
  name: "FilterEventType",
  fields: () => ({
    dateFrom: { type: GraphQLDateTime },
    dateTo: { type: GraphQLDateTime },
    cities_id: { type: new GraphQLList(GraphQLString) },
    categories_id: { type: new GraphQLList(GraphQLString) },
    tags_id: { type: new GraphQLList(GraphQLString) },
  })
});

const getEvent = {
  type: EventType,
  args: {
    id: { type: GraphQLID }
  },
  description: "Single event by ID",
  resolve: async function (_, { id }) {
    let one = null;
    if (isValidId(id)) {
      one = await EventModel.findById(id);
    }
    if (!one) {
      console.warn("NotFound:", id);
    }
    return one;
  }
}

const getEvents = {
  type: new GraphQLList(EventType),
  description: "List of all events",
  args: {
    filter: { type: FilterEventType },
    sortBy: { type: GraphQLInt },
    paginate: { type: PaginateType }
  },
  resolve: async function (_, args) {
    const { filter, sortBy, paginate } = args || {};
    const filterCityId = filter && filter.cities_id || [];
    const filterCategoryId = filter && filter.categories_id || [];
    const filterTagId = filter && filter.tags_id || [];

    const dateFrom = filter && filter.dateFrom;
    const dateTo = filter && filter.dateTo;

    const filterObj = [];
    dateFrom && filterObj.push({ date: { $gte: dateFrom } });
    dateTo && filterObj.push({ date: { $lte: dateTo } });

    filterCityId.length && filterObj.push({ city_id: {$in: filterCityId} });
    filterCategoryId.length && filterObj.push({ category_id: {$in: filterCategoryId} });
    filterTagId.length && filterObj.push({ tags_id: {$in: filterTagId} });

    let skip = paginate && paginate.offset || 0;
    let limit = paginate && paginate.limit;

    if (dateFrom && dateTo) {
      limit = limit || Number.MAX_SAFE_INTEGER;
    } else {
      limit = Math.min(limit || MAX_SIZE, MAX_SIZE);
    }

    let events = await EventModel.find(
      filterObj.length ? { $and: filterObj } : {},
      null,
      {
        sort: { date: sortBy > 0 ? 1 : (sortBy < 0 ? -1 : 0) }
      })
      .skip(skip)
      .limit(limit);
    return events;
  }
}

module.exports = {
  graphql: {
    getEvent,
    getEvents,
  }
};