const { GraphQLList, GraphQLID, GraphQLString, GraphQLInt, GraphQLInputObjectType } = require('graphql');
const { GraphQLDateTime } = require('graphql-iso-date');

const EventModel = require('../../models/event-model');
const EventType = require('../types/event-type');

const { filterMap } = require("../../utils/filter-utill");
const { isValidId } = require('../../utils/validation-utill');
const PaginateType = require('../types/paginate-type');

const MAX_SIZE = 100;

const FilterEventType = new GraphQLInputObjectType({
  name: "FilterEventType",
  fields: () => ({
    dateFrom: { type: GraphQLDateTime },
    dateTo: { type: GraphQLDateTime },
    countries_id: { type: new GraphQLList(GraphQLString) },
    cities_id: { type: new GraphQLList(GraphQLString) },
    categories_id: { type: new GraphQLList(GraphQLString) },
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
    const fCountry = filter && filter.countries_id;
    const fCity = filter && filter.cities_id;
    const fCategory = filter && filter.categories_id;
    const dateFrom = filter && filter.dateFrom;
    const dateTo = filter && filter.dateTo;

    const fMong = [];
    fCountry && fCountry.length && fMong.push({ $or: fCountry });
    fCity && fCity.length && fMong.push({ $or: fCity });
    fCategory && fCategory.length && fMong.push({ $or: fCategory });
    dateFrom && fMong.push({ date: { $gte: dateFrom } });
    dateTo && fMong.push({ date: { $lte: dateTo } });
    
    let skip = paginate && paginate.offset || 0;
    let limit = paginate && paginate.limit;
    
    if (dateFrom && dateTo) {
      limit = limit || Number.MAX_SAFE_INTEGER;
    } else {
      limit = Math.min(limit || MAX_SIZE, MAX_SIZE);
    }

    let events = await EventModel.find(
      fMong.length ? { $and: fMong } : {},
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
  getEvent,
  getEvents,
};