const mongoose = require("mongoose")
const { LANGS } = require("../config");
const { array2Obj } = require("../utils/array-utill");

const Schema = mongoose.Schema

const countrySchema = new Schema(
  {
    name: array2Obj(LANGS, Schema.Types.String),
    coords: {
      lat: Schema.Types.Number,
      lon: Schema.Types.Number,
    },
  }
)

module.exports = mongoose.model("Country", countrySchema);