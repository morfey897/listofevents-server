const array2Obj = (list, data) => {
  return list.reduce((cur, v) => {
    cur[v] = typeof data === "object" ? Object.assign({}, data) : data; 
    return cur;
  }, {});
}

module.exports = {
  array2Obj,
};