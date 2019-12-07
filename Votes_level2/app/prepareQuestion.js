(function(){

    const path = require('path');
    const fs = require('fs');
    const os = require('os');
    const iconv = require('iconv-lite');
    // название ключевого поля в хэше вопросов
    const keyName = require('./keyName.js');
    const dataFolderName = 'data';

    const variantsSrcPath = path.join(__dirname,dataFolderName,'вопросы для опроса.txt');
    const variantsTargetPath = path.join(__dirname,dataFolderName,'variants.json');
    const statTargetPath = path.join(__dirname,dataFolderName,'stat.json');

    // const keyName = 'code';
    let jsonFileBody;

    // специалист по опросам набирал текст вопросов в Akelpad
    // и загрузил документ 'вопросы для опроса.txt' в кодировке windows-1251 
    let buf = fs.readFileSync(variantsSrcPath);
    let fileContent = iconv.decode(buf, 'win1251');
    let questions = fileContent.split(os.EOL);
    // формирую содержимое JSON файла с вариантами ответов
    let index = 0;
    let questionList = questions.map(qText => {
        index++;
        let questionH = {};
        questionH[keyName.key] = keyName.prefix + index.toString();
        questionH.text = qText;
        return questionH;
    });
    jsonFileBody = iconv.encode(JSON.stringify(questionList), 'utf8');
    // записал в файл
    fs.writeFileSync(variantsTargetPath, jsonFileBody);


    // инициализация содержимого JSON файла со статистикой ответов
    let statRec = {};
    questionList.forEach(q => {
        let code = q.code;
        if (code) statRec[code] = 0;
    });
    jsonFileBody = JSON.stringify(statRec);
    fs.writeFileSync(statTargetPath, jsonFileBody);


    module.exports = {
        variants: variantsTargetPath,
        stat: statTargetPath
    };

}());