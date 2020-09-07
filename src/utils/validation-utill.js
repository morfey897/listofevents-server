const isValidId = (id) => id && /^[0-9a-fA-F]{24}$/.test(id);
const jsUcfirst = (value) => {
  value = (value || "").trim();
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
};

const jsLowerCase = (args, filter) => {

  const isArray = filter && Array.isArray(filter) && filter.length > 0;
  const out = {};
  for (let name in args) {
    let value = args[name];

    if (typeof value === "object") {
      value = Object.assign({}, value);
      out[name] = value;
      if (!filter || (isArray && filter.indexOf(name) != -1) || (!isArray && filter[name] == true)) {
        for (let code in value) {
          let val = value[code];
          value[code] = typeof val === "string" ? val.toLowerCase() : val;
        }
      }
    } else {
      out[name] = (!filter || (isArray && filter.indexOf(name) != -1) || (!isArray && filter[name] == true)) && typeof value === "string" ? value.toLowerCase() : value;
    }
    
  }
  return out;
};

const inlineArgs = (args) => {
  const mutateArgs = {};
  for (let name in args) {
    let value = args[name];
    if (typeof value === "object") {
      for (let code in value) {
        let val = value[code];
        if (val !== "" && val !== undefined && val != null) {
          mutateArgs[`${name}.${code}`] = val;
        }
      }
    } else {
      if (value !== "" && value !== undefined && value != null) {
        mutateArgs[name] = value;
      }
    }
  }
  return mutateArgs;
}

module.exports = {
  isValidId,
  jsUcfirst,
  jsLowerCase,
  inlineArgs,
};