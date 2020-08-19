const mongoose = require("mongoose")

const Schema = mongoose.Schema

const eventSchema = new Schema(
  {
    date: Schema.Types.Date,
    country_id: Schema.Types.ObjectId,
    city_id: Schema.Types.ObjectId,
    category_id: Schema.Types.ObjectId,
    place: {
      name: Schema.Types.String,
      lat: Schema.Types.Number,
      lon: Schema.Types.Number,
    },
    description: Schema.Types.String,
  }
)

module.exports = mongoose.model("Event", eventSchema);