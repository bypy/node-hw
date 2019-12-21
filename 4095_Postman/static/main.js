'use strict';
(function(){
    window.addEventListener('DOMContentLoaded', init);


    function init() {

        var postmanForm = document.getElementsByTagName('fieldset')[0];
        var postmanFormHandler = new PostmanFormHandler(postmanForm);
        
        // псевдоним метода получения селектора элемента данных формы по его названию
        var getSelector = postmanFormHandler.getSelectorByName;
        // настройка формы (загрузка MIME-типов, установка обработчиков добавления полей)
        prepareForm(getSelector);

        // конопка отправки данных формы на сервер
        var sendBtn = document.querySelector(getSelector('sendBtn'));
        sendBtn.onclick = send;
        // кнопка сброса введенных в форму данных
        var resetBtn = document.querySelector(getSelector('resetBtn'));
        resetBtn.onclick = reset;
        
        var requestData = 

        console.log(requestData);

        async function send() {
            var requestData = postmanFormHandler.collectData();
            var url = ''.concat(requestData.protocol, '://', requestData.url);
            // TODO check method
            // Block body for POST with params
            var searchParams = new URLSearchParams(requestData.params);
            var fetchParams = {
                method: requestData.method,
                headers: requestData.headers,
                body: searchParams
            };
            
            var response = await fetch(url, fetchParams);
            var resBody = await response.json();
            console.log('Was sent');
            console.log(resBody);
        }
    
        function reset() {
            console.log('Was resetted');
        }
        
        

        /* СПИСОК MIME-типов для удобства подгружаю из файла */
    


    //     function collectRequestData(refs) {
    //         let reqH = {};

    //         for (let k in refs) {
    //             reqH[k] = null;
    //         }
    //         reqH.protocol = document.querySelector(refs.protocol).value;
    //         reqH.url = document.querySelector(refs.url).value;
    //         let methods = document.querySelectorAll(refs.method);
    //         for (let i=0; i<methods.length; i++) {
    //             if (methods[i].checked) reqH.method = methods[i];
    //         }
    //         let params = [];
    //         let paramsRow = document.querySelectorAll(refs.paramsRow);
    //         for (let i=0; i<paramsRow.length; i++) {
    //             params.push(paramsRow[i]);
    //         }
    //         reqH.params = params.map( r => {
    //             let paramName = r.children[0].value;
    //             let paramValue = r.children[1].value;
    //             return ({ [paramName]: paramValue });
    //         });
    //         console.log(reqH.params);
    //         // reqH.contentType = 
    //         // reqH.body = 
    //         // reqH.headers = 
    
    //         return reqH;
    //     }
    }

    


}());