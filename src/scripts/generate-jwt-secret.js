const crypto = require('crypto');

function generate() {
  return crypto.randomBytes(64).toString('hex');
}

console.log(generate());