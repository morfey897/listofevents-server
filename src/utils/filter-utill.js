const { LANGS } = require('../config');

const TRANSLATES = ["name", "description", "place"];

const filterMap = (v, filedName) => {
  let res = [];
  if (Array.isArray(v)) {
    res = v.map(n => ({[filedName]: n}));
  } else if (v != undefined && v != null && typeof v === "object") {
    for (let n in v) {
      if (v[n]) {
        res.push({[filedName]: n});
      }
    }
  }
  return res;
};

const filterField = (token, fields) => {
  let locFields = [];
  
  for (let name in fields) {
    let val = fields[name];
    if (val) {
      if (TRANSLATES.indexOf(val) != -1) {
        locFields.push({[val]: {$or: [LANGS].map(lang => ({[lang]: {$regex: token, $options: "i"}}))}});
      } else {
        locFields.push({[val]: {$regex: token, $options: "i"}});
      }
    }
  }
  return locFields;
}

module.exports = {
  filterMap,
  filterField,
};