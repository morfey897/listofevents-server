
const { GraphQLString, GraphQLObjectType, GraphQLID, GraphQLFloat } = require('graphql');
const { GraphQLDateTime } = require('graphql-iso-date');

const EventType = new GraphQLObjectType({
    name: 'EventType',
    description: "This is event type",
    fields: () => ({
        _id: {type: GraphQLID},
        date: {type: GraphQLDateTime},
        country: {type: GraphQLString},
        city: {type: GraphQLString},
        place: {type: GraphQLString},
        category: {type: GraphQLString},
        description: {type: GraphQLString},
        geo: {type: new GraphQLObjectType({
          name: "GEOType",
          description: "geo position",
          fields: () => ({
            lat: {type: GraphQLFloat},
            lon: {type: GraphQLFloat},
          })
        })
        }
    })
});

module.exports = EventType;