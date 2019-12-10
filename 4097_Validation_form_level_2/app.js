const express = require('express');
const webserver = express();
const servPort = 7980;

webserver.use(express.urlencoded({extended:true}));

const rainbowFields = require('./formRainbow.js').rainbowFields;
const rainbowAnswers = require('./formRainbow.js').rainbowAnswers;
const setDataModel = require('./validator.js').setDataModel;
const validate = require('./validator.js').validate;
const compare = require('./validator.js').compare;

let createFormInputs = (errorData, queryData, stdFields) => {
    /*  
    *   errorData: хэш полей содержащих ошибки и текст причины ошибки
    *   queryData: хэш со всеми именами полей и данными пользователя в них
    *   stdFields: оригинальный массив хэшей с описаниями полей ввода формы
    */

    const errInputStyle = "border: 1px solid red;";
    const errSpanFontSize = "0.8em";
    const errSpanLeftMargin = "1ex";
    const errColor = "#f00";
    
    let af = true; // флаг установки фокуса на первый элемент с ошибкой
    
    let formInputs = stdFields.map( fe => {
        let isError, errorInfo=null, errorSpan,
            type, name, placeholder,
            userVal, validStyle;
        
        name = fe.name||null;
        type = fe.type||null;
        isError = errorData?(name in errorData):false;
        if (isError) {
            errorInfo = errorData[name];
            errorSpan = `<span style="font-size:${errSpanFontSize}; margin-left:${errSpanLeftMargin}; color:${errColor};">
                            ${errorInfo}</span>`;
            af = af?false:af; // при первой найденной ошибке af примет false и не будет изменяться
        }
        placeholder = (!fe.optn?"*".concat(fe.ph):fe.ph)||"";
        userVal = queryData?queryData[name]:null;
        validStyle = `${userVal&&fe.bg?"background-color:"+fe.bg:""}`; // поля, заполненные верно будут оформляться в соответствии со стилем из stdFields

        return `<p><input ${type?'type='+type:""} ${name?'name='+name:""}
                        style='${isError?errInputStyle:validStyle}' placeholder='${placeholder}'
                            ${userVal?'value="'+userVal+'"':""} ${(isError&&af)?'autofocus':""} autocomplete="off"
                                onblur="this.placeholder='${placeholder}'"
                                    onfocus="this.placeholder=''">${isError?errorSpan:""}</p>`;
    });

    return formInputs.join("\n");
};

const sendServerError = reponse => {
    reponse.statusCode = 301;
    reponse.send(`<h1>У нас авария, но мы её уже ликвидируем!</h1>
        <a href="/form">Вернуться к форме</a> 
    `);
};

const getFormInnerHTML = (errFlag, inputs) => {
    const initNotif = 'Представьтесь и введите цвета радуги по порядку';
    const errorNotif = 'Форма содержит ошибки';
    const successNotif = 'Отлично!';
    const errColor = "#f00";
    const normalColor = "#111";
    
    let legendText;
    if (errFlag) legendText = errorNotif;
    else if (/value="(?!Проверить)/g.test(inputs)) legendText = successNotif; // костыль для различия страниц при первой загрузке и после отгаданных цветов
    else legendText = initNotif;

    return ( 
        `<fieldset>
            <legend style="color:${errFlag?errColor:normalColor}">
                ${legendText}</legend>
            ${inputs}
            <p>
                <input type="submit" value="Проверить">
            </p>
        </fieldset>`);
};

const path = '/form';
const modelName = 'rainbow';
setDataModel(modelName, rainbowAnswers);

// Две задачи:
// - обработка запроса страницы
// - обработка редиректа после успешной валидации данных
webserver.get(path, (req, res) => {
    let errorsH = {}; // не валидируем 
    let wereErrors = false; // не валидируем
    let userQuery = req.query;
    let formInputs = createFormInputs(errorsH,userQuery,rainbowFields);
    let formContent = getFormInnerHTML(wereErrors, formInputs);
    let resMarkup =
        `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>Радуга</title>
        </head>
        <body>
            <form action="${path}" method="post" novalidate autocomplete="off">
                ${formContent}
            </form>
        </body>
        </html>`;
    
    res.send(resMarkup);
});

//
webserver.post(path, (req, res) => {
    let errorsH = {};
    let postParams = req.body;
    let wereErrors;
    try {
        if (Object.keys(postParams).length > 0) {
            rainbowFields.forEach(field => {
                let results = [];
                let name = field.name;
                if ( name in postParams) {
                    let userAnswer = postParams[name].trim();
                    // ответ получен, пропускаем по цепочке валидации
                    if (!field.optn)
                        results.push( validate('filled', userAnswer) );
                    if (field.name === 'age')
                        results.push( validate('number', userAnswer) );
                    if (/color/.test(name)) {
                        results.push( compare(modelName, name, userAnswer, true) );
                        // флаг true приведет в нижний регистр и заменит ё на е
                    }
                }
                for (let i=0; i<results.length; i++){
                    let result = results[i];
                    if (result.status === false) {
                        errorsH[name]=result.text;
                        break; // запоминаем и выводим только первую ошибку
                    }    
                }
            });
            wereErrors = Object.keys(errorsH).length !== 0;
        } else { wereErrors = false; }

        let formInputs = createFormInputs(errorsH,postParams,rainbowFields);
        let formContent = getFormInnerHTML(wereErrors, formInputs);
        let resMarkup =
            `<!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="X-UA-Compatible" content="ie=edge">
                <title>Радуга</title>
            </head>
            <body>
                <form action="${path}" method="post" novalidate autocomplete="on">
                    ${formContent}
                </form>
            </body>
            </html>`;

        if (wereErrors)
            res.send(resMarkup);
        else {
            const urlParams = new URLSearchParams(postParams);
            const redirURL = req.originalUrl+'?'+urlParams;
            res.redirect(303, redirURL); // с 303 - это будет GET
        }

    } catch(e) {
        console.log(e); // минимальное логирование
        sendServerError(res);
    }
   
});

webserver.listen(servPort);
