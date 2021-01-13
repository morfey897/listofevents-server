const mongoose = require("mongoose");
const { array2Obj } = require("../utils/array-utill");

const SOCIAL_FIELDS = ["id", "link", "auth_token"];

const Schema = mongoose.Schema
const userSchema = new Schema(
  {
    // #General
    name: Schema.Types.String,
    surname: Schema.Types.String,
    role: Schema.Types.Number,
    // #Login / password
    email: Schema.Types.String,
    phone: Schema.Types.String,
    password: Schema.Types.String,
    // #Social
    facebook: array2Obj(SOCIAL_FIELDS, Schema.Types.String),
    instagram: array2Obj(SOCIAL_FIELDS, Schema.Types.String)
  }
);

module.exports = mongoose.model("User", userSchema);