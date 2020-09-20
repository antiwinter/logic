const lg = require('..')

// constructor
module.exports = {
  rca64() {
    let m = lg
      .createModule('rca64')
      .$in({ a: 64, b: 64, cin: 1 })
      .$out({ cout: 1, sum: 64 })
      .$v(`
  wire [63:1] c;

  FA fa0(sum[0], c[1], a[0], b[0], cin);
  FA fa[62:1](sum[62:1], c[63:2], a[62:1], b[62:1], c[62:1]);
  FA fa31(sum[63], cout, a[63], b[63], c[63]);
      `)
      .$pre(`
    // Full Adder
module FA(output sum, cout, input a, b, cin);
  wire w0, w1, w2;

  xor  (w0, a, b);
  xor  (sum, w0, cin);

  and  (w1, w0, cin);
  and  (w2, a, b);
  or  (cout, w1, w2);
endmodule
      `)
    return m;
  }
}
