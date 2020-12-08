const mongoose = require("mongoose")
const { LANGS } = require("../config");
const { array2Obj } = require("../utils/array-utill");

const Schema = mongoose.Schema

const citySchema = new Schema(
  {
    name: array2Obj(LANGS, Schema.Types.String),
    description: array2Obj(LANGS, Schema.Types.String),
    place_id: Schema.Types.String,
  }
)

module.exports = mongoose.model("City", citySchema)