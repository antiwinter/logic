const { fonts, renderPixels } = require('js-pixel-fonts')
const log = console.log

function render(s, pt) {

  // log('pt is', pt)
  let _pt

  log('pt is', pt, pt.split('\\n'))
  pt.split('\\n').forEach(p => {
    p = renderPixels(p, fonts.sevenPlus)
    if (!_pt)
      _pt = p
    else {
      _pt.push(_pt[0].map(x => 0))
      _pt = _pt.concat(p)
    }
  })
  pt = _pt

  let area = 0
  s.forEach(x => area += x.length)

  let n = 0
  pt.forEach(a => a.forEach(x => n += x))

  let scaler = Math.sqrt(area / n)
  log('area: ', area, 'pix: ', n, 'scaler: ', Math.sqrt(area / n))

  function empty(x, y) {
    y = Math.floor(y / scaler)
    x = Math.floor(x / scaler)

    return !pt[y][x]
  }

  function getArea(x, y) {
    let res = { l: 0, r: 0 }
    for (let i = x - 1; i >= 0; i--) {
      if (empty(i, y))
        break
      res.l++
    }

    for (let i = x; i < pt[0].length * scaler; i++) {
      if (empty(i, y))
        break
      res.r++
    }

    return res
  }

  let _s = ''
  for (let y = 0; y < pt.length * scaler; y++) {
    _s += '          '
    for (let x = 0; x < pt[0].length * scaler; x++) {
      if (empty(x, y)) {
        _s += ' '
        continue
      }

      let a = getArea(x, y)
      let pick = s.shift()

      if (pick && (!a.l || a.r > Math.abs(pick.length - a.r))) {
        _s += pick
        x += pick.length - 1
      } else if (pick)
        s.unshift(pick)
    }

    _s += '\n'
  }

  _s += '\n' + s.join(' ')
  return _s
}

function seg(src, pt) {
  let def = [], code = []
  src.replace(/\r/g, '\n').split('\n').forEach(l => {
    l = l.trim()
    if (l.match(/^`define|^`ifdef|^`else|^`endif/)) def.push(l)
    else code.push(l)
  })

  code = code.join('\n')

  let eat = ' []!@#$%^*()-+;:/,.\n'.split('')

  eat.forEach(e => {
    code = code.split(e).map(x => x.trim()).join('\r' + (e == '\n' ? ' ' : e) + '\r')
  })

  let compact = []
  code.split('\r').forEach(c => {
    if (c.length) compact.push(c)
  })

  return def.join('\n') + '\n\n' + render(compact, pt)
}


module.exports = (src, pt) => {
  return seg(src, pt)
}