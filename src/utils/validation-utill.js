const isValidId = (id) => id && /^[0-9a-fA-F]{24}$/.test(id);
const jsUcfirst = (value) => {
  value = (value || "").trim();
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
};

const _jsStringPrepare = (args, filter, func) => {

  const isFilterArray = filter && Array.isArray(filter) && filter.length > 0;
  const out = {};
  for (let name in args) {
    let value = args[name];
    if (!filter || (isFilterArray && filter.indexOf(name) != -1) || (!isFilterArray && filter[name] == true)) {
      console.log(name, value, typeof value);
      if (typeof value === "object") {
        out[name] = {};
        for (let code in value) {
          let val = value[code];
          out[name][code] = typeof val === "string" ? func(val) : val;
        }  
      } else if (typeof value === "string") {
        out[name] = func(value);  
      } else {
        out[name] = value;  
      }
    } else {
      out[name] = value;
    }
  }
  return out;
};

const jsLowerCase = (args, filter) => console.log('LOWER_CASE') || _jsStringPrepare(args, filter, (str) => str.toLowerCase());
const jsTrim = (args, filter) => console.log('TRIM') || _jsStringPrepare(args, filter, (str) => str.trim());

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
  jsTrim,
  inlineArgs,
};