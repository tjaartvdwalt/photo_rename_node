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
const fs = require('fs')
const glob = require('glob')
const moment = require('moment')
const path = require('path')
const sprintf = require('sprintf').sprintf
var ExifImage = require('exif').ExifImage

module.exports = {
  /**
   * Read the exif date from the given file, and returns the proposed file path.
   * The file name will have the form: `IMG_yyyymmdd_hhmmss.jpg`
   */
  updateName: function (file) {
    return new Promise(function (resolve, reject) {
      try {
        new ExifImage({ image: file }, function (error, exifData) { // eslint-disable-line no-new
          if (error) {
            reject(`${error.message}`)
          } else {
            var date = moment(exifData.exif.DateTimeOriginal, 'YYYY:MM:DD HH:mm:ss')
            if (!exifData.exif.DateTimeOriginal) {
              reject('No "DateTimeOriginal" exif field found in the given image')
            } else {
              var fileName = sprintf('IMG_%04d%02d%02d_%02d%02d%02d.jpg', date.year(), date.month() + 1,
              date.date(), date.hours(), date.minutes(), date.seconds())
              var dir = path.dirname(file)
              resolve(path.join(dir, fileName))
            }
          }
        })
      } catch (error) {
        reject(`${error.message}`)
      }
    })
  },

  /**
   * Search for .jpg files in the current path, and return a map of current names -> new names
   * Optionally we can also search for another extension type to be renamed with the jpg file.
   * This is useful when renaming RAW files together with their jpg counterpart
   */
  mapNames: function (curPath, extension, debug) {
    return new Promise(function (resolve, reject) {
      glob(curPath + '/*.[jJ][pP][gG]', function (er, files) {
        co(function * () {
          var change = {}
          for (var i in files) {
            try {
              var updatedName = yield this.updateName(files[i])
            } catch (err) {
              console.error(clc.red(`Error renaming ${files[i]}:\n${err}`))
            }
            change[path.normalize(files[i])] = updatedName
            // if the extension is given, rename that file as well
            if (extension) {
              var source = this.replaceExtension(files[i], extension)
              var dest = this.replaceExtension(updatedName, extension)
              try {
                fs.statSync(source)
                change[path.normalize(source)] = dest
              } catch (err) {
                if (debug) {
                  console.error(err.message)
                }
              }
            }
          }
          resolve(change)
        }.bind(this))
      }.bind(this))
    }.bind(this))
  },

  /*
   * Remove the file extension from the the given file, and replace it with the given extension
   * e.g  replaceExtension('/my/path/test.jpg', 'RAW') -> '/my/path/test.RAW'
   */
  replaceExtension: function (myPath, extension) {
    var dir = path.dirname(myPath)
    var fileWithoutExtension = path.basename(myPath).match('(.*)\\..*$')[1]
    var filename = fileWithoutExtension + '.' + extension
    return path.join(dir, filename)
  },

  /*
   * Separate files into a map filenames that will be changed,
   * and an array of filenames that will remain the same
   */
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

  /*
   * Print a message to show which files will change, and which will be left unchanged
   */
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

  /*
   * Perform the renaming of the files in the map
   */
  rename: function (map) {
    for (var i in map) {
      fs.renameSync(i, map[i])
    }
  }
}
