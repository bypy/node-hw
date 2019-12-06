const express = require('express');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const os = require('os');

const webserver = express();
const servPort = 7980;

webserver.use(
    '/public',
    express.static(path.join(__dirname,'..','static'))
);

webserver.use(express.urlencoded({extended:true}));


const variantsSrcFilePath = path.join(__dirname, 'вопросы для опроса.txt');
const variantsTargetFilePath = path.join(__dirname, 'variants.json');
const statTargetFilePath = path.join(__dirname, 'stat.json');

// название ключевого поля в хэше вопросов
const keyName = 'code';
let jsonFileBody;

// специалист по опросам набирал текст вопросов в Akelpad
// и загрузил документ 'вопросы для опроса.txt' в кодировке windows-1251 
let buf = fs.readFileSync(variantsSrcFilePath);
let fileContent = iconv.decode(buf, 'win1251');
let questions = fileContent.split(os.EOL);
// формирую содержимое JSON файла с вариантами ответов
let index = 0;
let questionList = questions.map(qText => {
    index++;
    let questionH = {};
    questionH[keyName] = 'q'+ index.toString();
    questionH.text = qText;
    return questionH;
});
jsonFileBody = iconv.encode(JSON.stringify(questionList), 'utf8');
// записал в файл
fs.writeFileSync(variantsTargetFilePath, jsonFileBody);


// инициализация содержимого JSON файла со статистикой ответов
let statRec = {};
questionList.forEach(q => {
    let code = q.code;
    if (code) statRec[code] = 0;
});
jsonFileBody = JSON.stringify(statRec);
fs.writeFileSync(statTargetFilePath, jsonFileBody);




// webserver.get('/mainpage/voting.html', (req, res) => {
//     try {
//         res.setHeader('Content-Type', 'text/html; charset=UTF-8');
//         res.send(mainPage);
//     } catch(e) {
//         res.status(404).end();
//     }
// });

// webserver.get('/pic.jpg', (req, res) => {
//     const filePath=path.join(__dirname, 'pic.jpg');
//     const fileStream=fs.createReadStream(filePath);
//     res.setHeader('Content-Type', 'image/jpeg');
//     fileStream.pipe(res);
// });

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
    let keyToChange = req.body[keyName];
    statData[keyToChange] +=1;
    statContent = JSON.stringify(statData);
    fs.writeFileSync(statTargetFilePath, statContent);
    res.status(200).end();
});

webserver.listen(servPort);
