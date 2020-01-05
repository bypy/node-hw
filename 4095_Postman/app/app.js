const express = require('express');
const path = require('path');
const fs = require('fs');
const fetch = require("isomorphic-fetch");
const sha256 = require('js-sha256').sha256;
const validateInput = require('./assertion.js');

const webserver = express();
const servPort = 7980;

const errorKey = 'error';
const warnKey = 'warning';

let reqHash = null;

webserver.use(express.json());

webserver.get('/postman/presets', async (req, res) => {
    let presetsData = fs.readFileSync(path.join(__dirname, '..', 'static', 'presets.json'), 'utf8');
    let hash = sha256(presetsData);
    let ifNoneMatch = req.header('If-None-Match');
    if ( ifNoneMatch && (ifNoneMatch === hash) ) {
        res.status(304).end();
        console.log('Cached');
    } else {
        res.setHeader('Content-Type', 'application/json; charset=UTF-8');
        res.setHeader('ETag', hash);
        res.setHeader('Cache-Control', 'public, max-age=0');
        res.send(presetsData);
        // обновить хэш в памяти
        reqHash = JSON.parse(presetsData);
    }  
});

webserver.use('/postman', express.static(path.join(__dirname, '..', 'static')));

webserver.post('/run', async (req, res) => {

    const multiPartFormat = function(paramsH) {
        // https://learn.javascript.ru/xhr-forms
        const boundary = String(Math.random()).slice(2);
        const boundaryMiddle = '--' + boundary + '\r\n';
        const boundaryLast = '--' + boundary + '--\r\n';
        let body = ['\r\n'];
        for (let key in paramsH) {
            // добавление поля
            body.push('Content-Disposition: form-data; name="'
                + key + '"\r\n\r\n' + paramsH[key] + '\r\n');
        }
        return body.join(boundaryMiddle) + boundaryLast;
    };
    
    try {
        const proxy_body = req.body;
        const validationResult = validateInput(proxy_body);
        let responseBody = null;

        if (errorKey in validationResult && validationResult[errorKey].length > 0) {
            // найдены ошибки
            responseBody = {
                [errorKey]: validationResult[errorKey],
                [warnKey]: validationResult[warnKey]
            };
        } else {
            // ошибок нет
            
            // если новая конфигурация запроса - сохраняю для переиспользования
            let presetName = (proxy_body.presetName === '') ? null : proxy_body.preset;
            const presetList = reqHash ? reqHash['names'] : null;
            if (presetName && presetList) {
                // добавить конфигурацию в хэш в памяти
                presetName = decodeURIComponent(presetName);
                proxy_body.preset = presetName;
                let presetIndex = presetList.indexOf(presetName);
                if (presetIndex < 0) {
                    // новое имя в списке имен отсутствует
                    presetIndex = presetList.length;
                    reqHash.names.push(presetName); 
                }
                // теперь в presetIndex указывает на последний элемент для новой конфигурации
                // или на индекс существующей (перезаписываемой) конфигурации
                // под числовым ключом presetIndex сохраняю новую конфигурацию запроса
                reqHash[presetIndex] = proxy_body;
                let presetsDataS = JSON.stringify(reqHash);
                let pathToPresets = path.join(__dirname, '..', 'static', 'presets.json');
                fs.writeFile(pathToPresets, presetsDataS, function(){
                    console.log('Конфигурация "' + presetName + '" добавлена');
                });    
            }

            // проксируем запрос

            const method = proxy_body.method.toLowerCase();
            const params = proxy_body.params;
            let contentType = proxy_body.contentType;
            let headers = proxy_body.headers;
            let url = proxy_body.protocol + '://' + proxy_body.url;
            let urlParams = '';
            let body = proxy_body.body;

            let proxyFetchParams = { // атрибуты проксированного запроса
                method: method,
                headers: headers
            };
            const paramsNotEmpty = Object.keys(params).length > 0;

            if (paramsNotEmpty) {
                urlParams = new URLSearchParams(params);
            }

            if (method === 'get') {
                if (paramsNotEmpty) {
                    // если указаны параметры для GET-запроса
                    urlParams = new URLSearchParams(params);
                    url = url+'?'+urlParams;
                }
            } else if (method === 'post') {
                if (paramsNotEmpty) {
                    // если указаны параметры для POST-запроса
                    switch (contentType) {
                    case 'multipart/form-data':
                        // отправка данных в формате multipart/form-data
                        body = multiPartFormat(params);
                        contentType += ";".concat(` boundary=${body.match(/(--\d+)/g)[0]}`);
                        break;
                    case 'application/x-www-form-urlencoded':
                        // отправка данных в формате x-www-form-urlencoded
                        body = urlParams;
                        break;
                    default:
                        // иначе преобразуем хэш параметров в JSON
                        body = JSON.stringify(params);
                    }
                } else {
                    // для запроса без параметров с типом данных application/json
                    if (contentType === 'application/json')
                        body = JSON.stringify(body);
                }
                // оставшиеся атрибуты проксированного запроса
                proxyFetchParams.headers['Content-Type'] = contentType;
                proxyFetchParams.body = body;
            }

            const response=await fetch(url, proxyFetchParams);
            const resHeaders = response.headers;
            const resText=await response.text();

            // формируем ответ
            responseBody = {
                [warnKey]: validationResult[warnKey], // покажем предупреждения
                resStatus: response.status,
                resContentType: resHeaders.get('Content-Type'),
                resHeaders: resHeaders._headers,
                resBody: resText
            };
        }

        res.setHeader("Content-type","application/json"); 
        res.send(responseBody);
    
    } catch (e) {
        console.log(e);
        res.status(500).end();
    }

});


webserver.listen(servPort);
