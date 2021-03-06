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
        // метод для отображения подгруженных конфигураций запросов
        var updatePresetData = postmanFormHandler.updatePresetData;
        // настройка формы (асинхронная загрузка MIME-типов, установка обработчиков добавления полей)
        prepareForm(getSelector, updatePresetData);

        // конопка отправки данных формы на сервер
        var sendBtn = document.querySelector(getSelector('sendBtn'));
        sendBtn.onclick = send;
        // кнопка сброса введенных в форму данных
        var resetBtn = document.querySelector(getSelector('resetBtn'));
        resetBtn.onclick = function() {
            window.location='/postman';
        };
        async function send() {
            // сбор данных с полей формы
            var requestData = postmanFormHandler.collectData();
            // параметры запроса к Postman
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
                // перебор ключей ответа
                var sel = getSelector(paramName);
                // если ключ ответа найден в ключах элемента формы
                if (sel)
                    // вызвать метод записи данных в этот элемент формы 
                    setValue(sel, paramName, resBody[paramName]);
            }
        }
    }

}());