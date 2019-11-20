const express = require('express');
const webserver = express();
const servPort = 7980;

const getResponseMarkup = (result, url) => {
    // result.error: {code:number, text:string, login:string},
    // result.data: {realName:string , email:string} -- данные для отображеня в кабинете пользователя
    // url: {protocol:string, host:string, port:number, path:string, method:string, userQuery:object} -- текущий констект ссылки, переданный роутером

    const charSet = 'UTF-8';
    const cabinet = '/cabinet'; // путь к личному кабинету
    const isValid = !result.error;
    const errCode = error?error.code:null;

    /* Функции, формирующие шаблоны */
    const profileStyles =
        `html { font-size: 200%; }`;
    
    const loginStyles =
        `html { font-size: 200%; }
        form { max-width: 20em; margin-left: auto; margin-right: auto; }
        form * { font-size: inherit; }`;
    
    // содержимое страницы входа в личный кабинет
    const loginBodyContent = (newAttemp) => {
        let userPrompt, lastLogin, 
            passfocus = false;
        if (newAttemp) {
            userPrompt = 'Требуется авторизация';
            lastLogin = '';
        } else {
            userPrompt = error.text;
            if (errCode===2 || errCode===10) {
                lastLogin = error.login;
                passfocus = true;
            }
        }
        return `<form action="${''.concat(url.protocol,'://',url.host,':',url.port,cabinet)}" method="${url.method}" novalidate>
            <fieldset>
                <legend class="legend" style="color:red;">${userPrompt}</legend>
                <p><input type="text" name="username" placeholder="Login" autocomplete="off" onfocus='this.placeholder=""'
                        onblur='this.value?this.placeholder="":this.placeholder="Login"'
                            required ${!lastLogin?'autofocus':null} value="${lastLogin}"></p>

                <p><input type="password" name="password" placeholder="Password" autocomplete="off"
                        onfocus='this.placeholder=""'
                            onblur='this.placeholder?this.placeholder="":this.placeholder="Password"'
                                required ${passfocus?'autofocus':null}></p>

                <p>
                    <input type="submit" value="Enter">
                </p>
            </fieldset>
        </form>`;
    };
    
    const profileBodyContent = () => 
        `<h1>Здравствуйте, дорогой друг!</h1>
        <p>Вы в своем личном кабинете, ${data.personName}.</p>
        <p>Ваш регистрационный адрес &mdash; ${data.email}.</p>`;


    const errorBodyContent = // содержимое страницы при ошибке серверного скрипта
        `<h1>У нас авария, но мы её уже ликвидируем!</h1>`;

    /*
    * Компоновка страницы из шаблонов
    */
    let titleText, styles, body;

    switch (url.path) {
        case "/":
            titleText = 'Страница входа в личный кабинет';
            styles = loginStyles;
            body = loginBodyContent(true); // true - попыток входа еще не было
            break;
        case "/cabinet":
            if (isValid) {
                titleText = 'Личный кабинет';
                styles = profileStyles;
                body = profileBodyContent();
            } else {
                titleText = 'Ошибка!';
                styles = loginStyles;
                body = (errCode !== 100) ? loginBodyContent(false) : errorBodyContent;
            }
            break;
    }

    /* Готовая разметка */
    let page =
        `<!DOCTYPE html>
        <html>
        <head>
            <meta charset=${charSet}>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>${titleText}</title>
            <style>
                ${styles}
            </style>
        </head>
        <body>
            ${body}
        </body>
        </html>`;

    return page;
} // getResponseMarkup

const collectReqData = req => ({
    protocol:req.protocol,
    host:req.hostname,
    port:servPort, // из внешней области
    path:req.route.path,
    method:req.method.toLocaleLowerCase(),
    userQuery:req.query
});

const validateInput = (loginName, loginPass) => {
    
    let error = null;

    if (!loginName) {
        error.code = 1;
        error.text = 'Введите логин';
    } else if (!loginPass) {
        error.code = 2;   
        error.text = 'Введите пароль';
    }

    return error;
};

const getUserData = (loginName, loginPass) => {
    const pKey = 'pass';
    const credentialsHash = {
        'superboss': {
            pass: '1q2w3e4r',
            realName: 'Веня',
            email: '123@tut.by'
        }
    };

    let error = null;
    let data = null;



    let userName = credentialsHash[loginName]['realName'];
    let userMail = credentialsHash[loginName]['email'];

    if (!(loginName in credentialsHash)) {
        error.code = 5;
        error.text = 'Пользователь не зарегистрирован';
    } else if (credentialsHash[loginName][pKey] !== loginPass) {
        error.code = 10;
        error.text = 'Введен неверный пароль';
    } else {

    }

    return ({name:userName, mail:userMail});
}

const sendServerError = reponse => {
    reponse.statusCode = 301;
    const error = { code:100 };
    reponse.send( getResponseMarkup(error) ); // getResponseMarkup(error, null, null)
}

webserver.get('/', (req, res) => {
    let resMarkup;
    let requestData = collectReqData(req);
    try {
        resMarkup = getResponseMarkup(null, requestData);
    } catch(e) {
        console.log(e); // минимальное логирование
        sendServerError(res);
    }
    res.send(resMarkup);
});


webserver.get('/cabinet', (req, res) => {
    if ( isValidInput(req.query.username, req.query.password) ) {

    }
    let validationResult = validateInput();
    let resMarkup;
    let requestData = collectReqData(req);
    try {
        resMarkup = getResponseMarkup(validationResult, requestData);
    } catch(e) {
        console.log(e); // минимальное логирование
        sendServerError(res);
    }
    res.send(resMarkup);
});

webserver.listen(servPort);
