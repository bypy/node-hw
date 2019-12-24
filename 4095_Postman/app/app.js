const express = require('express');
const path = require('path');
const fetch = require("isomorphic-fetch");
const validateInput = require('./assertion.js');



const webserver = express();
const servPort = 7980;

webserver.use(express.json());
webserver.use('/postman', express.static(path.join(__dirname, '..', 'static')));


webserver.post('/run', async (req, res) => {

    try {
        const proxy_body = req.body;
        const errors = validateInput(proxy_body);
        let responseBody = null;

        const joinArrayOfHashes = function(arr) {
            const reducer = (acc, curr) => {
                Object.keys(curr).forEach(k => {
                    acc[k] = curr[k];
                })
                return acc;
            };
            arr.reduce(reducer, {});
        };

        if (Object.keys(errors).length === 0) {
            
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
                resStatus: resHeaders.status,
                resContentType: resHeaders['Content-Type'],
                resHeaders: resHeaders,
                resBody: resText
            };

        } else {
            
            responseBody = {
                error: errors
            };
        }

        res.setHeader("Content-type","application/json"); 
        res.send(responseBody);
    } catch (e) {
        res.status(401);
        res.send(e);
    }

});

webserver.listen(servPort);
