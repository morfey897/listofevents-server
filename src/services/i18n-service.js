const path = require('path')
const i18n = require('i18n')
const { LANGS } = require('../config');

i18n.configure({
  locales: LANGS,
  directory: path.join(__dirname, '../locales'),
});

i18n.setLocale('ru');

module.exports = i18n;