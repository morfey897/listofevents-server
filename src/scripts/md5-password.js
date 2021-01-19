const { md5Password } = require('../utils/validation-utill');

function generate() {
  return md5Password("morfey312389listevents");
}

console.log(generate());