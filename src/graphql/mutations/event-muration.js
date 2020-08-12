const { GraphQLString, GraphQLFloat, GraphQLID, GraphQLInputObjectType } = require('graphql')
const { GraphQLDateTime } = require('graphql-iso-date');

const EventModel = require('../../models/event-model');
const EventType = require('../types/event-type');

const createEvent = {
  type: EventType,
  args: {
    date: { type: GraphQLDateTime },
    country: { type: GraphQLString },
    city: { type: GraphQLString },
    place: { type: GraphQLString },
    category: { type: GraphQLString },
    description: { type: GraphQLString },
    geo: {
      type: new GraphQLInputObjectType({
        name: "GEOInputType",
        description: "geo position",
        fields: () => ({
          lat: { type: GraphQLFloat },
          lon: { type: GraphQLFloat },
        })
      })
    }
  },
  resolve: async function (_, args) {
    const event = new EventModel({
      ...args
    });
    const saveEvent = await event.save();
    if (!saveEvent) {
      throw new Error('Error')
    }
    return saveEvent;
  }
}

// const updateEvent = {
//   type: PostType,
//   args: {
//     _id: {
//       name: "_id",
//       type: new GraphQLNonNull(GraphQLString)
//     },
//     author_id: {
//       name: "author_id",
//       type: GraphQLString
//     },
//     title: {
//       name: "title",
//       type: GraphQLString
//     },
//     body: {
//       name: "body",
//       type: GraphQLString
//     }
//   },
//   resolve: async function (root, args) {
//     let updateEvent = {};
//     if (args.author_id) {
//       updateEvent.author_id = args.author_id;
//     }

//     if (args.title) {
//       updateEvent.title = args.title
//     }

//     if (args.body) {
//       updateEvent.body = args.body
//     }

//     const updateEventInfo = await Event.findByIdAndUpdate(args._id, updateEvent, { new: true });

//     if (!updateEventInfo) {
//       throw new Error('Error');
//     }
//     return updateEventInfo;
//   }
// }

const deleteEvent = {
  type: EventType,
  args: {
    _id: {
      name: "_id",
      type: GraphQLID
    }
  },
  resolve: async function (root, args) {
    const deleteEvent = await EventModel.findByIdAndRemove(args._id);
    if (deleteEvent) {
      throw new Error('Error');
    }
    return deleteEvent;
  }
}

module.exports = { createEvent, /*updateEvent,*/ deleteEvent }