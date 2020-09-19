#!/usr/bin/env node

const path = require('path')
const cli = require('commander')
const pkg = require('./package.json')
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
        let m = require('./' + path.join(f))()
        build(m)
      } catch (err) {
        log('cannot find module:', './' + path.join(f.replace(/\.js$/, '')))
        log(err)
        process.exit()
      }
    })
  })


cli.on('command:*', () => {
  cli.help()
})

if (process.argv.length < 3) return cli.help()
cli.parse(process.argv)
