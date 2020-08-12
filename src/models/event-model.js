const mongoose = require("mongoose")

const Schema = mongoose.Schema

const eventSchema = new Schema(
  {
    date: Schema.Types.Date,
    country: Schema.Types.String,
    city: Schema.Types.String,
    category: Schema.Types.String,
    place: Schema.Types.String,
    geo: {
      lat: Schema.Types.Number,
      lon: Schema.Types.Number,
    },
    description: Schema.Types.String,
  }
)

module.exports = mongoose.model("Event", eventSchema)