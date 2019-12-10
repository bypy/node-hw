const express = require('express');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const sha256 = require('js-sha256').sha256;

// для импорта путей к файлам-источникам:
const dataSources = require('./prepareQuestion.js');
// название ключевого поля в хэше вопросов
const keyName = require('./keyName.js');

const webserver = express();
const servPort = 7980;

webserver.use(express.urlencoded({ extended: true }));
webserver.use('/voting', express.static(path.join(__dirname, '..', 'static')));

// пути к файлам-источникам текста вопросов и статистики ответов
const variantsTargetFilePath = dataSources.variants;
const statTargetFilePath = dataSources.stat;
const topic = dataSources.votingTopic;

webserver.get('/variants', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const fileStream = fs.createReadStream(variantsTargetFilePath);
    fileStream.pipe(res);
});

webserver.post('/vote', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    let statContent = fs.readFileSync(statTargetFilePath, 'utf8');
    let statData = JSON.parse(statContent);
    let keyToChange = req.body[keyName.key];
    statData[keyToChange] += 1;
    statContent = JSON.stringify(statData);
    fs.writeFileSync(statTargetFilePath, statContent);
    res.status(200).end();
});

webserver.get('/stat', async (req, res) => {
    let statData = fs.readFileSync(statTargetFilePath, 'utf8');
    let hash = sha256(statData);
    let ifNoneMatch = req.header('If-None-Match');
    if ( ifNoneMatch && (ifNoneMatch === hash) ) {
        res.status(304).end();
    } else {
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        res.setHeader('ETag', hash);
        res.setHeader('Cache-Control', 'public, max-age=0');
        res.send(statData);
    }  
});

webserver.get('/export', async (req, res) => {
    const clientAccept = req.headers.accept;
    const requestedFormat = clientAccept.split('/')[1].trim();
    switch (requestedFormat) {
    case 'html':
        res.setHeader('Content-Type', 'text/html; encoding=UTF-8');
        break;
    case 'xml':
        res.setHeader('Content-Type', 'application/xml; encoding=UTF-8');
        break;
    case 'json':
        res.setHeader('Content-Type', 'application/json; encoding=UTF-8');
        break;
    default:
        res.status(204).send('Экспорт невозможен');
        return;
    }
    try {
        const variantsH = JSON.parse(await fsp.readFile(variantsTargetFilePath));
        const statH = JSON.parse(await fsp.readFile(statTargetFilePath));
        const combinedStatH = ((questions, stat) => {
            questions.forEach(h => {
                h['votes'] = stat[h.code]; // дополняю хэш с вопросами статистикой
                delete h.code;
            });
            return questions;
        })(variantsH, statH);
        let statData = transformStatFormat(requestedFormat, combinedStatH);
        let hash = sha256(statData);
        let ifNoneMatch = req.header('If-None-Match');
        if ( ifNoneMatch && (ifNoneMatch === hash) ) {
            res.status(304).end();
        } else {
            res.setHeader('Content-Type', 'application/json; charset=UTF-8');
            res.setHeader('ETag', hash);
            res.setHeader('Cache-Control', 'public, max-age=0');
            res.send(statData);
        }
    } catch (err) {
        res.status(204).send('Экспорт невозможен');
    }
});

function transformStatFormat(targetFormat, statList) {
    let questionNodes,
        transformedStat;
    if (targetFormat === 'xml') {
        questionNodes = statList.map( q => `
            <question>
                <text>${q.text}</text>
                <votes>${q.votes}</votes>
            </question>`
        );
        transformedStat = 
            `<votingStat>
                <votingTopic>${topic}</votingTopic>
                <questionsList>${questionNodes.join('')}
                </questionsList>           
            </votingStat>`;

    } else if (targetFormat === 'html') {
        questionNodes = statList.map( q => `
            <tr>
                <td>${q.text}</td>
                <td>${q.votes}</td>
            </tr>`
        );
        transformedStat = 
            `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Статистика голосования</title>
            </head>
            <body>
                <table>
                    <caption>Статистика голосования "${topic}"</caption>
                    <thead>
                        <tr>
                            <th>Текст вопроса</th>
                            <th>Число голосов</th>
                        </tr>
                    </thead>
                    <tbody>${questionNodes.join('')}
                    </tbody>
                </table>	
            </body>
            </html>`;
    } else if (targetFormat === 'json') {
        questionNodes = statList.map( q => `
            {
                "text":"${q.text.replace(/"/gm, '\\"')}", 
                "votes":${q.votes}
            }`);
        
        transformedStat = 
            `{
                "votingTopic": "${topic}",
                "stat": [${questionNodes.join(',')}
                ]
            }`;
    }
    return transformedStat;
}

webserver.listen(servPort);
