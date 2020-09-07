const mongoose = require("mongoose")
const { LANGS } = require("../config");
const { array2Obj } = require("../utils/array-utill");

const Schema = mongoose.Schema

const citySchema = new Schema(
  {
    name: array2Obj(LANGS, Schema.Types.String),
    country_id: Schema.Types.ObjectId,
    coords: {
      lat: Schema.Types.Number,
      lon: Schema.Types.Number,
    },
  }
)

module.exports = mongoose.model("City", citySchema)