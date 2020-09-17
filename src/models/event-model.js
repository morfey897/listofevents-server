const mongoose = require("mongoose")
const { LANGS } = require("../config");
const { array2Obj } = require("../utils/array-utill");

const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    date: Schema.Types.Date,
    url: Schema.Types.String,
    name: array2Obj(LANGS, Schema.Types.String),
    description: array2Obj(LANGS, Schema.Types.String),
    images_id: [Schema.Types.ObjectId],
    tags_id: [Schema.Types.ObjectId],

    city_id: Schema.Types.ObjectId,
    category_id: Schema.Types.ObjectId,
    place: array2Obj(LANGS, Schema.Types.String),
    coords: {
      lat: Schema.Types.Number,
      lon: Schema.Types.Number,
    },
  }
)

module.exports = mongoose.model("Event", eventSchema);