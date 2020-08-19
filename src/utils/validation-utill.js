const isValidId = (id) => id && /^[0-9a-fA-F]{24}$/.test(id);
const jsUcfirst = (value) => {
  value = (value || "").trim();
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
};

module.exports = {
  isValidId,
  jsUcfirst
};