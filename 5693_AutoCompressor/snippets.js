-----------------------------------------------------------------------------------

const path = require('path');
const fs = require('fs');

var readStream=fs.createReadStream( path.join(__dirname,"data.txt") );
var writeStream=fs.createWriteStream( path.join(__dirname,"data_copy.txt") );

readStream.on('data', chunk => {
    console.log('chunk length='+chunk.length);
    writeStream.write(chunk);
});
readStream.on('end',()=>{
    writeStream.end();
});
readStream.on('error', err =>{
    console.log("ERROR!",err);
});

************************************************************************************

const path = require('path');
const fs = require('fs');

var readStream=fs.createReadStream( path.join(__dirname,"data.txt") );
var writeStream=fs.createWriteStream( path.join(__dirname,"data_copy.txt") );

readStream.pipe(writeStream);

************************************************************************************

const req = http.request(options, (res) => {

    console.log(`statusCode: ${res.statusCode}`);

    var writeStream=fs.createWriteStream( resultFile );
    // если файл уже есть, createWriteStream по умолчанию его перезаписывает (flags:'w'), поэтому удалять файл в начале и не пришлось

    res.on('data', chunk => {
        console.log(chunk.length+' downloaded...');  
        // с потоками можно не бояться делать много операций подряд, они не "перепутаются"
        writeStream.write(chunk);
    });
  
    res.on('end',()=>{
        console.log("resource has been downloaded");
        writeStream.end();
    });
    
    writeStream.on('close', ()=>{
        console.log("file has been written");
    });
    
});

************************************************************************************