'use strict';
(function(){
    window.addEventListener('DOMContentLoaded', init);


    function init() {

        var POSTMAN_URL = '/run';
        var errorKey = 'error';
        var warnKey = 'warning';
        var scrollToResultElem = document.querySelector('.response h2');

        var postmanForm = document.getElementsByTagName('fieldset')[0];
        var postmanFormHandler = new PostmanFormHandler(postmanForm);
        
        // псевдоним метода получения селектора элемента данных формы по его названию
        var getSelector = postmanFormHandler.getSelectorByName;
        // псевдоним метода записи значения в элемент по его селектору
        var setValue = postmanFormHandler.setValue;
        // настройка формы (асинхронная загрузка MIME-типов, установка обработчиков добавления полей)
        prepareForm(getSelector);

        // конопка отправки данных формы на сервер
        var sendBtn = document.querySelector(getSelector('sendBtn'));
        sendBtn.onclick = send;
        // кнопка сброса введенных в форму данных
        var resetBtn = document.querySelector(getSelector('resetBtn'));
        resetBtn.onclick = function() {
            window.location='/postman';
        };
        async function send() {
            var requestData = postmanFormHandler.collectData();
            var fetchParams = {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(requestData)
            };
            try {
                var errMess = '';
                var warnMess = '';

                var response = await fetch(POSTMAN_URL, fetchParams);
                var resBody = await response.json();

                // формируем текст предупреждений, если они получены
                if (warnKey in resBody) {
                    resBody[warnKey].forEach( t => {
                        warnMess += 'Внимание! >> '+t.message+'\n';
                    });
                }

                // формируем текст ошибок, если они получены
                if (errorKey in resBody) {
                    resBody[errorKey].forEach( t => {
                        errMess += 'Ошибка >> '+t.message+'\n';
                    });
                    var err = new Error();
                    err.message = errMess + warnMess;
                    throw err;
                }
            } catch(e) {
                // показываем ошибки
                alert(e.message);
                return; // требуются коррективы пользовательского ввода
            }
            // отображаем полученный ответ на проксированный запрос
            showResponse(resBody);
            scrollToResultElem.scrollIntoView();
            // и предупреждения, если есть
            if (warnMess)
                alert('Получен ответ! Нажмите кнопку "OK"\n' + warnMess);
            
        }

        function showResponse(resBody) {
            for (var paramName in resBody) {
                var sel = getSelector(paramName);
                if (sel) 
                    setValue(sel, paramName, resBody[paramName]);
            }
        }
    }

}());