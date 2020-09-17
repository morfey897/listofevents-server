const { LANGS } = require('../config');
const { mapArray } = require('./array-utill');

const TRANSLATES = ["name", "description", "place"];

const filterField = (token, fields) => {
  let locFields = [];
  
  for (let name in fields) {
    let val = fields[name];
    if (val) {
      if (TRANSLATES.indexOf(val) != -1) {
        locFields = locFields.concat(mapArray(LANGS, { $regex: token, $options: "i" }, val));
      } else {
        locFields.push({[val]: {$regex: token, $options: "i"}});
      }
    }
  }
  return locFields;
}

module.exports = {
  filterField,
};