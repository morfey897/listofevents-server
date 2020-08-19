const { GraphQLList, GraphQLID, GraphQLString, GraphQLInt, GraphQLInputObjectType, GraphQLNonNull } = require('graphql');
const { GraphQLDateTime } = require('graphql-iso-date');

const EventModel = require('../../models/event-model');
const EventType = require('../types/event-type');

const { filterMap } = require("../../utils/filter-utill");
const { isValidId } = require('../../utils/validation-utill');
const PaginateType = require('../types/paginate-type');

const FilterType = new GraphQLInputObjectType({
  name: "FilterType",
  fields: () => ({
    date: { type: new GraphQLList(GraphQLDateTime) },
    country: { type: new GraphQLList(GraphQLString) },
    city: { type: new GraphQLList(GraphQLString) },
    place: { type: new GraphQLList(GraphQLString) },
    category: { type: new GraphQLList(GraphQLString) },
  })
});

const getEvent = {
  type: EventType,
  args: {
    id: { type: GraphQLID }
  },
  description: "Single event by ID",
  resolve: async function (_, { id }) {
    let event = null;
    if (isValidId(id)) {
      event = await EventModel.findById(id);
    }
    if (!event) {
      console.warn("NotFound:", id);
    }
    return event;
  }
}

const getEvents = {
  type: new GraphQLList(EventType),
  description: "List of all events",
  args: {
    filter: { type: FilterType },
    sortBy: { type: GraphQLInt },
    paginate: { type: PaginateType }
  },
  resolve: async function (_, { filter, sortBy, paginate }) {
    const fCountry = filterMap(filter && filter.country, "country");
    const fCity = filterMap(filter && filter.city, "city");
    const fPlace = filterMap(filter && filter.place, "place");
    const fCategory = filterMap(filter && filter.category, "category");
    const dateFrom = filter && filter.date && filter.date[0];
    const dateTo = filter && filter.date && filter.date[1];

    const fMong = [];
    fCountry.length && fMong.push({ $or: fCountry });
    fCity.length && fMong.push({ $or: fCity });
    fPlace.length && fMong.push({ $or: fPlace });
    fCategory.length && fMong.push({ $or: fCategory });

    if (dateFrom) {
      fMong.push({ date: { $gte: dateFrom } });
    }

    if (dateTo) {
      fMong.push({ date: { $lte: dateTo } });
    }
    let events = await EventModel.find(
      fMong.length ? { $and: fMong } : {},
      null,
      {
        sort: { date: sortBy > 0 ? 1 : (sortBy < 0 ? -1 : 0) }
      })
      .skip(paginate && paginate.offset || 0)
      .limit(paginate && paginate.limit || Number.MAX_SAFE_INTEGER);
    return events;
  }
}

module.exports = {
  getEvent,
  getEvents
};