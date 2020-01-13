const readline = require("readline");
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = 'Укажите автокомпрессору путь к каталогу или нажмите ввод для выхода: ';

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


const getFileStat = async targPath => {
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


const checkIsDir =  targPath => {
    return new Promise( async (resolve, reject) => {
        
        console.log(`[INFO] Поиск каталога по указанному пути ${targPath}`);
        
        try {
            // вызов функции получения свойств объекта ФС
            const stats = await getFileStat(targPath);
            const isDir = stats.isDirectory();
            if (isDir)
                console.log(`[INFO] Найден каталог по указанному пути ${targPath}`); 
            resolve(isDir);

        } catch (err) {
            console.log('Ошибка получения свойств объекта ФС');
            reject(err);
        }

    });
};




// const processFolderContents = (pathToFolder, fileList) => {
//     console.log('Анализирую содержимое каталога');
//     console.log(fileList);
//     for (let i=0; i<fileList.length; i++) {
//         let currentFileName = fileList[i];
//         let currentFilePath = path.join(pathToFolder, currentFileName);
//         //console.log(`Проверяю ${currentFilePath}`);
//         checkDirByPath(currentFilePath, processFile);
//     }
// };


function scanDir(isDir, pathToFolder) {
    return new Promise( async (resolve, reject) => {
        while (!isDir) {
            try {
                // Повторяем запрос на ввод пути к каталогу
                pathToFolder = await askPath(question); // запросим путь к каталогу
                isDir = await checkIsDir(pathToFolder);
                if (!isDir) throw new Error();
            } catch (err) {
                console.log(`[WARNING] По указанному пути ${pathToFolder} каталог не найден.`);
                continue;
            }
            
        }
        console.log(`[INFO] Сканирую каталог ${pathToFolder}`);
        fs.readdir(pathToFolder, function(err, folderContents){
            if (err) {
                console.log('ОШИБКА:', err);
                reject(err);
            } else {
                console.log(folderContents);
                resolve(folderContents);
            }
        });
    });
};


const startCompressor = async () => {
    //let pathToFolder = await askPath(question); // запросим путь к каталогу
    //let isDir = await checkDirByPath(pathToFolder); // проверка существования каталога по переданному пути
    //let dirList = await scanDir(isDir, pathToFolder);
    let dirList = await scanDir(false, null);
    process.exit(0); // выход с признаком успешного завершения

};


// запрос пути к каталогу с полседующим запуском автокомпрессора
startCompressor();
