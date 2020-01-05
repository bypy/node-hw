function prepareForm(getSelector, updatePresetData) {
    // через getSelector и имя поля ввода у формы
    // получаем селектор для доступа к DOM узлу

    // флаг поддержки Web Storage API
    var isStorageAvailable = storageAvailable('sessionStorage');
    var STORAGE_MAIN_KEY = 'postman-lite';
    var STORAGE_MIMES_KEY = 'mimes';
    //var STORAGE_PRESETS_KEY = 'presets';
    // файл-источник списка MIME-типов
    var MIMES_SRC = 'mimes.json';
    var PRESETS_SRC = 'presets/';
    var mimesH = null; // после ajax-вызова будет содержать хэш MIME-типов
    var presetsH = null; // после ajax-вызова будет содержать данные сохраненных запросов
    var fetchNetError = false; // флаг блокировки элементов выбора MIME-типа из списка при ошибке
            
    // элемент выбора сохраненых запросов
    var presetSelector = getSelector('preset');
    var savedPresetInput = document.querySelector(presetSelector.savedPreset);
    
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
    // и данные сохраненных запросов
    if (isStorageAvailable) {
        // из локального хранилища
        mimesH = parseLocalData(STORAGE_MAIN_KEY, STORAGE_MIMES_KEY);
        // кэширование данных сохраненных запросов возложено на сервер
        // presetsH = parseLocalData(STORAGE_MAIN_KEY, STORAGE_PRESETS_KEY);
    }
    
    // либо из удаленного ресурса
    if (!mimesH) {
        var mimeResponse = fetch(MIMES_SRC);
        mimeResponse.then(function(res){
            if (res.status !== 200)
                throw new Error('Не удалось загрузить справочник mime-типов');
            return res.json();
        }).then(function(mimes){
            mimesH = mimes; // сохраняем ответ в глобальной переменной
            // добавим данные на страницу
            fillElement(mimeTypeInput, Object.keys(mimesH), updateMimes);
            // сохраним полученные MIME-типы в sessionStorage
            if (isStorageAvailable)
                setLocalData(STORAGE_MAIN_KEY, STORAGE_MIMES_KEY, mimes);
        }).catch(function(err){
            fetchNetError = true;
            switchMimeState();
            console.log(err.message);
        }).finally(function(){
            sendBtn.disabled = false;
        });
    } else {
        // добавим данные на страницу
        fillElement(mimeTypeInput, Object.keys(mimesH), updateMimes);
        sendBtn.disabled = false;
    }


    if (!presetsH) {
        // список сохраненных запросов
        var presetsResponse = fetch(PRESETS_SRC);
        presetsResponse.then(function(res){
            if (res.status !== 200)
                throw new Error('Не удалось загрузить список сохраненных запросов');
            return res.json();
        }).then(function(presets){ 
            presetsH = presets; // сохраняем ответ в глобальной переменной
            // добавим данные на страницу
            fillElement(savedPresetInput, presetsH.names, loadPreset);
            // сохраним полученные шаблоны запросов в sessionStorage
            // кэширование данных сохраненных запросов возложено на сервер
            // if (isStorageAvailable)
                // setLocalData(STORAGE_MAIN_KEY, STORAGE_PRESETS_KEY, presets);
        }).catch(function(err){
            fetchNetError = true;
            switchMimeState();
            console.log(err.message);
        });
    } else {
        // добавим данные на страницу
        fillElement(savedPresetInput, presetsH.names, loadPreset);
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
    

    function storageAvailable(type) {
        // https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
        var storage;
        try {
            storage = window[type];
            var x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        }
        catch(e) {
            return e instanceof DOMException && (
                // everything except Firefox
                e.code === 22 ||
                // Firefox
                e.code === 1014 ||
                // test name field too, because code might not be present
                // everything except Firefox
                e.name === 'QuotaExceededError' ||
                // Firefox
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
                // acknowledge QuotaExceededError only if there's something already stored
                (storage && storage.length !== 0);
        }
    }


    function parseLocalData(storageKey, dataKey) {
        try {
            var storageData = JSON.parse(sessionStorage.getItem(storageKey));
            console.log('Данные о ' + dataKey + ' загружены из хранилища');
            return storageData[dataKey];
        } catch(e) {
            console.log('В хранилище сессии нет информации о ' + dataKey + 
                'загружаю из удаленного ресурса');
            console.log(e.message);
            return null;
        }
    }

    function setLocalData(storageKey, dataKey, data) {
        var rawPostmanData = sessionStorage.getItem(storageKey);
        try {
            if (!rawPostmanData) {
                // хранилище не заполнялось
                sessionStorage.setItem(storageKey, JSON.stringify({
                    [dataKey]:data
                }));
                console.log('Создана структура' + storageKey +
                ' в сессионном хранилище, добавлены данные о ' + dataKey);
            } else {
                var parsedPostmanData = JSON.parse(rawPostmanData);
                // запишем/обновим имеющуюся информацию
                parsedPostmanData[dataKey] = data;
                sessionStorage.setItem(storageKey, JSON.stringify(parsedPostmanData));
                console.log('Обновлены данные о ' + dataKey +
                ' в сессионном хранилище');
            }
        } catch (e) {
            // вернем к предыдущему состоянию
            sessionStorage.setItem(storageKey, rawPostmanData);
            console.log('Ошибка при записи данных о ' + dataKey +
                ' в сессионное хранилище');
        }
    }

    
    function fillElement(containElem, dataArr, cb) {
        try {
            if (!containElem) // если на странице отсутствует целевой элемент для вставки данных 
                throw new Error('Не найден элемент для вставки данных' + JSON.stringify(dataArr).slice(20));
            var options = arr2options(dataArr); // формируем содержимое тега select
            containElem.innerHTML = options;
            containElem.onchange = cb;
        } catch(err) {
            console.log(err.message);
        }
    }


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

    function loadPreset(EO) {
        EO = EO || window.event;
        var selectedPreset = EO.target.value;
        // в ключе 'names' расположен массив, на основании которого формировался
        // выпадающий список
        // индекс названия запроса в массиве совпадёт с ключом, под которым
        // хранятся данные запроса
        var keyNum = presetsH.names.indexOf(selectedPreset);
        var presetParams = presetsH[keyNum] || {};
        updatePresetData(presetParams);
    }


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