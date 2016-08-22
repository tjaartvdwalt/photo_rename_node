# Photo Rename #

This is a Nodejs port of my original script written in Ruby. Currently it provides around 80% of the functionality of the original, and everything that I needed for my personal use. The plan is to deprecate the Ruby script since I am now mostly working in Nodejs and are much more capable in that language.

[![NPM](https://nodei.co/npm/photo_rename.png?compact=true)](https://nodei.co/npm/photo_rename/)

## Installation ##
The only dependency is for the script is that `Nodejs` and `npm` be installed. Other depenedencies will be automatically installed by `npm`.

To install the script itself:
```bash
npm install photo_rename
```

## What the script does ##

This script is fairly specific. It renames all JPG files (technically files with a .jpg or .jpeg extenstion) in a given directory to the form `IMG_yyyymmdd_hhmmss.jpg`

## Rationale ##

The naming pattern described above is the naming pattern used by the stock Android camera. Renaming photos taken with other devices to this scheme allows me to seamlessly merge photos into a single directory and maintain consistent file names.

## Usage ##
```bash
photo_rename [directory]
```

![img](./screenshots/example.png)


## Changing the image date ##

It is quite common (at least for me) that my camera time is incorrect. This happens most often to me when traveling to a different time zone.

Although I started implementing this functionality into the app, I decided to stick to the Unix philosophy of letting the app "do one thing well". There are many different tools that are better suited to changing an image's exif data. Personally I use [jhead](http://freecode.com/projects/jhead). It does everything I need and is simple to learn. 

Lets look at an example that happens to me quite often:

I took my photos while in `EST`, but my camera was set to `CST`, so I had to adjust the time forward with 1 hour.)

```
jhead -ta+1:00 ~/my_photos/*
```

Then I run `photo_rename` on the same directory
```
photo_rename ~/my_photos
```

Or if you want to do it all in one command:

```
cd ~/my_photos && jhead -ta+1:00 * && photo_rename
```

## Change log ##

### 0.1.0 ###
First release of the Nodejs port

### License ###

This program is licensed under [(<http://www.gnu.org/licenses/gpl-3.0.txt>)[GNU GPL]]
