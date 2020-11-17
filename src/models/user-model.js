const mongoose = require("mongoose");

const Schema = mongoose.Schema

const userSchema = new Schema(
  {
    email: Schema.Types.String,
    phone: Schema.Types.String,

    name: Schema.Types.String,
    surname: Schema.Types.String,
    password: Schema.Types.String,
    role: Schema.Types.Number
  }
);

module.exports = mongoose.model("User", userSchema);