const mongoose = require("mongoose");

const Schema = mongoose.Schema

const authCodeSchema = new Schema(
  {
    username: Schema.Types.String,
    type: Schema.Types.String,
    code: Schema.Types.String,
    estimate: Schema.Types.Number
  }
);

module.exports = mongoose.model("AuthCode", authCodeSchema);