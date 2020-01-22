const express = require('express');
const path = require('path');
const fs = require('fs');
const sha256 = require('js-sha256').sha256;
const Busboy = require('busboy');
const uuid = require('uuid-v4');
const { Server } = require("ws");

const webserver = express();
const port = 7980;
const wsport = 7981;
const wss = new Server({ port: wsport });

const wsClients = {};

webserver.use(express.static(path.join(__dirname, 'static')));

const uploadPath = path.join(__dirname, 'upload'); // путь к каталогу для помещения загруженных пользователями файлов
const dbPath = path.join(__dirname, 'data'); // путь к каталогу файловой базы данных с информацией о загруженных файлах (нужна для восстановления хэша после возможного рестарта сервера)
const deletedPath = path.join(__dirname, 'deleted');

/* ! создать каталоги при их отсутствии ! */
[uploadPath, dbPath, deletedPath].forEach( pth => {
    if (!fs.existsSync(pth)){
        fs.mkdirSync(pth);
    }  
})

const mainPagePath = path.join(__dirname, 'static', 'upload-form.html');
const fileInfoHash = {}; // хэш для хранения данных о загруженных файлах
const fileInfoArr = fs.readdirSync(dbPath); // список записей о загруженных файлах в файловой ДБ
let nextSaveId = fileInfoArr.length ; // идентификатор для сохранения в файловую БД следующего файла с описанием новой загрузки. При первом запуске будет равен нулю.
let mainPageContent = fs.readFileSync(mainPagePath, 'utf8'); // "пустышка" главной страницы для подстановки в неё html-кода таблицы с закачками
let mainPageHash = null; // для проверки возможности ответить 304 будем подсчитывать хэш главной старницы после каждого загруженного файла
const fourOfour = '404.html';


// сортирует список загрузок в порядке убывания очередности загрузки
const sortIdKeys = (prev, next) => {
    if (parseInt(prev) < parseInt(next)) return 1; else return -1;
};


// в начале перезапуска сервера заполняет хэш с информацией о загрузках в памяти данными, считанными из всех json-файлов файловой БД
const restoreFileInfo2Hash = async (idsArr, done) => {
    idsArr.sort(sortIdKeys).reverse(); // упорядочивает id, сортируя по убыванию, затем изменят порядок на противоположный
    const currentSaveId = idsArr[idsArr.length - 1]; // получаем имя файла с максимальным айдишником: {id}.json
    nextSaveId = parseInt(currentSaveId) + 1; // получаем идентификатор для сохранения следующего пользовательского файла
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
    // выполним опциональный колбек (запуск слушателя запросов)
    if (done) done();
};


// запуск слушателей http- и ws-сообщений
const startWebServer = () => {
    webserver.listen(port , () => {
        // http
        console.log(`Listening port ${port}...`);
        // ws
        wss.on('connection', socket => {
            console.log('new socket connected');

            let wsId = uuid();
            // держи id
            socket.send('#'+wsId);
            // запишем клиента в хэш сокет-соединений
            wsClients[wsId] = socket;

            socket.on('message', message => {
                if (message === 'STOP') {
                    console.log('Клиент отменил передачу файла');
                    socket.terminate();
                    delete wsClients[wsId];
                }
            });
    
            socket.on('close', () => {
                console.log('socket disconnected');
            });
    
            
        });

        console.log('upload server waiting for connections on ws://localhost:'+wsport); 
    });
};


// запуск слушателя запросов
if (nextSaveId > 0)
    // с восставновлением данных о загруженных файлах в хэш в памяти (перезапуск сервера)
    restoreFileInfo2Hash(fileInfoArr, startWebServer);
else
    // первый запуск
    startWebServer();


// помещает данные о только что загруженном файле в файловую БД на json-ах и в хэш
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
            <td><a href="/${id.toString()}">Скачать файл</a></td>
        </tr>`
    );
    return tableRows.join('\n');
};


// помещает обновленный код html-таблицы для скачивания файлов в разметку главной страницы
const getPageMarkup = downloadsMarkup => {
    const newMainMarkup = mainPageContent.split('{$}').join(downloadsMarkup);
    return newMainMarkup;
};


// возвращает данные о файле из хэша по его идентификатору
const getFileInfoById = id => fileInfoHash[id];


const getUploadsList = uploadPath => {
    return new Promise((resolve, reject) => {
        fs.readdir(uploadPath, (err, files) => {
            if (err)
                reject(err);
            else
                resolve(files);
        });
    });
};


const moveFile = (srcFilePath, targetFilePath) => {
    return new Promise( (resolve, reject) => {
        fs.createReadStream(srcFilePath)
            .on('error', err => {
                reject(err);
            })
            .pipe(fs.createWriteStream(targetFilePath))
            .on('error', err => {
                reject(err);
            })
            .on('close', ()=>{
                fs.unlink(srcFilePath, err => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
    });
};


const removeDeletedFromDB = async uploadsList => {    
    // проходим по хэшу с данными о загрузках и проверяем "живы" ли все файлы
    for (let id in fileInfoHash) {
        let fileName = fileInfoHash[id]['saveFN'];
        if (uploadsList.indexOf(fileName) === -1) {
            // файла fileName в каталоге загрузок уже нет, удалить из хэша
            delete fileInfoHash[id];
            // из каталога файловой БД перекинуть json файл с данными этой загрузки в бэкап-каталог
            const srcPath = path.join(dbPath, id.concat('.json'));
            const targPath = path.join(deletedPath, id.concat('.json'));
            try {
                await moveFile(srcPath, targPath);
            } catch (err) {
                console.log(err);
                continue;
            }
        }
    }
    Promise.resolve();
};





webserver.get('/:id', (req, res, next) => {
    const id = req.params.id;
    if (/\d/.test(parseInt(id))) {
        const fileInfo = getFileInfoById(id);
        if (!fileInfo) {
            next();
        } else {
            const originalName = encodeURIComponent(fileInfo.origFN);
            res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${originalName}`); // https://stackoverflow.com/questions/7967079/special-characters-in-content-disposition-filename/7969807#7969807
            // отправка запрошенного файла
            const downloadFilePath = path.join(__dirname,'upload',fileInfo.saveFN);
            res.sendFile(downloadFilePath, async err => {
                if (err) {
                    // если файл не найден
                    console.log(`Не найден файл ${fileInfo.saveFN} в каталоге загрузок по запросу на скачивание файла ${fileInfo.origFN}`);
                    res.setHeader('Content-Type', 'text/html');
                    res.removeHeader('Content-Disposition');
                    res.status(404).sendFile(path.join(__dirname, 'static', fourOfour));
                    // если файл не найден НО ЕГО ОПИСАНИЕ ЕСТЬ В ХЭШЕ (ФАЙЛ УДАЛЕН С СЕРВЕРА)
                    const uploadsList = await getUploadsList(uploadPath); // получить список файлов в каталоге загрузок
                    await removeDeletedFromDB(uploadsList); // удалить из хэша записи по файлам, которых нет в каталоге загрузок
                    // при первом же обновлении страницы строки с записями удаленных файлов
                }
            });
        }
    }
    else
        next();
});


