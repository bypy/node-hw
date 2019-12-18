'use strict';
(function(){
    window.addEventListener('DOMContentLoaded', init);


    function init() {

        // задаю селекторы для доступа к полям форм
        var sel = {
            req: {
                protocol:                   '#url select[name="protocol"]',
                url:                        '#url input[name="url"]',
                method:                     '#method input[name="method"]',
                paramsRow:                  '#params .params-row',
                paramName:                  '.param-name',  // в составе .params-row
                paramValue:                 '.param-value', // в составе .params-row
                addBtn:                     '.add',
                mimeTypeInput:              '#content .type' ,
                mimeSubTypeInput:           '#content .mime-type',
                customContentTypeChBox:     '#content #custom-check',
                customContentTypeInput:     '#content #custom-input',
                body:                       '#req-body textarea',
                headersRow:                 '#req-headers .headers-row',
                headerName:                 '.header-name',  // в составе .headers-row
                headerValue:                '.header-value', // в составе .headers-row
                sendBtn:                    '#submit',
                resetBtn:                   '#reset'
            },
            res: {
                statusCode:'#status input[name="status"]',
                contentType:'#res-content input[name="res-content"]',
                headers:'#res-headers textarea',
                body:'#res-body textarea'
            }
        };

        /* СПИСОК MIME-типов для удобства подгружаю из файла */
        var MIMES_SRC = 'mimes.json';
        var mimesH; // после ajax-вызова будет содержать хэш MIME-типов
        var fetchNetError = false; // флаг блокировки элементов выбора MIME-типа из списка при ошибке
            
        // находим элементы страницы, обслуживающие процесс ввода MIME-типа запроса 
        var mimeTypeInput = document.querySelector(sel.req.mimeTypeInput);
        var mimeSubTypeInput = document.querySelector(sel.req.mimeSubTypeInput);
        var customContentTypeChBox = document.querySelector(sel.req.customContentTypeChBox);
        var customContentTypeInput = document.querySelector(sel.req.customContentTypeInput);
        customContentTypeChBox.checked = false;
        customContentTypeChBox.onchange = switchMimeState;
        customContentTypeInput.disabled = true;
        // конопка отправки данных формы на сервер
        var sendBtn = document.querySelector(sel.req.sendBtn);
        // отключим кнопку до завершения ajax-вызова
        sendBtn.disabled = true;
        // кнопка сброса введенных в форму данных
        var resetBtn = document.querySelector(sel.req.resetBtn);

        // получаю список MIME-типов для подстановки в выпадающие меню
        var response = fetch(MIMES_SRC);
        response.then(function(res){
            if (res.status !== 200) throw new Error('Не удалось загрузить справочник mime-типов')
            return res.json();
        }).then(function(mimes){ 
            mimesH = mimes; // сохраняем ответ в глобальной переменной
            var options = arr2options( Object.keys(mimes) ); // содержимое тега select
            mimeTypeInput.innerHTML = options;
            mimeTypeInput.onchange = updateMimes;
        }).catch(function(err){
            fetchNetError = true;
            switchMimeState();
            console.log(err.message);
        }).finally(function(){
            sendBtn.disabled = false;
            resetBtn.disabled = false;
            // предотвращаю отправку до конца ajax-запроса на получение MIME-типов
            sendBtn.onclick = send;
            resetBtn.onclick = reset;
        });

        function updateMimes(EO) {
            EO = EO || window.event;
            var selectedType = EO.target.value;
            if (mimesH.hasOwnProperty(selectedType)) {
                var options = arr2options(mimesH[selectedType]);
                mimeSubTypeInput.innerHTML = options;
            }
        }

        function arr2options(arr) {
            var inputVariants = arr.map(m => `<option value="${m}">${m}</option>`);
            inputVariants.unshift('<option value="">--Choose</option>');
            return inputVariants.join('\n');
        }

        // находим оставшиеся элементы формы, из которых будем получать данные
        var paramsRow = document.querySelector(sel.req.paramsRow);
        var emptyParamsRow = paramsRow.cloneNode(true);
        var headersRow = document.querySelector(sel.req.headersRow);
        var emptyHeadersRow = headersRow.cloneNode(true);
            
        var paramName = document.querySelector(sel.req.paramName);

        var addBtn = document.querySelectorAll(sel.req.addBtn);
        for (var i=0; i<addBtn.length; i++) {
            addBtn[i].onclick = addRow;
        }

        function addRow(EO) {
            EO = window.event;
            var newInputRow;
            var target = EO.target;
            var wrapper = target.parentNode;
            var parent = wrapper.parentNode;
            // параметр или заголовок
            if (target.id === 'for-params')
                newInputRow = emptyParamsRow.cloneNode(true);
            else if (target.id === 'for-headers')
                newInputRow = emptyHeadersRow.cloneNode(true); 
            parent.insertBefore(newInputRow, wrapper);
            newInputRow.children[0].focus();
        }

        function switchMimeState() {
            if (fetchNetError) {
                customContentTypeChBox.checked = true;
                customContentTypeInput.disabled = false;
                customContentTypeInput.focus();
                disableMimeInput(fetchNetError);
            } else {
                var isDisabledNow = customContentTypeInput.disabled;
                customContentTypeInput.disabled = !isDisabledNow;
                customContentTypeInput.focus();
                if (!fetchNetError) disableMimeInput(isDisabledNow);
            }
        }

        function disableMimeInput(flag) {
            mimeTypeInput.disabled = flag;
            mimeSubTypeInput.disabled = flag;
        }


    }

    function collectFieldsData(reqH) {
        // reqH.protocol = 
        // reqH.url = 
        // reqH.method = 
        // reqH.params = 
        // reqH.contentType = 
        // reqH.body = 
        // reqH.headers = 

        //return reqH;
    }

    function send() {
        var requestData = collectFieldsData(dataFields.req);
        console.log('Was sent');
    }

    function reset() {
        console.log('Was resetted');
    }

}());