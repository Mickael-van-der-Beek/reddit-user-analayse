var request = require('request');
var async = require('async');
var fs = require('fs');

var domain = 'http://www.reddit.com';

function wait(callback) {
	setTimeout(function () {
		return callback(null);
	}, config.interval);
}

function getAuthorAge (author, callback) {
	request({
		url: domain + '/user/' + author + '/about.json',
		json: true
	}, function (e, res, body) {
		if(e || res.statusCode !== 200) {
			return callback(e);
		}
		callback(null, body.data.created * 1000);
	});
}

function computeAuthorLifetime (authors, author_ages) {
	var len = authors.length;
	var avg_age = 0;
	var counter = 0;

	async.eachSeries(authors, function (author, cb) {

		getAuthorAge(author, function (e, age) {
			counter += 1;

			if(e) {
				return cb(e);
			}

			if(counter % 100 === 0) {
				console.log(counter + '/' + len);
				console.log(author + '=' + age + ' - ' + (new Date(age)));
				console.log('Avg. =' + (avg_age / counter) + ' - ' + (new Date(avg_age / counter)));

				config.output.write(author + ',' + age + '\n');
			}

			author_ages[author] = age;
			avg_age += age;

			wait(cb);
		});

	}, function (e) {
		config.output.end();

		if(e) {
			return console.log(new Error(e));
		}

		var avg_age = 0;
		for(var author_age in author_ages) {
			avg_age += author_age[author_ages];
		}

		console.log('\n> RESULTS :');
		console.log(avg_age / len);
		console.log(new Date(avg_age / len));
	});
}

function readAuthorNames (author_ages) {
	fs.readFile(config.filename, 'utf8', function (e, data) {
		if(e) {
			return console.log(new Error(e));
		}

		var authors = data.split('\n');
		authors.pop();
		console.log('len - ' + authors.length);
		computeAuthorLifetime(authors, author_ages);
	});
}

var config = {
	interval: ((60 / 30) + ((60 / 30) * 0.25)) * 1000,
	filename: './output/authors_clean.txt',
	output: fs.createWriteStream('./output/author-age.txt')
};

var author_ages = {};
readAuthorNames(author_ages);