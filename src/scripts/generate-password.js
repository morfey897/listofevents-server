const generator = require('generate-password');

function generate() {
  return generator.generate({
    length: 16,
    numbers: true
  });
}

console.log(generate());