const mongoose = require("mongoose")
const { LANGS } = require("../config");
const { array2Obj } = require("../utils/array-utill");

const Schema = mongoose.Schema

const categorySchema = new Schema(
  {
    url: Schema.Types.String,
    name: array2Obj(LANGS, Schema.Types.String),
    description: array2Obj(LANGS, Schema.Types.String),
    images_id: [Schema.Types.ObjectId],
    tags_id: [Schema.Types.ObjectId],
  }
)

module.exports = mongoose.model("Category", categorySchema)