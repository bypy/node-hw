const assert = require('assert');

const errorKey = 'error';
const warnKey = 'warning';

// примитивная проверка содержимого тела запроса на соответствие типу контента
const checkBody = function(reqBody, reqContentType) {
    reqContentType = ''.concat(reqContentType.split(';')[0]).trim();
    switch (reqContentType) {
    case 'text/html':
        return /(<!DOCTYPE HTML|<html)/gi.test(reqBody);
    case 'text/xml':
        return /<\?xml/gi.test(reqBody);
    case 'application/json':
        try {
            JSON.parse(reqBody);
            return true;
        } catch (e) {
            return false;
        }
    default:
        return true;
    }
};

const incorrectContentType = function(reqParams, reqContentType) { // для POST-запросов
    if ( Object.keys(reqParams).length !==0 &&
        !(reqContentType === 'application/x-www-form-urlencoded'||reqContentType === 'multipart/form-data') )
        return false;
    else
        return true;
};

const checkParamsAndContent = function(reqParams, reqContentType) {
    if ((reqContentType==='application/x-www-form-urlencoded'||reqContentType==='multipart/form-data') &&
        (Object.keys(reqParams).length === 0))
        return false;
    else
        return true;
};

const testURLRegex = function() {
    // оставил для тестов валидным localhost:XXXX/любые-непробельные-символы
    return /^(w{3}\.){0,1}(?:[a-zа-я0-9]{1,63}\.)?[a-zа-я0-9][a-zа-я0-9-]{0,61}[a-zа-я0-9]\.[a-zа-я]{2,18}|localhost:\d{4}\/\S+$/i;
};


// применение правил для проверки данных запроса
const applyAssert = function(asrt) {
    // возвращает хэш с источником, описанием и критичностью ошибки
    let result = null;
    try {
        assert(asrt.cond, asrt.mess);
        //console.log(`Параметр ${asrt.param} валидный`);
    } catch(e) {
        if (e.code === 'ERR_ASSERTION') {
            result = {
                param: asrt.param,
                message: asrt.mess,
                type: asrt.type
            };
        }
        //console.log(e.message);
    }
    return result;
};


const validateInput = function(inp) {

    // заполним и вернем хэш ошибок
    let checkResults = {
        [errorKey]: [],
        [warnKey]: []
    };

    // все возможные проверки
    const assertList = { // cond: проверяемое условие; mess: сообщение об ошибке; param: ключ параметра в хэше ошибок
        url: {
            cond: testURLRegex().test(inp.url),
            mess: 'Введите корректный URL',
            param: 'url',
            type: errorKey
        },
        params_1: { // при указанных параметрах заполнено тело POST запроса
            cond: !(Object.keys(inp.params).length!==0 && inp.body.length!==0),
            mess: 'Исключите тело запроса ИЛИ параметры',
            param: 'body',
            type: errorKey
        },
        params_2: { // параметр с пустым названием
            cond: Object.keys(inp.params).every( key => key !== ''),
            mess: 'Вы ввели значение, но не ввели название по крайней мере одного параметра',
            param: 'params',
            type: errorKey
        },
        params_3: { // указан тип контента, предолагающий наличие параметров, но параметров нет
            cond: checkParamsAndContent(inp.params, inp.contentType),
            mess: 'Нет параметров, предполагаемых указанным Content-Type',
            param: 'params',
            type: errorKey
        },
        body: { // нет ни праметров, ни тела POST-запроса
            cond: !(Object.keys(inp.params).length===0 && inp.body.length===0),
            mess: 'Нет НИ параметров, НИ тела запроса.',
            param: 'params',
            type: errorKey
        },
        contentType_params: { // для POST-запроса с параметрами указан не корректный Content-Type
            cond: incorrectContentType(inp.params, inp.contentType),
            mess: 'Content-Type не указывает на передачу параметров',
            param: 'contentType',
            type: warnKey
        },
        contentType: { // заполнен Content-Type POST-запроса
            cond: inp.contentType !== '/',
            mess: 'Content-Type POST-запроса обязателен для заполнения',
            param: 'contentType',
            type: errorKey
        },
        contentType_body: { // содержимое тела запроса соответствует указанному Content-Type
            cond: checkBody(inp.body, inp.contentType),
            mess: 'Содержимое тела запроса не соответствует указанному Content-Type',
            param: 'contentType',
            type: warnKey // не препятствовать отправке запроса, но уведомить
        },
        body_get: { // поптыка заполнить тело GET-запроса 
            cond: inp.body.length==0,
            mess: 'Для метода запроса GET не надо заполнять тело запроса',
            param: 'body',
            type: warnKey // не препятствовать отправке запроса, но уведомить
        },
        contentType_get: { // ненужный Content-Type GET-запроса 
            cond: inp.contentType === '/',
            mess: 'Для метода запроса GET не надо указывать Content-Type',
            param: 'contentType',
            type: warnKey // не препятствовать отправке запроса, но уведомить
        },
        headers: { // заголовок с пустым названием
            cond: Object.keys(inp.headers).every( key => key !== ''),
            mess: 'Вы ввели значение, но не ввели название по крайней мере одного заголовка',
            param: 'headers',
            type: errorKey
        }
    };

    const method = inp.method; // получим тип запроса
    let error = null; // результат единичной проверки

    const postCheckList = [
        assertList.url, assertList.contentType, assertList.params_1,
        assertList.params_2, assertList.params_3, assertList.body,
        assertList.headers, assertList.contentType_body
    ];
    const getCheckList = [
        assertList.url, assertList.body_get, assertList.contentType_get,
        assertList.headers, assertList.params_2
    ];

    if (!method) {
        checkResults[errorKey].push({ // указание метода запроса обязательно
            param: 'method',
            message: 'Вы не указали метод запроса'
        });
    } else if (method.toLowerCase() === 'post') {
        postCheckList.forEach(check => {
            error = applyAssert(check);
            if (error)
                checkResults[error.type].push({ // type = 'error' || 'warning'
                    param: error.param,
                    message: error.message
                });
        });
    } else if (method.toLowerCase() === 'get') {
        getCheckList.forEach(check => {
            error = applyAssert(check);
            if (error)
                checkResults[error.type].push({ // type = 'error' || 'warning'
                    param: error.param,
                    message: error.message
                });
        });
    }

    return checkResults;
};


module.exports = validateInput;