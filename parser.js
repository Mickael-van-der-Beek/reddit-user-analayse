var async = require('async');
var csv = require('csv');
var fs = require('fs');

// Stats
var stats = {
	authors: {
		total: 0,
		unique: 0,
		deleted: 0
	}
};

function createJson (header, post) {
	var jsonPost = {};
	for(var i = 0, len = header.length; i < len; i++) {
		jsonPost[header[i]] = post[i];
	}
	return jsonPost;
}

function transformCsvToJson (posts) {
	var header = posts[0];
	posts = posts.splice(1);

	var jsonPosts = [];
	var post;
	for(var i = 0, len = posts.length; i < len; i++) {
		post = posts[i];
		jsonPost = createJson(header, post);
		jsonPosts.push(jsonPost);
	}

	return jsonPosts;
}

function parseCsv (csvPosts, authors) {
	var jsonPosts = transformCsvToJson(csvPosts);
	var tmpAuthors = [];
	var author;
	for(var i = 0, len = jsonPosts.length; i < len; i++) {
		stats.authors.total += 1;

		author = jsonPosts[i].author;

		if(!author) {
			stats.authors.deleted += 1;
			continue;
		}

		if(!~authors.indexOf(author)) {
			authors.push(author);
			tmpAuthors.push(author);
			stats.authors.unique += 1;
		}
	}

	console.log('\n> WRITE : len=' + tmpAuthors.length + ' new authors.');
	config.output.write(tmpAuthors.join(', ') + '\n');
}

function readCsv (data_dir, authors) {
	var filenames = fs.readdirSync('./' + data_dir);

	var counter = 0;
	async.eachSeries(filenames, function (filename, cb) {
		csv()
		.from.path(__dirname + '/' + data_dir + '/' + filename, {
			delimiter: ',',
			escape: '"'
		})
		.to.array(function (posts) {
			parseCsv(posts, authors);
			counter += 1;
			if(counter % 10 === 0) {
				console.log(counter + '/2501');
			}
			cb(null);
		});
	}, function (e) {
		config.output.end();

		if(e) {
			return console.log(new Error(e));
		}

		console.log('\n> RESULTS :');
		console.log(authors.length);
		console.log(stats);
	});
}

// Config
var config = {
	data_dir: 'data',
	output: fs.createWriteStream('./output/authors.txt')
};
var authors = [];

readCsv(config.data_dir, authors);