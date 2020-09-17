const array2Obj = (list, data, preffix) => {
  return list.reduce((cur, v) => {
    cur[preffix ? `${preffix}.${v}` : v] = typeof data === "object" ? Object.assign({}, data) : data; 
    return cur;
  }, {});
};

const mapArray = (list, data, preffix) => {
  return list.map(v => ({[preffix ? `${preffix}.${v}` : v]: (typeof data === "object" ? Object.assign({}, data) : data)}));
}

module.exports = {
  array2Obj,
  mapArray,
};