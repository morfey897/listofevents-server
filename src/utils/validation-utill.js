const isValidId = (id) => id && /^[0-9a-fA-F]{24}$/.test(id);

module.exports = {
  isValidId
};