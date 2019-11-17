const express = require('express');
const webserver = express();
const port = 3000;
let current = new Date().getFullYear();
let age = current - 2014;
let phrase = '';

webserver.get('/validate', (req, res) => {
    if (age<2) {
        phrase = '<h1>Буба мне люба!</h1>';
        age++;
        current++;
    } else 
        phrase = `<h1>Буба мне ${age++} года люба!</h1>
                 <p>Это будет в ${current++} году</p>`;
    for (var i in req) {
        if (i === 'protocol')
            console.log (req[i]);
    }
    res.send(phrase);
});

webserver.listen(port);
