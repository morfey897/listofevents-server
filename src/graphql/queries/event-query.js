const EventModel = require('../../models/event-model');
const EventType = require('../types/event-type');
const { GraphQLList, GraphQLID } = require('graphql');

const getEvent = {
  type: EventType,
  args: {
    id: {type: GraphQLID}
  },
  description: "Single event by ID",
  resolve: async function(_, args) {
    let event = await EventModel.findById(args.id);
    if (!event) {
      console.log("NOT_FOUND");
    }
    return event;
  }
}

const getEvents = {
  type: new GraphQLList(EventType),
  description: "List of all events",
  resolve: async function () {
     let events = await EventModel.find({});
     return events;
  }
}

module.exports = {
  getEvent,
  getEvents,
};