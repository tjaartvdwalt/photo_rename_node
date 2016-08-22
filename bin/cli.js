#!/usr/bin/env node

const co = require('co')
const pjson = require('../package.json')
const program = require('commander')
const prompt = require('prompt')
var rename = require('../photo_rename')

program
  .version(pjson.version)
  .option('-b, --batch', 'Batch mode. Will not ask confirmation before renaming.')
  .option('-d, --debug', 'Print debug info.')
  .option('-e, --extension [ext]', 'Adjust a similar named file with another extension.(Useful for RAW files)')
  .arguments('[dir]')
  .action(function (dir) {
    co(function * () {
      if (!dir) {
        dir = '.'
      }
      var map = yield rename.mapNames(dir, program.extension, program.debug)
      var results = rename.checkForChanges(map)
      rename.displayRenameResults(results)
      prompt.start()
      prompt.get(
        {
          properties: {
            confirm: {
              description: 'Are you sure want to do this? (Y/N)',
              pattern: /^[yYnN]/,
              message: 'You must answer (Y/N)',
              required: true
            }
          }
        },
        function (err, result) {
          if (err) {
            console.error(err)
            process.exit(1)
          }
          if (result.confirm.match('[yY]')) {
            rename.rename(results.change)
          }
        })
    })
  })
  .parse(process.argv)
