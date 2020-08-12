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

module.exports = {
  filterMap
};