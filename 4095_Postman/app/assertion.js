const assert = require('assert');

// примитивная проверка содержимого тела запроса на соответствие типу контента
const checkContent = function(reqBody, reqContentType) {
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
    }
};

const createUrlRegex = function() {
    var reS = "" ;
    reS += "^" ; // начало строки
    reS += "https?" ; // обязательный протокол (с опциональным символом 's' в конце)
    reS += "\\:\\/\\/" ; // протокол последовательность символов ://
    reS += "(w{3}\\.){0,1}" ; // 0 или 1 раз повторяющаяся последовательность из 3 символов 'w', заканчивающаяся точкой

    reS += "(?:"; // опциональная группа без захвата
    reS += "[a-zа-я0-9]{1,63}\\."; // доменное имя третьего уровня длиной от 1 до 63 символов, заканчивающееся точкой
    reS += ")?"; //

    reS += "[a-zа-я0-9]"; // первый символ имени домена второго уровня - последовательность символов букв, цифр, исключен знак тире
    reS += "[a-zа-я0-9\\-]{0,61}"; // последовательность символов букв, цифр и тире длиной от 0 до 61
    reS += "[a-zа-я0-9]"; // последний (второй из двух) символ имени домена второго уровня - последовательность символов букв, цифр, исключен знак тире
    reS += "\\."; // точка, отделяющая домен второго уровня от домена верхнего уровня
    reS += "[a-zа-я]{2,18}"; // домен верхнего уровня длиной минимум 2 символа, максимум 18 символов (длиннее не нашел)
    reS += "$"; // конец строки
    return new RegExp(reS,"i"); // ! нечувствительность к регистру в флаге 'i'
};

const applyAssert = function(asrt) {
    // применение правил для проверки данных запроса
    // возвращает хэш с источником и описанием ошибки
    let result = null;
    try {
        assert(asrt.cond, asrt.mess);
        console.log(`Параметр ${asrt.param} валидный`);
    } catch(e) {
        if (e.code === 'ERR_ASSERTION') {
            result = {
                param: asrt.param,
                message: asrt.mess,
                type: asrt.type
            };
        }
        console.log(e.message);
    }
    return result;
};

// все возможные проверки
const assertList = { // cond: проверяемое условие; mess: сообщение об ошибке; param: ключ параметра в хэше ошибок
    url: {
        cond: createUrlRegex().test(inp.url),
        mess: 'Введите корректный URL',
        param: 'url',
        type: 'error'
    },
    params_1: { // при указанных параметрах заполнено тело POST запроса
        cond: !(inp.params.length!==0 && inp.body.length!==0),
        mess: 'Исключите ТЕЛО запроса ИЛИ ПАРАМЕТРЫ',
        param: 'body',
        type: 'error'
    },
    params_2: { // параметр с пустым названием
        cond: Object.keys(inp.params).every( key => key !== ''),
        mess: 'Вы ввели значение, но не ввели название по крайней мере одного параметра',
        param: 'params',
        type: 'error'
    },
    body: { // нет ни праметров, ни тела POST-запроса
        cond: !(Object.keys(inp.params).length===0 && inp.body.length===0),
        mess: 'Укажите ИЛИ ПАРАМЕТРЫ ИЛИ ТЕЛО запроса',
        param: 'params',
        type: 'error'
    },
    contentType: { // не заполнен Content-Type POST-запроса
        cond: inp.body.length!==0&&inp.contentType,
        mess: 'Content-Type POST-запроса обязателен для заполнения',
        param: 'contentType',
        type: 'error'
    },
    contentType_body: { // содержимое тела запроса не соответствует указанному Content-Type
        cond: checkContent(inp.body, inp.contentType),
        mess: 'Content-Type обязателен для заполнения',
        param: 'contentType',
        type: 'warning' // не препятствовать отправке запроса, но уведомить
    },
    body_get: { // поптыка заполнить тело GET-запроса 
        cond: inp.body.length==0,
        mess: 'Для метода запроса GET не надо заполнять тело запроса',
        param: 'body',
        type: 'warning' // не препятствовать отправке запроса, но уведомить
    },
    headers: { // заголовок с пустым названием
        cond: Object.keys(inp.headers).every( key => key !== ''),
        mess: 'Вы ввели значение, но не ввели название по крайней мере одного заголовка',
        param: 'headers',
        type: 'error'
    }
};

const validateInput = function(inp) {

    // хэш ошибок
    let checkResults = {
        errors: [],
        warnings: []
    };

    // получим тип запроса
    const method = inp.method;
    let result = null;

    if (!method) {
        checkResults.errors.push({
            param: 'method',
            message: 'Вы не указали метод запроса'
        });
    } else if (method.toLowerCase() === 'post') {
        const postCheckList = [
            assertList.url, assertList.contentType, assertList.params_1,
            assertList.params_2, assertList.body, assertList.headers,
            assertList.contentType_body
        ];
        postCheckList.forEach(check => {
            result = applyAssert(check);
            checkResults[result.type].push({ // type = 'error' || 'warning'
                param: result.param,
                message: result.message
            });
        });
        // checkResult.push(applyAssert(assertList.url));
        // checkResult.push(applyAssert(assertList.contentType));
        // checkResult.push(applyAssert(assertList.params_1));
        // checkResult.push(applyAssert(assertList.params_2));
        // checkResult.push(applyAssert(assertList.body));
        // checkResult.push(applyAssert(assertList.headers));
        // checkResult.push(applyAssert(assertList.contentType_body));
    } else if (method.toLowerCase() === 'get') {
        checkResult.push(applyAssert(assertList.url));
        checkResult.push(applyAssert(assertList.body_get));
        checkResult.push(applyAssert(assertList.headers));
        checkResult.push(applyAssert(assertList.params_2));
    }

    return checkResult.filter( h => h!==null );
}


module.exports = validateInput;