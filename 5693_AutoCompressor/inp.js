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
                resolve(answer);
            else
                rl.close(); // если введена пустая строка - прерываем цикл REPL, и сработает событие close
        });

        rl.on('close', () => {
            console.log('До свидания!');
            process.exit(0); // выход с признаком успешного завершения
        })
    });
};


const getFileStats = async targPath => {
    return new Promise( (resolve, reject) => {
        
        console.log(`[INFO] Обращение к свойствам объекта файловой системы ${targPath}`);
    
        fs.stat(targPath, (err, stats) => {
            if (err) {
                console.log(`[WARNING] Не найден объект файловой системы! ${targPath}`);
                reject(err);
            }
    
            console.log(`[INFO] Получены свойства объекта файловой системы ${targPath}`);
            resolve(stats);
        });

    });

};


// const checkIsDir =  targPath => {
//     return new Promise( async (resolve, reject) => {
        
//         console.log(`[INFO] Поиск каталога по указанному пути ${targPath}`);
        
//         try {
//             // вызов функции получения свойств объекта ФС
//             const stats = await getFileStats(targPath);
//             const isDir = stats.isDirectory();
//             if (isDir)
//                 console.log(`[INFO] Найден каталог по указанному пути ${targPath}`);
//             else
//                 console.log(`[INFO] НЕ НАЙДЕН каталог по указанному пути ${targPath}`);
//             resolve(isDir);

//         } catch (err) {
//             console.log('Ошибка получения свойств объекта ФС');
//             reject(err);
//         }

//     });
// };


function getDirList(dirPath) {
    return new Promise( async (resolve, reject) => {
        
        console.log(`[INFO] Сканирую каталог ${dirPath}`);
        fs.readdir(dirPath, function(err, folderContents){
            if (err) {
                console.log('ОШИБКА:', err);
                reject(err);
            } else {
                resolve(folderContents);
            }
        });

    });
};


const compressFile = async (srcFilePath, srcFileStats) => {
    return new Promise( async (resolve, reject) => {
        const packedFilePath = srcFilePath.concat('.gz');
        try {
            // проверка на наличие одноименного архива
            let packedFileStats = await getFileStats(packedFilePath);
            // архив существует, сравним c датой изменения несжатой версии
            console.log(srcFileStats.mtime, " Несжатая версия");
            console.log(packedFileStats.mtime, " Cжатая версия");
            // сравнить и переписать если надо 
            // https://stackoverflow.com/questions/11995536/node-js-overwriting-a-file
        } catch(err) {
            // архива нет
            console.log("Начинаю сжатие файла " + path.win32.basename(srcFilePath));
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


const processList = async (dirPath, dirList) => {
    return new Promise( async (resolve, reject) => {
        console.log ('Получен список' + dirList.toString());
        try {
            for (let i=0; i<=dirList.length; i++) {
                let dirItemName = dirList[i];
                let dirItemPath = path.join(dirPath, dirItemName);
                let dirItemStats = await getFileStats(targPath);
                let isDirFlag = dirItemStats.isDirectory();
                if ( isDirFlag ) {
                    // обработать каталог
                    let innerDirList = await getDirList(dirItemPath);
                    console.log(innerDirList);
                    await processList(dirItemPath, innerDirList);
                } else {
                    await compressFile(dirItemPath, dirItemStats);
                }
            }
            resolve();
        } catch(err) {
            reject(err);
        }
    });
};


const startCompressor = async () => {
    let dirPath = await askPath(question); // запросим путь к каталогу
    let isDir = false; // сомневаемся

    while (!isDir) {
        try {
            // объект существует?
            let dirStats = await getFileStats(dirPath);
            // это каталог?
            isDir = dirStats.isDirectory();
            if (!isDir)
                throw new Error();
        } catch (err) {
            console.log(`[WARNING] По указанному пути ${dirPath} каталог не найден.`);
            // Повторяем запрос на ввод пути к каталогу
            dirPath = await askPath(question);
            continue;
        }   
    }

    // добились получения пути к каталогу
    // натравливаем на этот каталог автокомпрессор

    try {
        const dirList = await getDirList(dirPath);
        console.log(dirList);
        await processList(dirPath, dirList);
        console.log('Stop1');
    } catch (err) {
        console.log(err);
    }
    console.log('Stop2');
    
    //process.exit(0); // выход с признаком успешного завершения

};


// запрос пути к каталогу с полседующим запуском автокомпрессора
startCompressor();
