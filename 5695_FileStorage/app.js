const express = require('express');
const path = require('path');
const bodyParser= require('body-parser');
const fs = require('fs');
const multer = require('multer');
const Busboy = require('busboy');
// const { logLineAsync } = require('./utils/utils');

const port = 7980;
const upload = multer({ dest: 'uploads/' });
// const logFN = path.join(__dirname, '_server.log');

const webserver = express();
webserver.use(bodyParser.urlencoded({extended: true}));

webserver.get('/', async (req, res, next) => { 
    //logLineAsync(logFN,"обращение к / - рендерим как /main");
    console.log("Обращение к главной");
    req.url='/upload';
    next();
});

webserver.get('/upload', (req, res) => {
    // fs.createReadStream(path.join(__dirname, 'static', 'upload-form.html'))
    //     .pipe(res);
    res.sendFile(path.join(__dirname, 'static', 'upload-form.html'));
});

//webserver.post('/upload', upload.single('attach'), (req, res) => {
webserver.post('/upload', (req, res) => {
    const busboy = new Busboy({ headers: req.headers  });
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        console.log(fieldname, filename, encoding, mimetype);
        file.on('data', data => {
            console.log('got ' + data.length + ' bytes');
        });
    });
    busboy.on('finish', function() {
        console.log("That's all folks!");
    });
    req.pipe(busboy);
    res.send('Спасибо!');
});

webserver.use(express.static(path.join(__dirname, 'static')));

webserver.listen(port);