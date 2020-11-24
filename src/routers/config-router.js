const Config = require('../config');

function configRouter(req, res) {

  const data = {};
  for (let name in Config) {
    data[name.toLocaleLowerCase()] = Config[name];
  }

  res.json({ success: true, data });
}

module.exports = {
  configRouter,
};