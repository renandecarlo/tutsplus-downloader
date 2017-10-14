**Envato Tuts+ Downloader**
==========================
This tool is intended to help downloading video courses from [Envato Tuts+](https://tutsplus.com/) for offline usage, such as when on a plane, no signal area, slow connection etc.

![Envato TutsPlus Courses](https://i.imgur.com/RSkMwjf.png)

Installation
----------------

 1. Clone or download this repository into a new folder.
 2. Install [**Python 2.6+**](https://www.python.org/downloads/).
 3. Install [**npm**](https://www.npmjs.com/get-npm) if you haven't already.
 4. Install [**CasperJS**](http://casperjs.org/) and [**SlimerJS**](https://slimerjs.org) as global npm packages, as following: 

     `npm -g install casperjs@1.1.x slimerjs@0.9.6`

Usage
-----
1. Change your [**Tuts+**](https://tutsplus.com/) username and password on the `config.json` file.
2. Go on the [**Tuts+**](https://tutsplus.com/) website and add as many courses you'd want (favorite) to your account.
2. Run CasperJS pointing to the main javascript file.

     `casperjs --engine=slimerjs tutsplus-downloader.js`

## Options ##
**showSeasonAndEpisode**

Includes numerical identification on the beginning of the downloaded video file, such as *"S01E02 - ..."*.

> Values: `true` or `false`


**basePath**

Path to where the videos will be downloaded. 

> Values: *relative* or *static path* ending in slash, such as
> `Courses/`, `C:/Downloads/Courses/`, `~/Courses/`


**defaultBestAssetOptions**

TutsPlus videos includes several source qualities. This options lets you decide which one will be prioritized for downloading.

> Values: an array containing one or more of the following `video`,
> `muxed (subtitles)`, `maxres (highest resolution)`, `mp4 (container)`,
> `hd (720p or above)`


Extras
------
This tool saves thumbnails, titles and folders in a structure that works with [**Plex**](https://www.plex.tv/) and [**Kodi**](https://kodi.tv/) patterns.

Dependencies
------------
This tool depends upon [**CasperJS**](http://casperjs.org/) 1.1 and [**SlimerJS**](https://slimerjs.org) 0.9.6. 
You can try newest versions, but they've got to be compatible between each other. [**CasperJS**](http://casperjs.org/) version 0.10 and above requires Firefox to be installed on the system.  

License
-------
Tuts+ Downloader is released under the MIT license.
