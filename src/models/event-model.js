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
    location: array2Obj(LANGS, Schema.Types.String),
    
    images_id: [Schema.Types.ObjectId],
    tags: [Schema.Types.String],

    city_id: Schema.Types.ObjectId,
    category_id: Schema.Types.ObjectId,

    created_at: Schema.Types.Date,
    updated_at: Schema.Types.Date,
    author_id: Schema.Types.ObjectId
  }
)

module.exports = mongoose.model("Event", eventSchema);