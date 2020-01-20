const express = require('express');
const path = require('path');
const fs = require('fs');
const sha256 = require('js-sha256').sha256;
const Busboy = require('busboy');
const uuid = require('uuid-v4');

const webserver = express();
const port = 7980;
const uploadPath = path.join(__dirname, 'upload'); // путь к каталогу для помещения загруженных пользователями файлов
const dbPath = path.join(__dirname, 'data'); // путь к каталогу файловой базы данных с информацией о загруженных файлах (нужна для восстановления хэша после возможного рестарта сервера)
const mainPagePath = path.join(__dirname, 'static', 'upload-form.html');
const fileInfoHash = {}; // хэш для хранения данных о загруженных файлах
const fileInfoArr = fs.readdirSync(dbPath); // список записей о загруженных файлах в файловой ДБ
let nextSaveId = fileInfoArr.length ; // идентификатор для сохранения в файловую БД следующего файла с описанием новой загрузки
let mainPageContent = fs.readFileSync(mainPagePath, 'utf8'); // "пустышка" главной страницы для подстановки в неё html-кода таблицы с закачками
let mainPageHash = sha256(mainPageContent); // для проверки возможности ответить 304 будем подсчитывать хэш главной старницы после каждого изменения
const fourOfour = '404.html';
const fileMissingWarn = 'ФАЙЛ УДАЛЕН!';

// сортирует список загрузок в порядке убывания очередности загрузки
const sortIdKeys = (prev, next) => {
    if (parseInt(prev) < parseInt(next)) return 1; else return -1;
};

// после перезапуска сервера заполняет хэш в памяти согласно файлов, расположенных в каталоге загрузок
const restoreFileInfo2Hash = async (idsArr, done) => {
    idsArr.sort(sortIdKeys).reverse(); //
    for (let i=0; i<idsArr.length; i++) {
        let current = path.join(dbPath, idsArr[i]);
        try {
            let content = await fs.readFileSync(current);
            fileInfoHash[i.toString()] = JSON.parse(content);
        } catch(err) {
            console.log(err);
            continue;
        }
    }
    done();
};

// помещает данные о только что загруженном файле в файловую БД на json-ах
const storeFileInfo = data => {
    return new Promise( (resolve, reject) => {
        const fileInfoSavePath = path.join(dbPath, nextSaveId.toString().concat('.json'));
        const fileInfoContent = JSON.stringify(data);
        fs.writeFile(fileInfoSavePath, fileInfoContent, (error) => {
            if (error)
                reject(error);
            nextSaveId++;
            // добавляет запись в хэш
            fileInfoHash[nextSaveId.toString()] = data;
            console.log('Saved');
            resolve();
        });
    });
};

// формирует разметку таблицы для скачивания файлов с учетом только что добавленного файла
const getDownloadsMarkup = () => {
    let ids = Object.keys(fileInfoHash);
    ids.sort(sortIdKeys);
    let tableRows = ids.map( id => 
        `<tr><td>${fileInfoHash[id]['origFN']}</td>
        <td>${fileInfoHash[id]['comment']}</td>
        <td><a href="/${id.toString()}">Скачать файл<a></td>
        </tr>`
    );
    return tableRows.join('\n');
};

// помещает обновленный код html-таблицы для скачивания файлов в разметку главной страницы
const getPageMarkup = downloadsMarkup => {
    const newMainMarkup = mainPageContent.split('{$}').join(downloadsMarkup);
    mainPageHash = sha256(newMainMarkup); // актуализируем хэш-сумму главной страницы
    return newMainMarkup;
};

// возвращает данные о файле из хэша по его идентификатору
const getFileInfoById = id => fileInfoHash[id];

// позволяет изменить данные о файле в хэше и файловой БД
const changeFileInfoById = (id, param, newValue) => {
    if (typeof id !== 'string')
        id += '';
    fileInfoHash[id][param] = newValue;
};


const restoreParamFromDB = (id, param) => {
    return new Promise(  (resolve, reject) => {
        if (typeof id !== 'string')
            id += '';
        const target = path.join(dbPath, id.concat('.json'));
        fs.readFile(target, 'utf8', (error, data) => {
            if (error) {
                console.log(error);
                reject(error);
            } else {
                const fileRec = JSON.parse(data);
                fileInfoHash[id][param] = fileRec[param];
                resolve(`Параметр ${param} восстановлен из файла описания ${id}.json в хэш`);
            }
        });
    });
};


// запуск слушателя запросов
const startWebServer = () => {
    webserver.listen(port , () => {
        console.log('Listening port 7980...');
    });
};


if (nextSaveId > 0)
    // восставновление данных о загруженных файлах в хэш в памяти
    // с запуском слушателя запросов
    restoreFileInfo2Hash(fileInfoArr, startWebServer);
else
    startWebServer();


webserver.use(express.static(path.join(__dirname, 'static')));


