const express = require('express');
// const fs = require('fs');
// const fsp = require('fs').promises;
const path = require('path');
// const sha256 = require('js-sha256').sha256;

const webserver = express();
const servPort = 7980;

webserver.use(express.urlencoded({ extended: true }));
webserver.use('/postman', express.static(path.join(__dirname, '..', 'static')));
// webserver.get('/postman', (req, res) => {
//     res.sendFile(path.resolve(__dirname,'../static/index.html'));  
// });


webserver.post('/postman', (req, res) => {
    const body = req.body;
    res.setHeader("Content-type","application/json");
    const responseBody = {
        resStatus: 200,
        resContentType: "text/html",
        resHeaders: [
            "Connection: keep-alive",
            "Content-Encoding: gzip"
        ],
        resBody: '<!DOCTYPE html>\\n<html lang="en">\\n\\n<head>\\n    <meta charset=\\"UTF-8\\">\\n    <link rel=\\"stylesheet\\" href=\\"css/bootstrap.min.css\\">\\n    <title>\\u0410\\u0440\\u0445\\u0438\\u0432 \\u043f\\u0440\\u043e\\u0435\\u043a\\u0442\\u043e\\u0432</title>\\n    <style>\\n        .illustration img {\\n            margin: 0 auto;\\n            max-height: 350px;\\n        }\\n        .data {\\n            margin-top: 2em;\\n            font-size: 200%;\\n        }\\n        .projects {\\n            text-align: center;\\n        }\\n        @media all and (orientation: landscape) {\\n            .illustration {\\n                width: 30%;\\n                margin-left: 4%;\\n            }\\n            .list {\\n                width: 70%;\\n                max-width: 600px;\\n                font-size: 50%;\\n            }\\n        }\\n    </style>\\n</head>\\n\\n<body>\\n    <div id=\\"page\\" class=\\"container-fluid\\">\\n        <div class=\\"data row\\">\\n            <div id=\\"illustration\\" class=\\"illustration col-xs-12\\">\\n                <img src=\\"img/archive_1.jpg\\" class=\\"img-responsive\\" alt=\\"illustration\\">\\n            </div>\\n            <div class=\\"list col-xs-12\\">\\n                <div id=\\"projects\\" class=\\"projects list-group\\">\\n                    <a href=\\"lureshmedia/index.html\\" class=\\"list-group-item\\">\\n                        <h2 class=\\"list-group-item-heading\\">\\u0420\\u0410 &laquo;\\u041b\\u0443\\u0447\\u0448\\u0438\\u0435 \\u0440\\u0435\\u0448\\u0435\\u043d\\u0438\\u044f&raquo;</h4>\\n                            <p class=\\"list-group-item-text\\">2010-2019</p>\\n                    </a>\\n                    <a href=\\"randomizer-loto/index.html\\" class=\\"list-group-item\\">\\n                        <h2 class=\\"list-group-item-heading\\">\\u0420\\u0430\\u043d\\u0434\\u043e\\u043c\\u0430\\u0439\\u0437\\u0435\\u0440 &laquo;\\u0421\\u0443\\u043f\\u0435\\u0440\\u043b\\u043e\\u0442\\u043e&raquo;</h4>\\n                            <p class=\\"list-group-item-text\\">2019</p>\\n                    </a>\\n                    <a href=\\"zoo/index.html\\" class=\\"list-group-item\\">\\n                        <h2 class=\\"list-group-item-heading\\">\\u041a\\u043e\\u043d\\u043a\\u0443\\u0440\\u0441 &laquo;\\u041c\\u043e\\u0439 \\u0414\\u0440\\u0443\\u0433&raquo;</h4>\\n                            <p class=\\"list-group-item-text\\">2019</p>\\n                    </a>\\n                </div>\\n            </div>\\n        </div>\\n    </div>\\n</body>\\n\\n</html>'
    };
    res.send(responseBody);
});


// function postData(url = '', data = {}) {
//     // Значения по умолчанию обозначены знаком *
//       return fetch(url, {
//           method: 'POST', // *GET, POST, PUT, DELETE, etc.
//           mode: 'cors', // no-cors, cors, *same-origin
//           cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
//           credentials: 'same-origin', // include, *same-origin, omit
//           headers: {
//               'Content-Type': 'application/json',
//               // 'Content-Type': 'application/x-www-form-urlencoded',
//           },
//           redirect: 'follow', // manual, *follow, error
//           referrer: 'no-referrer', // no-referrer, *client
//           body: JSON.stringify(data), // тип данных в body должен соответвовать значению заголовка "Content-Type"
//       })
//       .then(response => response.json()); // парсит JSON ответ в Javascript объект
//   }


