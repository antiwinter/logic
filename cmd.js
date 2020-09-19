#!/usr/bin/env node

const path = require('path')
const fs = require('fs')
const cli = require('commander')
const pkg = require('./package.json')
const reqs = require('require-from-string')
const ps = require('child_process')

const build = require('./builder')
const log = console.log

cli.version(pkg.version).usage('<command> [option] <modules ...>')

cli
  .command('gen <modules...>')
  .description('generate verilog from js modules')
  .action((mfs, cmd) => {
    if (!mfs.length)
      mfs.push('tb')
    mfs.forEach(f => {
      try {
        let src = fs.readFileSync(f, 'utf-8')
        let m = reqs(src)()
        build(m)
      } catch (err) {
        log('cannot find module:', './' + path.join(f.replace(/\.js$/, '')))
        log(err)
        process.exit()
      }
    })
  })

cli
  .command('sim')
  .alias('simulate')
  .description('simulte tb')
  .action(() => {
    ps.execSync(`iverilog -o build/a.vvp build/verilog/*.v && vvp build/a.vvp`)
  })

cli.on('command:*', () => {
  cli.help()
})

if (process.argv.length < 3) return cli.help()
cli.parse(process.argv)
