const express = require('express');
const webserver = express();
const port = 7980;

webserver.get('/', (req, res) => {
    res.send( `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Ошибка!</title>
    <style>
        html { font-size: 200%; }
        form { max-width: 20em; margin-left: auto; margin-right: auto; }
        form * { font-size: inherit; }
    </style>
</head>
<body>
    <form action="${req.protocol.concat('://', req.headers.host, '/validate')}" method="${req.method.toLocaleLowerCase()}" novalidate>
        <fieldset>
            <legend class="legend" style="color:red;">Требуется авторизация</legend>
            <p><input type="text" name="username" placeholder="Login" autocomplete="off" onfocus='this.placeholder=""'
                        onblur='this.value?this.placeholder="":this.placeholder="Login"' required autofocus></p>

            <p><input type="password" name="password" placeholder="Password" autocomplete="off"
                    onfocus='this.placeholder=""'
                        onblur='this.placeholder?this.placeholder="":this.placeholder="Password"' required></p>

            <p>
                <input type="submit" value="Enter">
            </p>
        </fieldset>
    </form>
</body>
</html>
    `);
});

webserver.get('/validate', (req, res) => {
     
    
    const validateCredentials = (loginName, loginPass) => {
        const pKey = 'pass';
        let errorS = null;
        const credentialsHash = {
            'superboss': {
                pass: '1q2w3e4r',
                realName: 'Веня',
                email: '123@tut.by'
            }
        };
        if (!loginName || !loginPass)
            errorS = 'Заполните все поля';
        else if (!(loginName in credentialsHash))
            errorS = 'Пользователь не зарегистрирован';
        else if (credentialsHash[loginName][pKey] !== loginPass)
            errorS = 'Введен неверный пароль';
        return ({
            error:errorS,
            realName:(errorS?null:credentialsHash[loginName]['realName']),
            email:(errorS?null:credentialsHash[loginName]['email'])
        });
    };
    

    const createErrorResponseBody = (errorText, request) =>
        `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>Ошибка!</title>
            <style>
                html { font-size: 200%; }
                form { max-width: 20em; margin-left: auto; margin-right: auto; }
                form * { font-size: inherit; }
            </style>
        </head>
        <body>
            <form action="${request.protocol.concat('://', request.headers.host, request.route.path)}" method="${request.method.toLocaleLowerCase()}" novalidate>
                <fieldset>
                    <legend class="legend" style="color:red;">${errorText}</legend>
                    <p><input type="text" name="username" placeholder="Login" autocomplete="off" value="${request.query.username||''}"
                            onfocus='this.placeholder=""'
                                onblur='this.value?this.placeholder="":this.placeholder="Login"' required autofocus></p>
    
                    <p><input type="password" name="password" placeholder="Password" autocomplete="off"
                            onfocus='this.placeholder=""'
                                onblur='this.placeholder?this.placeholder="":this.placeholder="Password"' required></p>
    
                    <p>
                        <input type="submit" value="Enter">
                    </p>
                </fieldset>
            </form>
        </body>
        </html>
        `
    ;

    const createSuccessResponseBody = personName => 
        `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>Добро Пожаловать</title>
            <style>
                html { font-size: 200%; }
            </style>
        </head>
        <body>
        <h1>Здравствуйте, дорогой друг!</h1>
        <p>Вы в своем личном кабинете, ${personName}, но здесь пока пусто :)</p>
        </body>
        </html>
        `
    ;

    const fatalErrMarkup =
    `
    <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>Ошибка</title>
        </head>
        <body>
        <h1>У нас авария, но мы её уже ликвидируем!</h1>
        </body>
        <html>
    `
    ;

    try {
        let validationData = validateCredentials(req.query.username, req.query.password);
        validationData.error
            ? res.send(createErrorResponseBody(validationData.error, req))
            : res.send(createSuccessResponseBody(validationData.realName));

    } catch(e){
        console.log(e);
        res.statusCode = 301;
        res.send(fatalErrMarkup);
    }
});

webserver.listen(port);
