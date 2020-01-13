const readline = require("readline");
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = 'Укажите автокомпрессору путь к каталогу или нажмите ввод для выхода: ';
const packExt = '.gz';

const askPath = async question => {
    return new Promise( (resolve, reject) => {
        
        rl.setPrompt('\n'.concat(question));
        rl.prompt();
        
        rl.on('line', answer => {
            if ( answer )
                resolve(answer.trim());
            else
                rl.close(); // если введена пустая строка - прерываем цикл REPL, и сработает событие close
        });

        rl.on('close', () => {
            console.log('До свидания!\n');
            process.exit(0); // выход с признаком успешного завершения
        })
    });
};


const getFileStats = async targPath => {
    return new Promise( (resolve, reject) => {
        
        fs.stat(targPath, (err, stats) => {
            if (err) {
                reject(err);
            }
    
            resolve(stats);
        });

    });

};


function getDirList(dirPath) {
    return new Promise( async (resolve, reject) => {
        
        console.log(`[INFO] Сканирую каталог\t ${dirPath}`);
        fs.readdir(dirPath, function(err, folderContents){
            if (err) {
                console.log('[ОШИБКА]', err);
                reject(err);
            } else {
                resolve(folderContents);
            }
        });

    });
};


const compressFile = async (srcFilePath, srcFileStats) => {
    return new Promise( async (resolve, reject) => {
        const packedFilePath = srcFilePath.concat(packExt);
        try {
            // проверка на наличие одноименного архива
            let packedFileStats = await getFileStats(packedFilePath);
            // архив существует, сравним c датой изменения несжатой версии
            if (srcFileStats.mtime > packedFileStats.mtime) {
                const expiryError = new Error();
                expiryError.name = 'ExpiryError';
                throw expiryError;
            }
            resolve();
        } catch(err) {
            if (err.name === 'ExpiryError') {
                // архив протух
                console.log('[INFO] Обновляю архив\t ' + srcFilePath);    
            } else {
                // архива нет
                console.log('[INFO] Создаю архив\t ' + srcFilePath);
            }
            fs.createReadStream(srcFilePath)
                .on('error', function(err){
                    reject(err.message);
                })
                .pipe(zlib.createGzip())
                .pipe(fs.createWriteStream(packedFilePath))
                .on('error', function(err){
                    reject(err.message);
                })
                .on('close', ()=>{
                    resolve();
                });
        }
    });
}


const processDirList = async (dirPath, dirList) => {
        try {
            for (let i=0; i<dirList.length; i++) {
                let dirItemName = dirList[i];
                let dirItemPath = path.join(dirPath, dirItemName);
                let dirItemStats = await getFileStats(dirItemPath);
                let isDirFlag = dirItemStats.isDirectory();
                if ( isDirFlag ) {
                    // обработать каталог
                    let innerDirList = await getDirList(dirItemPath);
                    await processDirList(dirItemPath, innerDirList);
                } else {
                    if (path.extname(dirItemPath) === packExt)
                        continue
                    await compressFile(dirItemPath, dirItemStats);
                    //console.log('[INFO] Файл ' + dirItemPath + ' имеет актуальную сжатую копию');
                }
            }
        } catch(err) {
            console.log(err);
        }
        return Promise.resolve();
};


const startCompressor = async () => {

    const args = process.argv;
    let dirPath;

    if (args.length < 3) {
        console.log('[WARNING] В аргументах не указан путь к каталогу!');
        dirPath = await askPath(question); // запросим путь к каталогу
    } else {
        dirPath = args[2];
    }

    let isDir = false; // до проверки сомневаемся 

    while (!isDir) {
        try {
            // объект существует?
            let dirStats = await getFileStats(dirPath);
            // это каталог?
            isDir = dirStats.isDirectory();
            if (!isDir)
                throw new Error();
        } catch (err) {
            // Повторяем запрос на ввод пути к каталогу
            console.log(`[WARNING] Каталог ${dirPath} не найден!`);
            dirPath = await askPath(question);
            continue;
        }   
    }

    // добились получения пути к каталогу
    // натравливаем на этот каталог автокомпрессор

    try {
        const dirList = await getDirList(dirPath);
        await processDirList(dirPath, dirList);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
    console.log('[INFO] Работа завершена\n');
    
    process.exit(0); // выход с признаком успешного завершения

};


// запуск
startCompressor();
