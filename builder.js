
const log = console.log
const fs = require('fs')

function translate(to, ori) { // tanslate signal to verilog
  let d = {}
  if (typeof to === 'number') {
    d.name = to
    d.width = ori.width
    d.v = `${ori.width}'d${to}`
  } else {
    d.name = to.name
    d.width = to.part ? to.part[0] - to.part[1] + 1 : to.width
    d.v = to.part ? `${to.name}[${to.part.join(':')}]` :
      to.shift ? `${to.name} ${to.shift > 0 ? '>>' : '<<'} ${Math.abs(to.shift)}` :
        to.name
  }

  return d
}

function render(m) {
  let s = `module ${m.$name}(`
  let seg = []

  m.$_getSignal('in').forEach(x => {
    seg.push('input ' + (x.width > 1 ? `[${x.width - 1}:0] ` : '') + x.name)
  })

  m.$_getSignal('out').forEach(x => {
    seg.push('output ' + (x.width > 1 ? `[${x.width - 1}:0] ` : '') + x.name)
  })

  s += seg.join(', ') + ');\n\n'

  m.$_getSignal('wire').forEach(x => {
    s += 'wire  ' + (x.width > 1 ? `[${x.width - 1}:0] ` : '') + x.name + ';\n'
  })

  s += '\n'

  let regs = m.$_getSignal('reg')
  regs.forEach(x => {
    s += 'reg  ' + (x.width > 1 ? `[${x.width - 1}:0] ` : '') + x.name + ';\n'
  })

  s += '\n'

  ins = m.$_getIns()
  for (let name in ins) {
    let c = name.split('_')
    c.pop()
    c.shift()

    s += `${c.join('_')} ${name}(\n`
    let ports = ins[name]

    seg = []
    let _m = ports.$m
    for (let k in ports) {
      if (k.match(/^\$/)) continue

      let _k = _m[k]
      let p = translate(ports[k], _k)

      if (!_k)
        log(`Warnning: ${name} cannot find original port ${k}`)
      else if (p.width != _k.width)
        log(`Warnning: ${name}: <${k}:${_k.width}, ${p.name}:${p.width}> width not match`)


      seg.push(`  .${k}  (${p.v})`)
    }

    s += seg.join(',\n') + '\n);\n\n'
  }

  // treat clk
  if (regs.length) {
    s += `always @ (posedge clk) begin\n`
    regs.forEach(x => {
      if (!x.from) return
      let p = translate(x.from, x)

      if (p.width != x.width)
        log(`Warnning: load register <${x.name}:${x.width}, ${p.name}:${p.width}> width not match`)

      s += `  ${x.name} <= ${p.v};\n`
    })

    if (m.$_pos.length)
      s += m.$_pos.join('\n') + '\n'
    s += 'end\n\n'
  }

  s += m.$_snippet.join('\n') + '\n\nendmodule\n'

  if (m.$_pre.length)
    s = m.$_pre.join('\n') + '\n' + s

  return s
}

let _built = {}
let base = './build/verilog'
function build(m) {
  if (_built[m.$name]) return
  _built[m.$name] = 1
  log('generating', m.$name)
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true })
  fs.writeFileSync(`${base}/${m.$name}.v`, render(m), 'utf-8')

  m.$_subModules.forEach(_m => build(_m))
}

module.exports = build
