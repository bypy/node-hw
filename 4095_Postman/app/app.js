const express = require('express');
const path = require('path');
const fetch = require("isomorphic-fetch");
const validateInput = require('./assertion.js');

const webserver = express();
const servPort = 7980;

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

    const errorKey = 'error';
    const warnKey = 'warning';
    
    try {
        const proxy_body = req.body;
        const validationResult = validateInput(proxy_body);
        let responseBody = null;

        //if (Object.keys(errors).length === 0) {
        if ( !(errorKey in Object.keys(validationResult)) ) {
            
            let proxyFetchParams = {
                method: proxy_body.method,
                params: joinArrayOfHashes(proxy_body.params),
                contentType: proxy_body.contentType,
                headers: joinArrayOfHashes(proxy_body.headers),
                body: proxy_body.body,
            };

            const response=await fetch(proxy_body.url, proxyFetchParams);
            const resHeaders = response.headers;
            const resText=await response.text();

            responseBody = {
                warnings: validationResult[warnKey],
                resStatus: resHeaders.status,
                resContentType: resHeaders['Content-Type'],
                resHeaders: resHeaders,
                resBody: resText
            };

        } else {
            responseBody = {
                warnings: validationResult[warnKey],
                error: validationResult[errorKey]
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
