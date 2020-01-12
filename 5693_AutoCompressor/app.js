var readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});

const path = require('path');
const fs = require('fs');
const zlib = require('zlib');


const getFileStat = function(pathToFile) {
	return new Promise(function(resolve, reject) {
		fs.stat(pathToFile, function(err, stat){
			if (err) {
				console.log('ОШИБКА:', err);
				reject(err.message);
			} else {
				resolve(stat);
			}
		});
	});
}


const promptTargetFolderPath = function(msg) {	
		readline.question(msg + '\n');
		readline.on('line', path => {
			if ( !path )
				readline.close(); // если введена пустая строка - прерываем цикл REPL, и сработает событие close
			else
				return path;
		});
		readline.on('close', () => {
			console.log('До свидания!');
			process.exit(0); // выход с признаком успешного завершения
		})
	
}


const isDir = async function(pathToDir) {
	try {
		var stat = await getFileStat(pathToDir);
	} catch(err) {
		console.log(err);
	}
	return stat.isDir();
};


const compressFile = function (pathToFile) {
	var srcPath = pathToFile;
	var targetPath = srcPath.concat('.gz');
	console.log(srcPath);
	console.log(targetPath);
	return new Promise(function(resolve, reject){
		console.log("Начинаю сжатие файла " + path.win32.basename(targetPath));
		fs.createReadStream(srcPath)
			.on('error', function(err){
				reject(err.message);
			})
			.pipe(zlib.createGzip())
			.pipe(fs.createWriteStream(targetPath))
			.on('error', function(err){
				reject(err.message);
			})
			.on('close', ()=>{
        		
        		resolve();
    		});
	});
};


const scanDir = function(dirPath) {
	fs.readdir(dirPath, async function(err, dirList){
		if (err) {
			console.log('ОШИБКА:', err);
		} else {
			for (let i=0; i<=dirList.length; i++) {
				let currentFileName = dirList[i];
				let currentFilePath = path.join(dirPath, currentFileName);
				let isDirCheck = await isDir(currentFilePath);
				if ( !isDirCheck ) {
					compressFile(currentFilePath)
						.then(function(){
							console.log("Завершено сжатие файла " + currentFileName);
						})
						.catch(function() {
							console.log("Не удалось обработать файл " + currentFileName);
						})
				} else {
					await scanDir(currentFilePath);
				}
			}
		}
	});
}


const startAutocompressor = async function() {
	var args = process.argv;
	var pth;
	if (args.length < 3) {
		console.log('Path is missing');
		pth = await promptTargetFolderPath('Укажите автокомпрессору путь к каталогу или нажмите ввод для выхода:');
	} else {
		pth = args[2];
	}
	while (!( await isDir(pth) )) {
		pth = await promptTargetFolderPath('Не найден каталог по указанному пути');
	}

	// на всякий случай
	pth = path.normalize(pth);
	// обходим каталог, делаем работу
	await scanDir(pth);

	console.log("Автокомпрессор завершил работу над каталогом " + pth);
}

startAutocompressor();