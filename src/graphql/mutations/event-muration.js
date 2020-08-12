const { GraphQLString, GraphQLFloat, GraphQLID, GraphQLInputObjectType, GraphQLNonNull } = require('graphql')
const { GraphQLDateTime } = require('graphql-iso-date');

const EventModel = require('../../models/event-model');
const EventType = require('../types/event-type');

const { isValidId } = require('../../utils/validation-utill');

const GeoType = new GraphQLInputObjectType({
  name: "GEOInputType",
  description: "geo position",
  fields: () => ({
    lat: { type: GraphQLFloat },
    lon: { type: GraphQLFloat },
  })
});

const createEvent = {
  type: EventType,
  args: {
    date: { type: new GraphQLNonNull(GraphQLDateTime) },
    country: { type: new GraphQLNonNull(GraphQLString) },
    city: { type: new GraphQLNonNull(GraphQLString) },
    place: { type: new GraphQLNonNull(GraphQLString) },
    category: { type: new GraphQLNonNull(GraphQLString) },
    description: { type: GraphQLString },
    geo: { type: GeoType }
  },
  resolve: async function (_, args) {
    const event = new EventModel({
      ...args
    });
    const saveEvent = await event.save();
    if (!saveEvent) {
      console.error("Create:", args);
    }
    return saveEvent;
  }
}

const updateEvent = {
  type: EventType,
  args: {
    id: {type: new GraphQLNonNull(GraphQLString)},
    date: { type: GraphQLDateTime },
    country: { type: GraphQLString },
    city: { type: GraphQLString },
    place: { type: GraphQLString },
    category: { type: GraphQLString },
    description: { type: GraphQLString },
    geo: { type: GeoType }
  },
  resolve: async function (_, {id, ...args}) {
    let updateEventInfo;
    if (isValidId(id)) {
      Object.keys(args).forEach(name => {
        let value = args[name];
        if (value === undefined || value === null) {
          delete args[name];
        }
      });
  
      updateEventInfo = await EventModel.findByIdAndUpdate(id, args, { new: true });
    }
    
    if (!updateEventInfo) {
      console.warn('Update:', id, args);
    }
    return updateEventInfo;
  }
}

const deleteEvent = {
  type: EventType,
  args: {
    id: { type: GraphQLID }
  },
  resolve: async function (_, {id}) {
    let deleteEvent;
    if (isValidId(id)) {
      deleteEvent = await EventModel.findByIdAndRemove(id);
    }
    if (!deleteEvent) {
      console.error("Delete:", id);
    }
    return deleteEvent;
  }
}

module.exports = { createEvent, updateEvent, deleteEvent }