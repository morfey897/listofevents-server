const mongoose = require("mongoose")

const Schema = mongoose.Schema

const imageSchema = new Schema(
  {
    url: Schema.Types.String
  }
)

module.exports = mongoose.model("Image", imageSchema);
