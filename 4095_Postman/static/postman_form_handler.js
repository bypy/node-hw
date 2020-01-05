function PostmanFormHandler(formEl) {
    'use strict';
    let fieldSelectors = {
        preset: {
            selector: {
                savedPreset:'#preset select[name="savedPreset"]',
                newPreset:'#preset input[name="newPreset"]'
            }
        },
        protocol: { selector: '#url select[name="protocol"]' },
        url: { selector: '#url input[name="url"]' },
        method: { selector: '#method input[name="method"]' },
        params: {
            selector: {
                row:'#params .params-row',
                name:'.param-name',
                value:'.param-value'
            }
        },
        addBtn: { selector: '.add' },
        contentType: {
            selector: {
                type: '#content .type', // MIME тип
                subType: '#content .mime-type', // MIME подтип
                isCustom: '#content #custom-check', // использовать ручной ввод
                custom: '#content #custom-input', // вручную введенный MIME
            }
        },
        body: { selector: '#req-body textarea' },
        headers: {
            selector: {
                row:'#headers .headers-row',
                name:'.header-name',
                value:'.header-value'
            }
        },
        sendBtn: { selector: '#submit' },
        resetBtn: { selector: '#reset' },
        resStatus: { selector: '#status input' },
        resContentType: { selector: '#res-content input' },
        resHeaders: { selector: '#res-headers textarea' },
        resBody: { selector: '#res-body textarea' }
    };

    // Приватные методы по работе с содержимым элементов формы Postman

    const getNewPreset = function(selector) {
        let newPreset = formEl.querySelector(selector.newPreset).value;
        return encodeURIComponent(newPreset);
    };

    const getProtocol = function(selector) {
        var protocol = 'http';
        if (formEl.querySelector(selector).value == 1)
            protocol = 'https';
        return protocol;
    };

    const getURL = function(selector) {
        let target = formEl.querySelector(selector);
        return target.value.replace(/https?:\/\//, '');
    };

    // для записи
    const writeHashPairs = function(selector, newValue) {
        let target = formEl.querySelector(selector);
        let strNewValue = '';
        for (var k in newValue) {
            strNewValue += k.concat(':',newValue[k],'\n');
        }
        target.value = strNewValue;
    };
    
    const getChecked = function(selector) {
        let radios = formEl.querySelectorAll(selector);
        for (let i=0; i<radios.length; i++) {
            if (radios[i].checked)
                return radios[i].value;
        }
    };

    const getRowData = function(selector) {
        let kvPairsH = {};
        let dataElems = formEl.querySelectorAll(selector.row);
        for (let i=0; i<dataElems.length; i++) {
            let kvPair = dataElems[i];
            let k = kvPair.querySelector(selector.name).value;
            let v = kvPair.querySelector(selector.value).value;
            // не собирать данные из пустой пары ключ/значение
            if (k||v)
                kvPairsH[k] = v;
        }
        return kvPairsH;
    };

    const getContentType = function(selector) {
        let ct = '';
        let isCustomCt = formEl.querySelector(selector.isCustom).checked;
        if (isCustomCt)
            ct = formEl.querySelector(selector.custom).value;
        else {
            let type = formEl.querySelector(selector.type).value;
            let subType = formEl.querySelector(selector.subType).value;
            if ( type&&subType )
                ct = ct.concat(type,'/',subType);
        }
        return ct;
    };

    // поддерживает считывание и запись
    const valueHandler = function(selector, newValue) {
        let target = formEl.querySelector(selector);
        if (typeof newValue === 'undefined' || newValue === null)
            // режим чтения из поля
            return target.value;
        else {
            // режим записи в поле
            target.value = newValue;
        }
    };

    // для отображения сохраненных конфигураций

    const updatePreset = function (sel, newValue) {
        // просто очистить поле для имени новой конфигурации
        newValue = '';
        formEl.querySelector(sel.newPreset).value = newValue;
    };

    const updateProtocol = function(sel, newValue) {
        let elem = formEl.querySelector(sel);
        if (newValue === 'http')
            elem.value = '0';
        else if (newValue === 'https')
            elem.value = '1';
    };

    const updateMethod = function (sel, newValue) {
        let radios = formEl.querySelectorAll(sel);
        for (let i=0; i<radios.length; i++) {
            if (radios[i].value === newValue)
                radios[i].checked = true;
        }
    };

    const updateRow = function (sel, valueH) {
        // обнулить содержимое в первом ряду параметров с парой ключ-значение
        let dataElems = formEl.querySelector(sel.row);
        dataElems.querySelector(sel.name).value = '';
        dataElems.querySelector(sel.value).value = '';

        let emptyRow = dataElems.cloneNode(true);
        let parentElem = dataElems.parentNode;
        let virtParentElem = parentElem.cloneNode(false);
        // плата за переиспользование
        let btnSelector = '#' + dataElems.className.split('-')[0] +
            ' ' + fieldSelectors.addBtn.selector;
        let btnRow = formEl.querySelector(btnSelector).parentNode;

        // добавляем ряды в цикле для каждой пары в хэше 'value'
        for (let k in valueH) {
            let newInputRow = emptyRow.cloneNode(true);
            newInputRow.querySelector(sel.name).value = k;
            newInputRow.querySelector(sel.value).value = valueH[k];
            virtParentElem.appendChild(newInputRow);
        }

        // разом добавляю все новые ряды пар ключ-значение
        if (virtParentElem.children.length === 0) {
            virtParentElem.appendChild(dataElems);
        }
        // и блок с кнопкой, который был утрачен при клонировании 
        virtParentElem.appendChild(btnRow);
        parentElem.parentNode.replaceChild(virtParentElem, parentElem);
    };

    const updateContentType = function (sel, newValue) {
        formEl.querySelector(sel.type).value = '';
        formEl.querySelector(sel.subType).value = '';
        const customCheckBox = formEl.querySelector(sel.isCustom);
        if (!customCheckBox.checked)
            customCheckBox.click(); // есть обработчик
        valueHandler(sel.custom, newValue);
    };

    // правила-функции для извлечения данных запроса из формы методом 'collectData'
    // нет правила - значение из поля извлекаться не будет
    fieldSelectors.preset.getFunc =         getNewPreset;
    fieldSelectors.protocol.getFunc =       getProtocol;
    fieldSelectors.url.getFunc =            getURL;
    fieldSelectors.method.getFunc =         getChecked;
    fieldSelectors.params.getFunc =         getRowData;
    fieldSelectors.contentType.getFunc =    getContentType;
    fieldSelectors.body.getFunc =           valueHandler;
    fieldSelectors.headers.getFunc =        getRowData;
    // правила для записи в поля формы сохраненных данных конфигурации запроса
    fieldSelectors.preset.setFunc =         updatePreset;
    fieldSelectors.protocol.setFunc =       updateProtocol;
    fieldSelectors.url.setFunc =            valueHandler;
    fieldSelectors.method.setFunc =         updateMethod;
    fieldSelectors.params.setFunc =         updateRow;
    fieldSelectors.contentType.setFunc =    updateContentType;
    fieldSelectors.headers.setFunc =        updateRow;
    fieldSelectors.body.setFunc =           valueHandler;
    // правила для записи данных ответа Postman
    fieldSelectors.resStatus.setFunc =      valueHandler;
    fieldSelectors.resContentType.setFunc = valueHandler;
    fieldSelectors.resHeaders.setFunc =     writeHashPairs;
    fieldSelectors.resBody.setFunc =        valueHandler;
    

    /* открытые методы для работы с элементами формы Postman */

    this.getSelectorByName = function(fieldName) {
        // по названию элемента формы получаем селектор для доступа к нему в документе
        if (fieldSelectors.hasOwnProperty(fieldName)) 
            return  fieldSelectors[fieldName]['selector'];
    };

    this.collectData = function() {
        let dataH = {};
        // извлекаем данные из всех элементов формы
        // для которых указан селектор
        // и функция для извлечения
        for (let k in fieldSelectors) {
            let param = fieldSelectors[k];
            if (param.hasOwnProperty('getFunc')) {
                let getFunc = param.getFunc;
                let selector = param['selector'];
                dataH[k] = getFunc(selector);
            }
        }
        return dataH;
    };

    this.setValue = function(selector, fieldName, value) {
        // получает по названию элемента формы
        // функцию для записи данных в этот элемент
        // передает функции для записи селектор элемента и новое значение
        let setFunc = fieldSelectors[fieldName]['setFunc'];
        if (!setFunc) {
            console.log('Для поля ' + fieldName + ' не определена функция записи. Пропущено.');
            return;
        } else {
            // запись значения в элемент по его селектору
            setFunc(selector, value);
        }
    };

    var setValueRef = this.setValue;

    this.updatePresetData = function(data) {
        for (let paramName in data) {
            let paramData = fieldSelectors[paramName];
            if (paramData) {
                let selector = paramData['selector'];
                setValueRef(selector, paramName, data[paramName]);
            }
        }
        document.querySelector(fieldSelectors.preset.selector.savedPreset).focus();
    };
}