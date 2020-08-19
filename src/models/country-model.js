const mongoose = require("mongoose")

const Schema = mongoose.Schema

const countrySchema = new Schema(
  {
    ru: Schema.Types.String,
    en: Schema.Types.String,
  }
)

module.exports = mongoose.model("Country", countrySchema)