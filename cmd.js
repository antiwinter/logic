#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const cli = require('commander')
const pkg = require('./package.json')
const reqs = require('require-from-string')
const ps = require('child_process')

const build = require('./builder')
const relint = require('./relint')
const log = console.log

cli.version(pkg.version).usage('<command> [option] <modules ...>')

cli
  .command('gen <modules...>')
  .description('generate verilog from js modules')
  .option('--flat', 'render into one file')
  .action((mfs, cmd) => {
    let counts
    if (!mfs.length)
      mfs.push('tb')
    mfs.forEach(f => {
      try {
        log('abs path is', path.join(process.env.INIT_CWD, f))
        let src = fs.readFileSync(f, 'utf-8')
        let m = reqs(src)()
        // let m = require(path.join(process.env.INIT_CWD, f))()
        counts = build(m, cmd.flat)
      } catch (err) {
        log('error gen module:', './' + path.join(f.replace(/\.js$/, '')))
        log(err)
        process.exit()
      }
    })

    let regBytes = 0
    for (let k in counts)
      regBytes += counts[k].n * counts[k].bits
    regBytes /= 8
    counts.regBytes = regBytes
    log(counts)
  })

cli
  .command('sim')
  .alias('simulate')
  .description('simulte tb')
  .action(() => {
    let out = ps.execSync(`iverilog -o build/a.vvp build/*.v build/modules/*.v && vvp build/a.vvp`)
    log(out.toString())
  })

cli
  .command('relint <files...>')
  .description('relint a .v file to pattern')
  .option('--pt', 'the pattern string')
  .action((fls, cmd) => {
    try {
      let src = fs.readFileSync(fls[0], 'utf-8')
      if (!cmd.pt) cmd.pt = 'LJNB'
      fs.writeFileSync(fls[0].replace(/\.v$/, '.relint.v'), relint(src, cmd.pt), 'utf-8')
    } catch (err) {
      log(err)
    }
  })

cli.on('command:*', () => {
  cli.help()
})

if (process.argv.length < 3) return cli.help()
cli.parse(process.argv)
