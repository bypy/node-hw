const express = require('express');
const path = require('path');
const fs = require('fs');
const Busboy = require('busboy');
const uuid = require('uuid-v4');

const webserver = express();
const port = 7980;
const uploadPath = path.join(__dirname, 'uploads');

const uploadedFilesDataH = {};

const storeFileInfo = (savedName, dataH) => {
    uploadedFilesDataH[savedName] = dataH;
    console.log(JSON.stringify(uploadedFilesDataH));
    console.log('Saved');
};

webserver.get('/', async (req, res, next) => { 
    //обращение к / - рендерим как /upload;
    console.log("Обращение к главной");
    req.url='/upload';
    next();
});

webserver.get('/upload', (req, res) => {
    res.sendFile(path.join(__dirname, 'static', 'upload-form.html'));
});

webserver.post('/upload', (req, res) => {
    
    const uploadingFileInfo = {
        saveFN:null,
        origFN:null
    };
    const COMMENT_FIELD_NAME = 'comment';
    const contentLength = req.headers['content-length'];
    
    const busboy = new Busboy({ headers: req.headers });
    req.pipe(busboy);

    busboy.on('field', (fieldname, val) => {
        if (fieldname === COMMENT_FIELD_NAME) {
            console.log(fieldname, val);
            uploadingFileInfo[COMMENT_FIELD_NAME] = val;
        }
    });

    busboy.on('file', (fieldname, file, filename) => {
        let fileSize = 0;
        
        file.on('data', data => {
            fileSize += data.length;
            console.log(`${contentLength - fileSize} bytes remains`);
        });

        let saveFileName = uuid() + path.extname(filename);
        uploadingFileInfo.saveFN = saveFileName;
        uploadingFileInfo.origFN = filename;
        
        let saveToPath = path.join(uploadPath,saveFileName);
        file.pipe(fs.createWriteStream(saveToPath));
    });

    busboy.on('finish', function() {
        console.log('Zero bytes remains');
        if (uploadingFileInfo.saveFN && uploadingFileInfo.origFN) {// можно загружать файл без комментария
            console.log('Ready to save in hash');
            let nameKey = uploadingFileInfo.origFN;
            delete uploadingFileInfo.origFN;
            storeFileInfo(nameKey, uploadingFileInfo);
        }
    });
    
    res.send('Спасибо!');
});

webserver.use(express.static(path.join(__dirname, 'static')));

webserver.listen(port);