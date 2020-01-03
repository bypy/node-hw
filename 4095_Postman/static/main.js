'use strict';
(function(){
    window.addEventListener('DOMContentLoaded', init);


    function init() {

        var POSTMAN_URL = '/run';
        var errorKey = 'error';
        var warnKey = 'warning';

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
        resetBtn.onclick = reset;
        
        async function send() {
            var requestData = postmanFormHandler.collectData();
            var fetchParams = {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(requestData)
            };
            try {
                var errMess = null;
                var warnMess = null;

                var response = await fetch(POSTMAN_URL, fetchParams);
                var resBody = await response.json();

                // формируем текст предупреждений, если таковые есть
                if (warnKey in resBody) {
                    var warnMess = '';
                    resBody[warnKey].forEach( t => {
                        warnMess += 'Внимание! >> '+t.message+'\n';
                    });
                }


                if (errorKey in resBody) {
                    var errMess = '';
                    resBody[errorKey].forEach( t => {
                        errMess += 'Ошибка >> '+t.message+'\n';
                    });
                    var err = new Error();
                    err.message = errMess;
                    throw err;
                }
            } catch(e) {
                // показываем ошибки
                alert(e.message);
            }
            // получен ответ на проксированный запрос
            console.log(resBody);
            // отображаем ответ
            showResponse(resBody);
            
        }

        function showResponse(resBody) {
            for (var paramName in resBody) {
                var sel = getSelector(paramName);
                if (sel) 
                    setValue(sel, resBody[paramName]);
            }
        }
    
        function reset() {
            console.log('Was resetted');
        }
    }

}());