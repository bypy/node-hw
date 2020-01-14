const express = require('express');
const fs = require('fs');
const path = require('path');
const { logLineAsync } = require('./utils/utils');

const webserver = express();
const port = 7980;
const logFN = path.join(__dirname, '_server.log');


webserver.get('/', async (req, res, next) => { 
    logLineAsync(logFN,"обращение к / - рендерим как /main");
    console.log("Finish");
    req.url='/upload';
    next();
});

webserver.get('/upload', (req, res) => {
    fs.createReadStream('static/upload-form.html').pipe(res);
});

webserver.post('/upload', (req, res) => {
    res.send('Спасибо!');
});

webserver.use('/postman', express.static(path.join(__dirname, '..', 'static')));

webserver.listen(port);