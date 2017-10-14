/**
 * User Options
 */
	var config = require('config.json');

/**
 * Utils
 */

 	/* Default filtering fields and values */
	var	filterFields = {
			"muxed": 		["muxed_subtitles", true],
			"mp4": 			["container", "mp4"],
			"flv": 			["container", "flv"],
			"original": 	["type", "original"],
			"hd": 			["type", "hd"],
			"md": 			["type", "md"],
			"video": 		["type", "video"]
		},

		/* Get the highest resolution out of the assets videos */
		getMaxRes = function(assets) {
			var maxRes = { 'width': 0, 'height': 0 };

			assets.forEach(function(asset) {
				if(asset.width * asset.height > maxRes.width * maxRes.height) {
					maxRes.width = asset.width;
					maxRes.height = asset.height;
				}
			});

			return maxRes;
		},

		/* Filter the asset by the highest resolution */
		filterMaxRes = function(assets) {
			if(assets.length <= 1) return assets;

			var _assets = [];
			var maxRes = getMaxRes(assets);

			assets.forEach(function(asset, i) {
				if(asset.width == maxRes.width && asset.height == maxRes.height)
					_assets.push(asset);
			});

			return _assets.length ? _assets : assets;
		},

		/* Filter assets by field and value */
		filter = function(assets, field, value) {
			if(assets.length <= 1) return assets;

			var _assets = [];

			assets.forEach(function(asset, i) {
				if(typeof asset[field] !== "undefined")
					if(new RegExp(value).test(asset[field]))
						_assets.push(asset);
			});

			return _assets.length ? _assets : assets;
		},

		/* Get the best asset following config.defaultBestAssetOptions order */
		getBestAsset = function(assets, option) {
			var options = option ? option.split(",") : config.defaultBestAssetOptions;

			options.forEach(function(option) {
				if(option == 'maxres')
					assets = filterMaxRes(assets);
				else
					assets = filter(assets, filterFields[option][0], filterFields[option][1]);
			});

			return assets[0];
		},

		/* Sanitize special chars */
		sanitize = function(value) {
			return value.replace(/[\\\/:\*\?<>|]/, "");
		};


/**
 * Run
 */

	var casper 		= require('casper').create(),
		fileSystem 	= require('fs');

    casper.options.viewportSize 			= { width: 800, height: 600 },
	casper.options.pageSettings.resourceTimeout 	= 10 * 1000,
	casper.options.pageSettings.loadImages 		= false,
	casper.options.pageSettings.userAgent 		= 'Mozilla/5.0';

	casper.start(config.baseUrl + 'sign_in', function() {

	/* Login to your account */
	this.fill('form.sign-in__form', {
			'session[login]': 		config.email,
			'session[password]': 	config.password
		},
		true
	);

	/* Wait for login and grab favorite courses from your account */
	this.waitForSelector('.global-nav__user-menu-items', function() {
		casper.thenOpen(config.baseUrl + 'account/courses', function() {
			var courseLinks = this.getElementsAttribute('.course-bookmarks__course-link', 'href');

			/* Traverse through courses */
			if(courseLinks)
				courseLinks.forEach(function(courseLink) {
					casper.thenOpen(courseLink, function() {
						var courseTitle = sanitize(this.fetchText('.content-banner__title'));
						var courseDescription = this.getHTML('.course__description');
						var lessonLinks = this.getElementsAttribute('.lesson-index__lesson-link', 'href');

						console.log("\n-> Grabbing lessons from course: "+ courseTitle);

						fileSystem.makeTree(config.basePath + courseTitle + '/Description');
						fileSystem.write(config.basePath + courseTitle +'/'+ courseTitle +'.html', courseDescription, {mode: 'w', charset: 'UTF-8'});

						var lesson = 0;

						if(lessonLinks) {
							var interval;

							/* Grab lesson */
							var fetchLesson = function() {
								var videoBaseUrl = courseLink.split('/');

								casper.thenOpen(videoBaseUrl[0] + '//'+ videoBaseUrl[2] + '/' + lessonLinks[lesson], function then() {

									if(this.exists('.lesson-show__overlay-banner-text')) {
										console.log("\nYou don't have access to this lesson ["+ lessonLinks[lesson] +"]. Aborting.");
										return false;
									}

									this.waitFor(
										/* Wait for the video tag */
										function() {
											// console.log('Waiting page to load...'+ loading());

											return casper.evaluate(function() {
												return !document.querySelector('[id^=wistia_loading]').offsetParent;
											});
										},

										/* Run this when video is loading */
										function() {
											var assets;
											var stop = false;
											var time = new Date;
											var wistiaTokenId = this.getElementAttribute('.lesson-video', 'data-wistia-id');

											/* Try to return media directly from content provider JSON */
											var getMedias = function() {
												assets = casper.evaluate(
													function(tokenId) {
														return __utils__.sendAJAX('https://fast.wistia.com/embed/medias/'+ tokenId +'.json', 'GET', null, false);
													}, {
														tokenId: wistiaTokenId
													}
												);
											}
											getMedias();

											/* Wait for JSON to complete */
											while(!assets && !stop) {
												getMedias();

												if(new Date - time >= 15 * 1000)
													stop = true;
											}


											/* Get assets directly from the page if CDN JSON failed */
										   if(!assets) {
												console.log('Asset not found, something went wrong. Downloading embbeded version.');
												var videoLink = this.getElementAttribute('.lesson-video video source', 'src');
												var videoExt = videoLink.split('.').pop();
											} else {
												assets = JSON.parse(assets);
												var asset = getBestAsset(assets.media.assets);

												var videoLink = asset.url;
												var videoExt = asset.ext;
											}

											var lessonTitle = sanitize(this.fetchText('.lesson-description__lesson-title'));
											var lessonDescription = this.getHTML('.lesson-description');

											var thumbnail = assets.media.embed_options.stillUrl;

											var episode = config.showSeasonAndEpisode ? "S01E" + ("0" + (lesson+1)).slice(-2) + " - " : "";

											console.log('--> Downloading lesson '+ lessonTitle +' ('+ Math.round(asset.size / 1024 / 1024) +' MB)' );

											// console.log('File: '+ config.basePath + courseTitle +'/'+ episode + lessonTitle +'.'+ videoExt);
											// console.log('Lesson Description: '+ lessonDescription);

											if(!fileSystem.exists(config.basePath + courseTitle +'/'+ episode + lessonTitle +'.'+ videoExt)) {
												fileSystem.write(config.basePath + courseTitle +'/Description/'+ lessonTitle +'.html', lessonDescription, {mode: 'w', charset: 'UTF-8'});

												this.download(thumbnail, config.basePath + courseTitle +'/'+ episode + lessonTitle +'.tbn');
												this.download(videoLink, config.basePath + courseTitle +'/'+ episode + lessonTitle +'.'+ videoExt);
											} else
												console.log('--> Already downloaded. Skipping.');

											lesson++;

											// console.log('Trying next lesson '+ lessonLinks[lesson]);

											if(lessonLinks[lesson]) fetchLesson();

											page.clearMemoryCache();
											},

											/* Video didn't load */
											function() {
												console.log('Page loaded for too long. Retrying.');
												fetchLesson();
											},

											/* Wait for 10 seconds */
											10 * 1000
										);
									});
								}

								fetchLesson();
							}
						});
					});
			});
		});
	});


/**
 * Run
 */
	casper.run(function() {
	    this.echo("Finished.\n").exit();
	});
