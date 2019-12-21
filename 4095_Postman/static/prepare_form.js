function prepareForm(getSelector) {
    // через getSelector и имя поля ввода у формы
    // получаем селектор для доступа к DOM узлу

    // файл-источник списка MIME-типов
    var MIMES_SRC = 'mimes.json';
    var mimesH; // после ajax-вызова будет содержать хэш MIME-типов
    var fetchNetError = false; // флаг блокировки элементов выбора MIME-типа из списка при ошибке
            
    // находим элементы страницы, обслуживающие процесс ввода MIME-типа запроса
    var contentTypeSelectors = getSelector('contentType');
    var mimeTypeInput = document.querySelector(contentTypeSelectors.type);
    var mimeSubTypeInput = document.querySelector(contentTypeSelectors.subType);
    var customContentTypeChBox = document.querySelector(contentTypeSelectors.isCustom);
    var customContentTypeInput = document.querySelector(contentTypeSelectors.custom);;
    customContentTypeChBox.checked = false;
    customContentTypeChBox.onchange = switchMimeState;
    customContentTypeInput.disabled = true;

    // предотвращаю отправку до конца ajax-запроса на получение MIME-типов
    var sendBtn = document.querySelector(getSelector('sendBtn'));
    sendBtn.disabled = true;

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
        
    // поиск и клонирование в память пустых полей
    // для параметров/заголовков запроса
    var paramsSelectors = getSelector('params');
    var paramsRow = document.querySelector(paramsSelectors.row);
    var emptyParamsRow = paramsRow.cloneNode(true);

    var headerSelectors = getSelector('headers');
    var headersRow = document.querySelector(headerSelectors.row);
    var emptyHeadersRow = headersRow.cloneNode(true);
    
    // установка слушателей кликов по кнопке добавления параметра/заголовка
    var addBtn = document.querySelectorAll(getSelector('addBtn'));
    for (var i=0; i<addBtn.length; i++) {
        addBtn[i].onclick = addRow;
    }


    /* функции */

    function addRow(EO) {
        EO = EO || window.event;
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