webserver.get('/:id', (req, res, next) => {
    const id = req.params.id;
    if (/\d/.test(parseInt(id))) {
        const fileInfo = getFileInfoById(id);
        const originalName = encodeURIComponent(fileInfo.origFN);
        // https://stackoverflow.com/questions/7967079/special-characters-in-content-disposition-filename/7969807#7969807
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${originalName}`);
        // отправка запрошенного файла
        res.sendFile(path.join(__dirname,'upload',fileInfo.saveFN), async (err) => {
            if (err) {
                // если файл не найден
                console.log(err);
                res.setHeader('Content-Type', 'text/html');
                res.removeHeader('Content-Disposition');
                res.status(404).sendFile(path.join(__dirname, 'static', fourOfour));
                // ЕСЛИ НЕ НАЙДЕН ФАЙЛ, ОПИСАНИЕ КОТОРОГО ЕСТЬ В ХЭШЕ 
                changeFileInfoById(id, 'comment', fileMissingWarn);  // заменить в хэше комментарий на 'ФАЙЛ УДАЛЕН!'
            } else {
                // ЕСЛИ ВДРУГ ФАЙЛ СТАЛ ДОСТУПЕН, А ДО ЭТОГО БЫЛ ПОМЕЧЕН КАК "УДАЛЕН"
                const recData = getFileInfoById(id);
                const commentValue = recData['comment']; 
                if ( commentValue === fileMissingWarn ) {
                    // Файл снова доступен - заменить в хэше комментарий 'ФАЙЛ УДАЛЕН!' на оригинальный из файловой БД
                    restoreParamFromDB(id, 'comment', '')
                        .then( result => { console.log(result); } )
                        .catch( err => { console.log(err); } );
                }
            }
        });
    } else {
        next();
    }
});


webserver.get('/', async (req, res, next) => { 
    //обращение к / - рендерим как /upload;
    console.log("Обращение к главной");
    req.url='/upload';
    next();
});


webserver.get('/upload', (req, res) => {
    let ifNoneMatch = req.header('If-None-Match');
    if ( ifNoneMatch && (ifNoneMatch === mainPageHash) ) {
        res.status(304).end();
        console.log('Cached');
    } else {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.setHeader('ETag', mainPageHash);
        res.setHeader('Cache-Control', 'public, max-age=0');
        try {
            let downloadsMarkup = getDownloadsMarkup();
            let pageMarkup = getPageMarkup(downloadsMarkup);
            res.send(pageMarkup);
        } catch(err) {
            console.log(err);
            res.end(500);
        }
    }
});

webserver.post('/upload', (req, res) => {
    
    const uploadFileInfo = {}; // имя файла, временное имя файла для хранения и комментарий к файлу фиксируем здесь
    const contentLength = req.headers['content-length'];

    
    const noFileResponse = () => {
        // сделать отправку через вебсокет
        // {"error":"Вы не выбрали файл для загрузки", "data":null}
        res.send('Вы не выбрали файл для загрузки');
    };

    
    try {
        const busboy = new Busboy({ headers: req.headers });
        req.pipe(busboy);

        busboy.on('field', (fieldname, val) => {
            if (fieldname === 'comment') {
                // 
                uploadFileInfo[fieldname] = val;
            }
        });

        busboy.on('file', (fieldname, file, filename) => {
            if (filename === '' || fieldname !== 'attachedFile') {
                noFileResponse();
                return;
            }
            console.log('Здесь установить сокет-соединение');
            let fileSize = 0;
            file.on('data', dataChunk => {
                fileSize += dataChunk.length;
                console.log(`${contentLength - fileSize} bytes remains`);
            });
            let saveFileName = uuid() + path.extname(filename);
            uploadFileInfo.saveFN = saveFileName;
            uploadFileInfo.origFN = filename;
            let saveToPath = path.join(uploadPath,saveFileName);
            file.pipe(fs.createWriteStream(saveToPath));
        });

        busboy.on('finish', function() {
            console.log('0 bytes remains');
            if ( !uploadFileInfo.hasOwnProperty('origFN') ) {
                // файл обязателен (комментарий нет)
                noFileResponse();
                return;
            } else {
                console.log('Здесь разорвать сокет-соединение');
                console.log('Ready to save in hash');
                storeFileInfo(uploadFileInfo)
                    .then( () => {
                        res.redirect(303, '/'); // GET
                    })
                    .catch( (err) => {
                        console.log("Catched error: ");
                        console.log(err);
                        res.redirect(303, '/'); // GET
                    });
            }
        });

    } catch(err) {
        console.log(err);
        res.end(501);
    }
});

webserver.get('*', function(req, res){
    // сюда попадут все get-запросы, не попавшие под предыдущие роуты
    res.status(404).send('<b>ИЗВИНИТЕ!</b> такого файлика - '+req.path+' - у нас нет!');
});