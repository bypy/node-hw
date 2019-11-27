const express = require('express');
const webserver = express();
const servPort = 7980;

webserver.get('/', (req, res) => {
    let scriptBody = 
        `'use strict';
        
        const buildVoteForm = () => {
            let formWrapper = document.querySelector('.vote-form__variants');
            let variantsURL = 'http://localhost:8089/variants';
            
            let performRequest = function(url) { 
                return new Promise(function(resolve, reject) {
                    let xhr = new XMLHttpRequest();
                    xhr.onload = function() {
                        if (xhr.status === 200)
                            resolve(xhr.responseText);
                        else
                            reject(xhr.statusText);
                    };
                    xhr.onerror = function(e) {
                        reject(e);
                    };
                    xhr.open('GET', url);
                    xhr.send();   
                });
            };
            
            let createInputs = questions =>
                questions.map(q => 
                    \`<label class='vote-form__variants'><input type='radio' name='gaidai' value='\${q.code}'>\${q.text}</label>\`
                ).join('\\n');
            
            let createForm = inputs => 
                \`<form id='vote-form' action='#' onsubmit='sendAndUpdate()' class='vote-form__body'>
                    \${inputs}
                    <input type='submit' class='vote-form__submit'>
                </form>\`;
            
            let getVariants = performRequest(variantsURL);
            getVariants
                .then(res =>
                    JSON.parse(res)
                )
                .then( questions => createInputs(questions) )
                .then( formMarkup => {
                    formWrapper.innerHTML = formMarkup;
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
                    font-size: 62.5%;
                }
                
                * {
                    font-size: inherit;
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
                    background-color: #000;
                }
                
                .content {
                    position: absolute;
                    width: 100%;
                    height: 50%;
                    top: 30%;
                    border-radius: 4em;
                    background-color: yellow;
                    z-index: 102;
                    opacity: .8;
                }
                
                .content__illustr {
                    position: absolute;
                    top:6%;
                    width: 60%;
                    max-width: 300px;
                    height: 25%;
                    left: 20%;
                    background-image: url(pic.jpg);
                    background-size: auto 100%;
                    background-position: center center;
                    background-color: grey;
                    background-repeat: no-repeat;
                    border-radius: 2em 2em 0 0;
                    z-index: 100;
                }
                
                .vote-form__heading {
                    margin: 0;
                    font-size: 200%;
                    text-align: center;
                }
                
                
                .content__form {
                    background-color: #e00;
                    z-index: 2;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="content">
                    <div class="content__form vote-form">
                        <h2 class="vote-form__heading">Кто хочет сегодня поработать?!</h2>
                        <form id="vote-form" action="#" onsubmit="sendAndUpdate() class="vote-form__body">
                            <div class="vote-form__variants">

                            </div>
                            <input type="submit" class="vote-form__submit">
                        </form>
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
        res.send(mainPage);
    } catch(e) {
        console.log(e);
        res.status(404).end();
    }
});

webserver.listen(servPort);
