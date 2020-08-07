const mongoose = require("mongoose")

const Schema = mongoose.Schema

const eventSchema = new Schema(
  {
    date: Schema.Types.Date,
    country: Schema.Types.String,
    city: Schema.Types.String,
    category: Schema.Types.String,
    location: {
      name: Schema.Types.String, 
      lat: Schema.Types.Number,
      lon: Schema.Types.Number,
    },
    event: Schema.Types.String,
  }
)

module.exports = mongoose.model("Event", eventSchema)