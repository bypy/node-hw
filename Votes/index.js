const express = require('express');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const os = require('os');

const webserver = express();
const servPort = 7980;

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


// формирую содержимое JSON файла со статистикой ответов
let statH = questionList.map(q => {
    let statRec = {};
    console.log(q);
    if (q.code) statRec[q.code] = 0;
    return statRec;
});
jsonFileBody = JSON.stringify(statH);
fs.writeFileSync(statTargetFilePath, jsonFileBody);


webserver.use(express.urlencoded({extended:true}));

webserver.get('/mainpage', (req, res) => {
    
    let scriptBody = 
        `'use strict';
        
        const buildVoteForm = () => {
            
            const tableWrapper = document.querySelector('.vote-table__wrapper');
            const variantsURL = 'http://localhost:7980/variants';
            const statURL = 'http://localhost:8089/stat';
            const voteURL = 'http://localhost:8089/vote';
            const voteButtonActionName = 'vote';
            
            const performRequest = function(url, params) { 
                params = params || {};
                const request = new Request(url, params);
                return new Promise( (resolve, reject) => {
                    fetch(request)
                        .then(response => {
                            if (response.status === 200) {
                                resolve(response.text());
                            } else {
                                throw new Error('Something went wrong on api server!');
                            }
                        })
            
                });
            };


            const getVariants = () => performRequest(variantsURL);
            
            const getStat = () => {
                const params = {
                    method:'POST'
                };
                return performRequest(statURL, params);
            };

            const sendVote = (answerCode) => {
                const params = {
                    method:'POST',
                    headers: {
                        'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'
                    },
                    body: encodeURIComponent(answerCode)
                };
                return performRequest(voteURL, params);
            }
                    
            const createInputs = (stat, questions) =>
            questions.map(q => 
                \`<tr>
                    <td class='vote-table__question'>
                        <input type='button' data-action='\${voteButtonActionName}'
                            name='\${q.code}' value='\${q.text}'></td>
                    <td class='vote-table__result'>\${stat[q.code]}</td>
                </tr>\`
            ).join('\\n');
        
            const createQuestionTable = inputs => 
                \`<table class='vote-table__body'>
                    <tbody>
                        \${inputs}
                    <tbody>
                </table>\`;

            const refreshStat = stat => {
                let statRows = tableWrapper.querySelectorAll('tr');
                statRows.forEach( row => {
                    let voteBtn = row.querySelector('input[data-action="vote"]');
                    if ( voteBtn ) {
                        let currVoteCode = voteBtn.getAttribute('name');
                        row.querySelector('td[class="vote-table__result"]').textContent = stat[currVoteCode];
                    }
                })
            };

            const sendAndUpdate = (EO) => {
                if (EO.target.getAttribute('data-action') === voteButtonActionName) {
                    sendVote(EO.target.name)
                        .then( () => { 
                            console.log("Голос засчитан"); 
                            return getStat();
                        })
                        .then( stat => {
                            let updStat = JSON.parse(stat);
                            refreshStat(updStat);
                        })
                        .catch(function(e) {
                            console.log(e);
                        })
                }
            };
            
            const listenVotes = () => {
                tableWrapper.addEventListener('click', sendAndUpdate);
            }
            
            Promise.all([getStat(), getVariants()])
                .then(values => {
                    let stats = JSON.parse(values[0]);
                    let variants = JSON.parse(values[1]);
                    let inputs = createInputs(stats, variants);
                    let questionTable = createQuestionTable(inputs);
                    tableWrapper.innerHTML = questionTable;
                    listenVotes();
                })
                .catch(function(e) {
                    console.log(e);
                })
            ;

        }; // buildVoteForm

        window.addEventListener('DOMContentLoaded', buildVoteForm);`;

    let mainPage = 
        `<!doctype html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Vote</title>
            
            <style>
                html { 
                    font-size: 100%;
                    font-family: Verdana, Geneva, Tahoma, sans-serif;
                }
                
                html, body {
                    height: 100%;
                    margin: 0;
                }
                
                .container {
                    position: relative;
                    min-height: 100%;
                    width: 80%;
                    max-width: 500px;
                    margin: 0 auto;
                    background-color: #fff;
                }
                
                .vote-page__content {
                    position: absolute;
                    width: 100%;
                    top: 30%;
                    border-radius: 2em;
                    background-color: #fee;
                    z-index: 102;
                }
                
                .content__illustr {
                    position: absolute;
                    top:6%;
                    width: 60%;
                    max-width: 190px;
                    height: 25%;
                    left: 50%;
                    transform: translateX(-50%);
                    background-image: url(pic.jpg);
                    background-size: auto 100%;
                    background-position: center center;
                    background-color: transparent;
                    background-repeat: no-repeat;
                    border-radius: 2em 2em 0 0;
                    z-index: 100;
                }
                
                .vote-table__heading {
                    padding-left: 1em;
                    padding-right: 1em;
                    margin: .5em 0;
                    font-size: 150%;
                    text-align: center;
                    color:#f35656
                }

                .vote-table__body {
                    width: 100%;
                    font-size: 90%;
                }

                .vote-table__wrapper {
                    padding-left: 2em;
                    padding-right: 2em;
                    margin-bottom: 2em;
                }
                                
                .vote-table__question input {
                    max-width: 80%;
                    padding-top: .25em;
                    padding-bottom: .25em;
                    border-radius: 1ex;
                    white-space: normal;
                    text-align: inherit;
                }

                .vote-table__result {
                    text-align: right;
                }

                .content__form {
                    background-color: #fdd;
                    z-index: 2;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="vote-page__content">
                    <h2 class="vote-table__heading">Кто хочет сегодня поработать?!</h2>
                        <div class="vote-table__wrapper">

                        </div>
                </div>
                <div class="content__illustr"></div>
            </div>
            <script>
                ${scriptBody}
            </script>
        </body>
        </html>`;
    
    try {
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.send(mainPage);
    } catch(e) {
        console.log(e);
        res.status(404).end();
    }
});

webserver.get('/variants', (req, res) => { 
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(fs.readFileSync(variantsTargetFilePath, 'utf8'));
});

webserver.listen(servPort);