// То, что я искал!!! Простейший редирект,  невидимый для фронта!
webserver.get('/', async (req, res, next) => { 
    //обращение к / - рендерим как /upload;
    req.url='/upload';
    next();
});


webserver.get('/upload', (req, res) => {
    let ifNoneMatch = req.header('If-None-Match');
    if ( ifNoneMatch && (ifNoneMatch === mainPageHash) ) {
        res.status(304).end();
        console.log('Cached');
    } else {
        try {
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
            res.setHeader('Cache-Control', 'public, max-age=0');
            if (!mainPageHash) {
                // запросов страницы в этом процессе еще не было
                let emptyMainPageContent = mainPageContent.replace(/^\s*{\$}/m, ''); // маркер для подстановки разметки html таблицы
                // актуализирую хэш
                mainPageHash = sha256(emptyMainPageContent);
                res.setHeader('ETag', mainPageHash);
                res.send(emptyMainPageContent);
            } else {
                res.setHeader('ETag', mainPageHash);
                res.send(mainPageContent);
            }

        } catch(err) {
            console.log(err);
            res.end(500);
        }
    }
});

webserver.post('/upload', (req, res) => {

    const soсketId = req.headers['x-socket-id'];
    
    const uploadFileInfo = {}; // имя файла, временное имя файла для хранения и комментарий к файлу фиксируем здесь
    const contentLength = req.headers['content-length'];
    
    // const noFileResponse = () => {
    //     res.send('<p>Вы не выбрали файл для загрузки. Вернитесь <a href="/" style="font-size: 2em;">на главную</a>.</p>');
    // };

    const sendProgress = (frac) => {
        let percent = frac*100;
        let targetConnection = wsClients[soсketId];
        // после команды на отмену загрузки данные все еще приходят, а соединение закрыто/удалено
        try{
            targetConnection.send(percent);
        } catch(err) {
            return;
        }
    };

    try {
        const busboy = new Busboy({ headers: req.headers });
        req.pipe(busboy);

        busboy.on('field', (fieldname, val) => {
            if (fieldname === 'comment') {
                uploadFileInfo[fieldname] = val;
            }
        });

        busboy.on('file', (fieldname, file, filename) => {

            if (filename === '' || fieldname !== 'attachedFile') {
                //noFileResponse();
                return;
            }

            let fileSize = 0;

            file.on('data', dataChunk => {
                fileSize += dataChunk.length;
                sendProgress(fileSize/contentLength);
            });

            let saveFileName = uuid() + path.extname(filename);
            uploadFileInfo.saveFN = saveFileName;
            uploadFileInfo.origFN = filename;
            let saveToPath = path.join(uploadPath,saveFileName);
            file.pipe(fs.createWriteStream(saveToPath));
        });

        busboy.on('finish', function() {

            if ( !uploadFileInfo.hasOwnProperty('origFN') ) {
                // файл обязателен (а комментарий -- нет)
                //noFileResponse();
                return;
            } else {
                res.setHeader('Content-Type', 'text/plain');
                // данные о вновь загруженном файле записываются в хэш и файловую БД
                storeFileInfo(uploadFileInfo)
                    .then( () => {
                        // сразу после успешного сохранения файла и данных о нем в хэш и БД
                        // формируется новый код html-таблицы с учетом последней загрузки
                        let downloadsMarkup = getDownloadsMarkup();
                        // формируется вся разметка главной страницы
                        mainPageContent = getPageMarkup(downloadsMarkup);
                        // актуализируется хэш-сумма главной страницы
                        mainPageHash = sha256(mainPageContent);
                        res.send('OK');
                    })
                    .catch( (err) => {
                        console.log(err);
                        res.send('ERROR SAVING FILE');
                    })
                    ;
            }
        });

    } catch(err) {
        console.log(err);
        res.end(501);
    }
});

webserver.get('*', function(req, res){
    // сюда попадут все get-запросы, не попавшие под предыдущие роуты
    res.status(404).sendFile(path.join(__dirname, 'static', fourOfour));
});