const { buildSchema } = require("graphql")

// {
//   date: Schema.Types.Date,
//   country: Schema.Types.String,
//   city: Schema.Types.String,
//   type: Schema.Types.String,
//   location: {
//     name: Schema.Types.String, 
//     lat: Schema.Types.Number,
//     lon: Schema.Types.Number,
//   },
//   event: Schema.Types.String,
// }

module.exports = buildSchema(`

  type Location {
    name: String! 
    lat: Float!
    lon: Float!
  }

  input LocationInput {
    name: String! 
    lat: Float
    lon: Float
  }

  type Event {
    _id: ID!
    date: String!
    country: String!
    city: String!
    category: String
    event: String!
    location: Location!
  }

  input EventInput {
    date: String!
    country: String!
    city: String!
    category: String
    event: String!
    location: LocationInput!
  }

  type Query {
    events:[Event!]
  }

  type Mutation {
    createEvent(eventInput:EventInput): Event
  }

  schema {
    query: Query
    mutation: Mutation
  }
`)