// webserver.get('/variants', (req, res) => {
//     res.setHeader('Content-Type', 'application/json; charset=UTF-8');
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     const fileStream = fs.createReadStream(variantsTargetFilePath);
//     fileStream.pipe(res);
// });

// webserver.post('/vote', (req, res) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Content-Type', 'application/json; charset=UTF-8');
//     let statContent = fs.readFileSync(statTargetFilePath, 'utf8');
//     let statData = JSON.parse(statContent);
//     let keyToChange = req.body[keyName.key];
//     statData[keyToChange] += 1;
//     statContent = JSON.stringify(statData);
//     fs.writeFileSync(statTargetFilePath, statContent);
//     res.status(200).end();
// });

// webserver.get('/stat', async (req, res) => {
//     let statData = fs.readFileSync(statTargetFilePath, 'utf8');
//     let hash = sha256(statData);
//     let ifNoneMatch = req.header('If-None-Match');
//     if ( ifNoneMatch && (ifNoneMatch === hash) ) {
//         res.status(304).end();
//     } else {
//         res.setHeader('Content-Type', 'application/json; charset=UTF-8');
//         res.setHeader('ETag', hash);
//         res.setHeader('Cache-Control', 'public, max-age=0');
//         res.send(statData);
//     }  
// });

// webserver.get('/export', async (req, res) => {
//     const clientAccept = req.headers.accept;
//     const requestedFormat = clientAccept.split('/')[1].trim();
//     switch (requestedFormat) {
//     case 'html':
//         res.setHeader('Content-Type', 'text/html; encoding=UTF-8');
//         break;
//     case 'xml':
//         res.setHeader('Content-Type', 'application/xml; encoding=UTF-8');
//         break;
//     case 'json':
//         res.setHeader('Content-Type', 'application/json; encoding=UTF-8');
//         break;
//     default:
//         res.status(204).send('Экспорт невозможен');
//         return;
//     }
//     try {
//         const variantsH = JSON.parse(await fsp.readFile(variantsTargetFilePath));
//         const statH = JSON.parse(await fsp.readFile(statTargetFilePath));
//         const combinedStatH = ((questions, stat) => {
//             questions.forEach(h => {
//                 h['votes'] = stat[h.code]; // дополняю хэш с вопросами статистикой
//                 delete h.code;
//             });
//             return questions;
//         })(variantsH, statH);
//         let statData = transformStatFormat(requestedFormat, combinedStatH);
//         let hash = sha256(statData);
//         let ifNoneMatch = req.header('If-None-Match');
//         if ( ifNoneMatch && (ifNoneMatch === hash) ) {
//             res.status(304).end();
//         } else {
//             res.setHeader('Content-Type', 'application/json; charset=UTF-8');
//             res.setHeader('ETag', hash);
//             res.setHeader('Cache-Control', 'public, max-age=0');
//             res.send(statData);
//         }
//     } catch (err) {
//         res.status(204).send('Экспорт невозможен');
//     }
// });

// function transformStatFormat(targetFormat, statList) {
//     let questionNodes,
//         transformedStat;
//     if (targetFormat === 'xml') {
//         questionNodes = statList.map( q => `
//             <question>
//                 <text>${q.text}</text>
//                 <votes>${q.votes}</votes>
//             </question>`
//         );
//         transformedStat = 
//             `<votingStat>
//                 <votingTopic>${topic}</votingTopic>
//                 <questionsList>${questionNodes.join('')}
//                 </questionsList>           
//             </votingStat>`;

//     } else if (targetFormat === 'html') {
//         questionNodes = statList.map( q => `
//             <tr>
//                 <td>${q.text}</td>
//                 <td>${q.votes}</td>
//             </tr>`
//         );
//         transformedStat = 
//             `<!DOCTYPE html>
//             <html>
//             <head>
//                 <meta charset="UTF-8">
//                 <title>Статистика голосования</title>
//             </head>
//             <body>
//                 <table>
//                     <caption>Статистика голосования "${topic}"</caption>
//                     <thead>
//                         <tr>
//                             <th>Текст вопроса</th>
//                             <th>Число голосов</th>
//                         </tr>
//                     </thead>
//                     <tbody>${questionNodes.join('')}
//                     </tbody>
//                 </table>	
//             </body>
//             </html>`;
//     } else if (targetFormat === 'json') {
//         questionNodes = statList.map( q => `
//             {
//                 "text":"${q.text.replace(/"/gm, '\\"')}", 
//                 "votes":${q.votes}
//             }`);
        
//         transformedStat = 
//             `{
//                 "votingTopic": "${topic}",
//                 "stat": [${questionNodes.join(',')}
//                 ]
//             }`;
//     }
//     return transformedStat;
// }

webserver.listen(servPort);
