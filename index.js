const cr = require('crypto')
const util = require('util')
const lib = require('./lib')
const log = console.log

function suffix() {
  let args = JSON.parse(JSON.stringify(arguments))
  args = args[0]

  return args[0] + '_' + cr.createHash('sha256')
    .update(JSON.stringify(args))
    .digest('hex')
    .slice(0, 4)
}

function signal(opt) {
  let sig = {
    $part(a, b) {
      if (a >= sig.width || b >= sig.width)
        throw `part select [${a}:${b}] from ${sig.name}:${sig.width}`
      return signal({
        name: sig.name,
        width: opt.width,
        type: opt.type,
        part: [a, b]
      })
    },
    $shift(n) {
      return signal({
        name: sig.name,
        width: opt.width,
        type: opt.type,
        shift: n
      })
    },
    $sl(n) {
      return sig.$shift(-n)
    },
    $sr(n) {
      return sig.$shift(n)
    }
  }

  for (let k in opt) sig[k] = opt[k]
  return sig
}

module.exports = {
  createModule() {
    let m = {
      $name: suffix(arguments),
      $_ns: {},
      $_subModules: [],
      $_snippet: [],
      $_pos: [],
      $_pre: [],
      $_extractSignal(sigs, type) {
        for (let i in sigs)
          m[i] = signal({
            name: i,
            type,
            width: sigs[i]
          })
        return m
      },
      $_pickName(base) {
        if (!m.$_ns[base])
          m.$_ns[base] = 0
        return `${base}_${m.$_ns[base]++}`
      },
      $_reg(name, width, from) {
        m[name] = signal({ name, width, type: 'reg', from })
        return m[name]
      },
      $_wire(name, width) {
        m[name] = signal({ name, width, type: 'wire' })
        return m[name]
      },
      $_getSignal(type) {
        let ports = []
        for (let k in m) {
          if (m[k].type === type)
            ports.push(m[k])
        }
        return ports
      },
      $_getIns() {
        let ins = {}
        for (let k in m) {
          if (k.match(/^ins_/))
            ins[k] = m[k]
        }
        return ins
      },
      $in() { },
      $out() { },
      $wire() { },
      $reg() { },
      $_ins(_m) {
        // log('creating instance', _m)
        let ns = m.$_pickName('ins_' + _m.module.$name)

        _m.module.$_getSignal('in').forEach(p => {
          if (!(p.name in _m.port))
            throw `port ${p.name} is not provided when creating instance: ${ns}`

          let a = _m.port[p.name]
          if (Array.isArray(a)) {
            let n = a[1] || 1
            let reg
            for (let i = 0; i < n; i++)
              reg = m.$_reg(m.$_pickName('reg_' + ns + '_' + p.name),
                p.width, i ? reg : a[0])

            _m.port[p.name] = reg
          }
        })

        _m.module.$_getSignal('out').forEach(p => {
          if (!_m.port[p.name]) {
            let wire = m.$_wire('wire_' + ns + '_' + p.name, p.width)
            _m.port[p.name] = wire
          }
        })

        _m.port.$m = _m.module
        m.$_subModules.push(_m.module)
        return m.$prev = m[ns] = _m.port
      },
      $ins(_m) {
        // log('out ins', _m)
        let __m = []
        if (Array.isArray(_m))
          __m = _m
        else {
          if (!_m.copy) _m.copy = 1
          for (let i = 0; i < _m.copy; i++)
            __m.push({
              module: _m.module,
              link: util._extend({}, _m.link),
              port: util._extend({}, _m.port)
            })
        }

        let prev_ins
        for (let i = 0; i < __m.length; i++) {
          // create each instance
          let x = __m[i]

          if (i > 0) // fix input, to connect w/ previous
            x.module.$_getSignal('in').forEach(p => {
              let a = x.link[p.name]
              // log('cluster signal', p.name, a)
              // log('  otter signal', p.name, _m.port[p.name].name)
              if (a) {
                let regd = Array.isArray(a)
                let ss
                if (regd) {
                  ss = [prev_ins[a[0]]]
                  if (a[1]) ss.push(a[1])
                } else
                  ss = prev_ins[a]

                x.port[p.name] = ss
              }
            })

          if (i < __m.length - 1) //fix output
            x.module.$_getSignal('out').forEach(p => {
              delete x.port[p.name]
            })

          prev_ins = m.$_ins(x)
        }

        return m
      },
      $v(snippet) {
        m.$_snippet.push(snippet)
        return m
      },
      $pos(sig, snippet) {
        m.$_pos.push(snippet)
        return m
      },
      $pre(snippet) {
        m.$_pre.push(snippet)
        return m
      }
    }

    let types = ['in', 'out', 'wire', 'reg']
    types.forEach(t => {
      m['$' + t] = opt => m.$_extractSignal(opt, t)
    })

    return m
  },
  lib
}
