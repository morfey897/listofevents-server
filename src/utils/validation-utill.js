const isValidId = (id) => id && /^[0-9a-fA-F]{24}$/.test(id);
const isValidTag = (tag) => tag && /^\s*#\w+\s*$/.test(tag);
const isValidUrl = (url) => url && /^\s*\/[a-z][\w-]{2,}[a-z0-9]\s*$/.test(url);

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

const _mutateArgs = (args, preffix, to) => {
  for (let name in args) {
    let value = args[name];
    if (typeof value === "object") {
      _mutateArgs(value, preffix.concat(name), to);
    } else {
      if (value !== "" && value !== undefined && value != null) {
        to[preffix.concat(name).join('.')] = value;
      }
    }
  }
  return to;
};

const jsTrim = (args, filter) => {
  if (typeof args === "string") return args.trim();
  return _jsStringPrepare(args, filter, (str) => str.trim());
};
const inlineArgs = (args) => _mutateArgs(args, [], {});

module.exports = {
  isValidId,
  isValidTag,
  isValidUrl,
  jsUcfirst,
  jsTrim,
  inlineArgs,
};