const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

// для импорта путей к файлам-источникам:
const dataSources = require('./prepareQuestion.js');
// название ключевого поля в хэше вопросов
const keyName = require('./keyName.js');

const webserver = express();
const servPort = 7980;

webserver.use(express.urlencoded({extended:true}));
webserver.use(bodyParser.text());
webserver.use(
    '/voting',
    express.static(path.join(__dirname,'..','static'))
);

// пути к файлам-источникам текста вопросов и статистики ответов
const variantsTargetFilePath = dataSources.variants;
const statTargetFilePath = dataSources.stat;

webserver.get('/variants', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(fs.readFileSync(variantsTargetFilePath, 'utf8'));
});

webserver.post('/stat', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.send(fs.readFileSync(statTargetFilePath, 'utf8'));
});

webserver.post('/vote', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    let statContent = fs.readFileSync(statTargetFilePath, 'utf8');
    let statData = JSON.parse(statContent);
    let keyToChange = req.body[keyName.key];
    statData[keyToChange] +=1;
    statContent = JSON.stringify(statData);
    fs.writeFileSync(statTargetFilePath, statContent);
    res.status(200).end();
});

webserver.post('/export', (req, res) => {
    const requestedFormat = req.body;
    console.log(requestedFormat);
});

webserver.listen(servPort);


