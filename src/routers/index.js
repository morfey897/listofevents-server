const user = require("./user-router");
const config = require("./config-router");

module.exports = {
  ...user,
  ...config
};