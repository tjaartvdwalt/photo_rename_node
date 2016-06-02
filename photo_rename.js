#!/usr/bin/env node

// photo_rename renames all .jpg files in a given directory to the form IMG_*yyyymmdd*_*hhmmss*.jpg
// Copyright (C) 2016  Tjaart van der Walt

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

const clc = require('cli-color')
const co = require('co')
const glob = require('glob')
const moment = require('moment')
const path = require('path')
const pjson = require('./package.json')
const program = require('commander')
const prompt = require('prompt')
const shelljs = require('shelljs')
const sprintf = require('sprintf').sprintf

var helpers = {
  updateName: function (file) {
    return new Promise(function (resolve, reject) {
      var ExifImage = require('exif').ExifImage

      try {
        new ExifImage({ image: file }, function (error, exifData) {
          if (error) {
            console.error('Error: ' + error.message)
            reject(error)
          } else {
            var date = moment(exifData.exif.DateTimeOriginal, 'YYYY:MM:DD HH:mm:ss')
            var fileName = sprintf('IMG_%04d%02d%02d_%02d%02d%02d.jpg', date.year(), date.month(),
              date.date(), date.hours(), date.minutes(), date.seconds())
            var dir = path.dirname(file)
            resolve(path.join(dir, fileName))
          }
        })
      } catch (error) {
        console.error('Error: ' + error.message)
        reject(error)
      }
    })
  },

  mapNames: function (curPath, options) {
    return new Promise(function promise (resolve, reject) {
      glob(curPath + '/*.[jJ][pP][gG]', function (er, files) {
        co(function * () {
          var change = {}
          for (var i in files) {
            var updatedName = yield this.updateName(files[i])
            change[path.normalize(files[i])] = updatedName
          }
          resolve(change)
        }.bind(this))
      }.bind(this))
    }.bind(this))
  },

  checkForChanges: function (map) {
    var unchanged = []
    var change = {}
    for (var i in map) {
      if (i === map[i]) {
        unchanged.push(i)
      } else {
        change[i] = map[i]
      }
    }
    return {change: change, unchanged: unchanged}
  },

  displayRenameResults: function (map) {
    if (map.unchanged.length > 0) {
      console.log('These image names are correct, and will be ignored:')
      for (var i in map.unchanged) {
        console.log(clc.blue(map.unchanged[i]))
      }
    }

    if (Object.keys(map.change).length > 0) {
      console.log('These image names will be changed as follows:')
      for (var j in map.change) {
        console.log(sprintf('%-40s => %-40s', clc.yellow(j), clc.green(map.change[j])))
      }
    }
  },

  rename: function (map) {
    for (var i in map) {
      shelljs.mv(i, map[i])
    }
  },

  initialize: function () {
    program
      .version(pjson.version)
      .option('-b, --batch', 'Batch mode. Will not ask confirmation before renaming.')
      .arguments('[dir]')
      .action(function (dir) {
        co(function * () {
          if (!dir) {
            dir = '.'
          }
          var map = yield this.mapNames(dir)
          var results = this.checkForChanges(map)
          this.displayRenameResults(results)
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
                this.rename(results.change)
              }
            }.bind(this))
        }.bind(this))
      }.bind(this))
      .parse(process.argv)
  }
}

helpers.initialize()
