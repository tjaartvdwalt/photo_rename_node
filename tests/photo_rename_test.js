/* global describe it */
var path = require('path')
var rename = require('../photo_rename')
var chai = require('chai')
var expect = chai.expect
var chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

describe('updateName', function () {
  it('should fail on a non jpeg file', function () {
    return expect(
      rename.updateName(path.resolve(__dirname, 'samples', 'no_jpg.png'))
    ).to.be.rejectedWith('The given image is not a JPEG and thus unsupported right now.')
  })

  it('should fail on an image without any exif headers', function () {
    return expect(
      rename.updateName(path.resolve(__dirname, 'samples', 'no_exif.jpg'))
    ).to.be.rejectedWith('No Exif segment found in the given image.')
  })

  it('should fail on an image without the "DateTimeOriginal" exif field', function () {
    return expect(
      rename.updateName(path.resolve(__dirname, 'samples', 'no_date_time_original.jpg'))
    ).to.be.rejectedWith('No "DateTimeOriginal" exif field found in the given image')
  })

  it('should rename a correct image', function () {
    return expect(
      rename.updateName(path.resolve(__dirname, 'samples', 'correct.jpg'))
    ).to.eventually.equal(path.resolve(__dirname, 'samples', 'IMG_20161008_190738.jpg'))
  })
})

describe('replaceExtension', function () {
  it('should return a file with the correct extension', function () {
    return expect(
      rename.replaceExtension('/my/path/image.jpg', 'RAW')
    ).to.equal('/my/path/image.RAW')
  })
  // it seems chai-as-promised does not play well with non-promise based code ;(
  // it('should handle null input', function () {
  //   expect(rename.replaceExtension(undefined, 'RAW')).to.throw(TypeError)
  // })
})
