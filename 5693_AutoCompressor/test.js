var fs = require('fs');
var path = require('path');
var readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});
var args = process.argv;
console.log(args);
var pathToDir;
if (args.length < 3) {
	console.log('Path missing')
	readline.question('Укажите автокомпрессору путь к каталогу', function(answer) {
		pathToDir = answer;
		readline.close();
		scanDir(pathToDir);
	});
} else {
	pathToDir = args[2];
	scanDir(pathToDir);
}

function scanDir(dir) {
	fs.readdir(pathToDir, function(err, dirList){
		var files = dirList
		.map(function(fileOrfolder){
			var fullPath = path.join(pathToDir, fileOrfolder);
			var stats = fs.statSync(fullPath);
			if (stats.isFile()) {
				return ({fullPath:stats.birthtime});
			} else {
				return null;
			}
		})
		.filter(function(f){
			if(f) {	return true; }
		});

		files.forEach(function(f){
			console.log(JSON.stringify(f));
		})
		process.exit(-1);
	});
}