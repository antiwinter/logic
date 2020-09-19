const vl = require('./index')

// constructor
module.exports = () => {
  let m = vl
    .createModule('adder')
    .$in({ a: 64, b: 64, cin: 1 })
    .$out({ cout: 1, sum: 64 })
    .$v(`KSA64 ksa0(sum, cout, a, b, cin);`)
  return m;
}