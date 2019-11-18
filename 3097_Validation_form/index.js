const express = require('express');
const webserver = express();
const port = 3000;

webserver.get('/validate', (req, res) => {
    let responseData = '';
    res.send(responseData);
});

webserver.listen(port);
