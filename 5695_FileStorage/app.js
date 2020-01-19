const express = require('express');
const path = require('path');
const fs = require('fs');
const sha256 = require('js-sha256').sha256;
const Busboy = require('busboy');
const uuid = require('uuid-v4');

const webserver = express();
const port = 7980;
const uploadPath = path.join(__dirname, 'upload');
const dbPath = path.join(__dirname, 'data');
const mainPagePath = path.join(__dirname, 'static', 'upload-form.html');


const sortIdKeys = (prev, next) => {
    if (parseInt(prev) < parseInt(next)) return 1; else return -1;
}


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
}


const storeFileInfo = data => {
    // заапустим процесс записи в файловую БД
    return new Promise( (resolve, reject) => {
        const fileInfoSavePath = path.join(dbPath, nextSaveId.toString().concat('.json'));
        const fileInfoContent = JSON.stringify(data);
        fs.writeFile(fileInfoSavePath, fileInfoContent, (error) => {
            if (error) {
                reject(error);
            }
            nextSaveId++;
            // дополнительно запишем в хэш
            fileInfoHash[nextSaveId.toString()] = data;
            console.log('Saved')
            resolve();
        });
    });
};


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


const getPageMarkup = downloadsMarkup => {
    const newMainMarkup = mainPageContent.split('{$}').join(downloadsMarkup);
    mainPageHash = sha256(newMainMarkup); // актуализируем хэш-сумму главной страницы
    return newMainMarkup;
};


const getFileInfoById = id => fileInfoHash[id];


const startWebServer = () => {
    webserver.listen(port , () => {
        console.log('Listening port 7980...');
    });
}

const fileInfoHash = {};
const fileInfoArr = fs.readdirSync(dbPath); // число записей в файловой ДБ
let nextSaveId = fileInfoArr.length ; // идентификатор для сохранения следующего файла с описанием
let mainPageContent = fs.readFileSync(mainPagePath, 'utf8');
let mainPageHash = sha256(mainPageContent); // для проверки возможности ответить 304


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
        res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${originalName}`);
        res.sendFile(path.resolve(__dirname,"upload",fileInfo.saveFN));
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
        };
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