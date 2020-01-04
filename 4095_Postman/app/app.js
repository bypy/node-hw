const express = require('express');
const path = require('path');
const fetch = require("isomorphic-fetch");
const validateInput = require('./assertion.js');

const webserver = express();
const servPort = 7980;

const errorKey = 'error';
const warnKey = 'warning';

webserver.use(express.json());
webserver.use('/postman', express.static(path.join(__dirname, '..', 'static')));

webserver.post('/run', async (req, res) => {

    const joinArrayOfHashes = function(arr) {
        // собирает хэши из массива в один хэш
        if (!Array.isArray(arr))
            return;
        const reducer = (acc, curr) => {
            Object.keys(curr).forEach(k => {
                acc[k] = curr[k];
            });
            return acc;
        };
        arr.reduce(reducer, {});
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
            // ошибок нет, проксируем запрос
            
            // TODO:
            // отправка параметров в зависимости от типа запроса (query / urlsearchparams)
            // переместить Content-Type в заголовки
            // https://developer.mozilla.org/ru/docs/Web/API/Fetch_API/Using_Fetch

            const method = proxy_body.method.toLowerCase();
            const params = joinArrayOfHashes(proxy_body.params);
            const contentType = proxy_body.contentType;
            let headers = joinArrayOfHashes(proxy_body.headers);
            let url = proxy_body.protocol + '://' + proxy_body.url;
            let urlParams = '';
            let body = proxy_body.body;

            let proxyFetchParams = {};

            if (Object.keys(params).length > 0) {
                urlParams = new URLSearchParams(params);
            }

            if (method === 'get') {
                url = (urlParams) ? url+'?'+urlParams : url;
                proxyFetchParams.method = method;
            } else if (method === 'post') {
                if (contentType)
                    headers['Content-Type'] = contentType;
                // TODO 'application/x-www-form-urlencoded'
                body = (urlParams) ? JSON.stringify(urlParams) : body;
                switch (contentType) {
                    case 'application/json':
                        // условимся, что параметры имеют приоритет выше, чем body
                        if (!urlParams)
                            body = JSON.stringify(body);
                        break;
                    case 'multipart/form-data':
                        // TODO multiPartFormat()
                        break;
                }

            }

            switch (method) {
                case 'get':
                    // метод запроса определит способ передачи параметров
                    url = (urlParams) ? url+'?'+urlParams : url;
                    proxyFetchParams.method = method;
                    break;
                case 'post':
                    
                    if (contentType !== 'multipart/form-data')
                        body = (urlParams) ? JSON.stringify(urlParams) : body;
                    else {

                    }
                    
                    break;
            }
            
            

            // let proxyFetchParams = {
            //     method: proxy_body.method,
            //     headers: headers,
            //     body: body
            // };

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
        console.log(e.message);
        res.status(500).end();
    }

});

webserver.listen(servPort);
