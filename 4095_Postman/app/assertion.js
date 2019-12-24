const assert = require('assert');

function validateInput(inp) {

	// список параметров, поступающих в запросе
	// method, params, contentType, headers, body
	// при наличии, массив ошибок должен содержать хэши с ключами из этого перечня
	
	// inp = {
	// 	method: 'POST',
	// 	params: [{'foo':'bar'}, {'baz':'kamaz'}],
	// 	contentType: 'text/html',
	// 	headers: [
	// 		{ Host: 'atlasminsk.sbertech.by'},
	// 		{ 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:71.0) Gecko/20100101 Firefox/71.0'},
	// 		{ Accept: 'text/css,*/*;q=0.1'},
	// 		{ 'Accept-Language': 'ru-RU,ru;q=0.8,en-US;q=0.5,en;q=0.3'},
	// 		{ 'Accept-Encoding': 'gzip, deflate, br'},
	// 		{ Connection: 'keep-alive'},
	// 		{'':''},
	// 		{'':'kfkf'},
	// 		{'kfkf':''}
	// 	],
	// 	body: '<!DOCTYPE html>\\n<html lang="en">\\n\\n<head>\\n    <meta charset=\\"UTF-8\\">\\n    <link rel=\\"stylesheet\\" href=\\"css/bootstrap.min.css\\">\\n    <title>\\u0410\\u0440\\u0445\\u0438\\u0432 \\u043f\\u0440\\u043e\\u0435\\u043a\\u0442\\u043e\\u0432</title>\\n    <style>\\n        .illustration img {\\n            margin: 0 auto;\\n            max-height: 350px;\\n        }\\n        .data {\\n            margin-top: 2em;\\n            font-size: 200%;\\n        }\\n        .projects {\\n            text-align: center;\\n        }\\n        @media all and (orientation: landscape) {\\n            .illustration {\\n                width: 30%;\\n                margin-left: 4%;\\n            }\\n            .list {\\n                width: 70%;\\n                max-width: 600px;\\n                font-size: 50%;\\n            }\\n        }\\n    </style>\\n</head>\\n\\n<body>\\n    <div id=\\"page\\" class=\\"container-fluid\\">\\n        <div class=\\"data row\\">\\n            <div id=\\"illustration\\" class=\\"illustration col-xs-12\\">\\n                <img src=\\"img/archive_1.jpg\\" class=\\"img-responsive\\" alt=\\"illustration\\">\\n            </div>\\n            <div class=\\"list col-xs-12\\">\\n                <div id=\\"projects\\" class=\\"projects list-group\\">\\n                    <a href=\\"lureshmedia/index.html\\" class=\\"list-group-item\\">\\n                        <h2 class=\\"list-group-item-heading\\">\\u0420\\u0410 &laquo;\\u041b\\u0443\\u0447\\u0448\\u0438\\u0435 \\u0440\\u0435\\u0448\\u0435\\u043d\\u0438\\u044f&raquo;</h4>\\n                            <p class=\\"list-group-item-text\\">2010-2019</p>\\n                    </a>\\n                    <a href=\\"randomizer-loto/index.html\\" class=\\"list-group-item\\">\\n                        <h2 class=\\"list-group-item-heading\\">\\u0420\\u0430\\u043d\\u0434\\u043e\\u043c\\u0430\\u0439\\u0437\\u0435\\u0440 &laquo;\\u0421\\u0443\\u043f\\u0435\\u0440\\u043b\\u043e\\u0442\\u043e&raquo;</h4>\\n                            <p class=\\"list-group-item-text\\">2019</p>\\n                    </a>\\n                    <a href=\\"zoo/index.html\\" class=\\"list-group-item\\">\\n                        <h2 class=\\"list-group-item-heading\\">\\u041a\\u043e\\u043d\\u043a\\u0443\\u0440\\u0441 &laquo;\\u041c\\u043e\\u0439 \\u0414\\u0440\\u0443\\u0433&raquo;</h4>\\n                            <p class=\\"list-group-item-text\\">2019</p>\\n                    </a>\\n                </div>\\n            </div>\\n        </div>\\n    </div>\\n</body>\\n\\n</html>' 
	// };

	// акуммулятор ошибок
	let asserErrors = [];

	const bodyAccordingToType = function(reqBody, reqContentType) {
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
	}

	// все возможные проверки
	const assertions = { // cond: проверяемое условие; mess: сообщение об ошибке; param: ключ параметра в хэше ошибок
		method: { 
			cond: inp.method,
			mess: 'Вы не указали метод запроса',
			param: 'method'
		},
		params_1: { // введены параметры при непустом теле POST запроса
			cond: !(inp.params.length!==0&&inp.body.length!==0),
			mess: 'Для метода запроса POST укажите ИЛИ ПРАМЕТРЫ ИЛИ ТЕЛО запроса',
			param: 'params'
		},
		params_2: { // параметр с пустым названием
			cond: Object.keys(inp.params).every( key => key !== ''),
			mess: 'Вы ввели значение, но не ввели название по крайней мере одного параметра',
			param: 'params'	
		},
		contentType: { // не заполнен Content-Type POST-запроса
			cond: inp.body.length!==0&&inp.contentType,
			mess: 'Content-Type POST-запроса обязателен для заполнения',
			param: 'contentType'
		},
		contentType_body: { // содержимое тела запроса не соответствует указанному Content-Type
			cond: bodyAccordingToType(inp.body, inp.contentType),
			mess: 'Content-Type обязателен для заполнения',
			param: 'warning' // не препятствовать запросу, но уведомить на фронте
		},
		body_post: { // введены параметры POST запроса и заполнено тело запроса 
			cond: !(inp.params.length!==0&&inp.body.length!==0),
			mess: 'Для метода запроса POST укажите ИЛИ ПРАМЕТРЫ ИЛИ ТЕЛО запроса',
			param: 'body'
		},
		body_get: { // поптыка заполнить тело GET-запроса 
			cond: inp.body.length==0,
			mess: 'Для метода запроса GET не надо заполнять тело запроса',
			param: 'body'
		},
		headers: { // заголовок с пустым названием
			cond: Object.keys(inp.headers).every( key => key !== ''),
			mess: 'Вы ввели значение, но не ввели название по крайней мере одного заголовка',
			param: 'headers'
		}
	};

	// список проверок для POST-запросов
	const postAssertions = [
		assertions.params_1,
		assertions.params_2,
		assertions.contentType,
		assertions.headers,
		assertions.body_post,
		assertions.contentType_body
	];

	// список проверок для GET-запросов
	const getAssertions = [
		assertions.body_get,
		assertions.headers,
		assertions.params_2
	];

	// "переборщик проверок"
	const applyAssertions = function(assertA) {
		let errors = [];
		let currentParam;
		assertA.forEach( i => {
			currentParam = i.param;
			try {
				assert(i.cond, i.mess);
				console.log(`Параметр ${currentParam} валидный`);
			} catch(e) {
				if (e.code === 'ERR_ASSERTION')
					errors.push({[currentParam]: e.message});
				console.log(e.message);
			}
		});
		return errors;
	};

	// Выясняем тип запроса
	try {
		let i = assertions.method;
		let currentParam = i.param;
		assert(i.cond, i.mess);
	} catch(e) {
		console.log(e.message);
		asserErrors.push({[currentParam]: e.message});
	}
	
	
	if (inp.method.toLowerCase()==='post')
		asserErrors = applyAssertions(postAssertions)
	else if (inp.method.toLowerCase()==='get')
		asserErrors = applyAssertions(getAssertions);

	return asserErrors;

}


module.exports = validateInput;