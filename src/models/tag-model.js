const mongoose = require("mongoose")

const Schema = mongoose.Schema

const tagSchema = new Schema(
  {
    label: Schema.Types.String
  }
)

module.exports = mongoose.model("Tag", tagSchema)