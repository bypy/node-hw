function PostmanFormHandler(formEl) {
    const SEL_KEY = 'sel';
    const F_KEY = 'func';
    
    let fieldSelectors = {
        protocol: { [SEL_KEY]: '#url select[name="protocol"]' },
        url: { [SEL_KEY]: '#url input[name="url"]' },
        method: { [SEL_KEY]: '#method input[name="method"]' },
        params: {
            [SEL_KEY]: {
                row:'#params .params-row',
                name:'.param-name',
                value:'.param-value'
            }
        },
        addBtn: { [SEL_KEY]: '.add' },
        contentType: {
            [SEL_KEY]: {
                type: '#content .type', // MIME тип
                subType: '#content .mime-type', // MIME подтип
                isCustom: '#content #custom-check', // использовать ручной ввод
                custom: '#content #custom-input', // вручную введенный MIME
            }
        },
        body: { [SEL_KEY]: '#req-body textarea' },
        headers: {
            [SEL_KEY]: {
                row:'#req-headers .headers-row',
                name:'.header-name',
                value:'.header-value'
            }
        },
        sendBtn: { [SEL_KEY]: '#submit' },
        resetBtn: { [SEL_KEY]: '#reset' },
        resStatus: { [SEL_KEY]: '#status input' },
        resContentType: { [SEL_KEY]: '#res-content input' },
        resHeaders: { [SEL_KEY]: '#res-headers textarea' },
        resBody: { [SEL_KEY]: '#res-body textarea' }
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

    // поддерживает считывание и запись
    const valueHandler = function(selector, newValue) {
        let target = formEl.querySelector(selector);
        if (!newValue)
            // режим чтения из поля
            return target.value;
        else {
            // режим записи в поле
            target.value = newValue;
        }
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
        if (selector.isCustom.checked)
            ct = formEl.querySelector(selector.custom).value;
        else {
            let type = formEl.querySelector(selector.type);
            let subType = formEl.querySelector(selector.subType);
            if ( type&&subType )
                ct = ct.concat(type.value,'/',subType.value);
        }
        return ct;
    };

    // правила-функции для извлечения данных ЗАПРОСА из формы методом 'collectData'
    // нет правила - значение из поля извлекаться не будет
    fieldSelectors.protocol[F_KEY] = getProtocol;
    fieldSelectors.url[F_KEY] =       getURL;
    fieldSelectors.method[F_KEY] =    getChecked;
    fieldSelectors.params[F_KEY] =    getRowData;
    fieldSelectors.contentType[F_KEY] =  getContentType;
    fieldSelectors.body[F_KEY] =      valueHandler;
    fieldSelectors.headers[F_KEY] =      getRowData;
    // правила для записи данных ответа
    fieldSelectors.resStatus[F_KEY] = valueHandler;
    fieldSelectors.resContentType[F_KEY] = valueHandler;
    fieldSelectors.resHeaders[F_KEY] = writeHashPairs;
    fieldSelectors.resBody[F_KEY] = valueHandler;
    

    /* МЕТОДЫ */

    this.getSelectorByName = function(fieldName) {
        if (fieldSelectors.hasOwnProperty(fieldName)) 
            return  fieldSelectors[fieldName][SEL_KEY];
    };

    this.collectData = function() {
        let dataH = {};
        // извлекаем данные из всех элементов формы
        // для которых указан селектор
        // и функция для извлечения
        for (let k in fieldSelectors) {
            let param = fieldSelectors[k];
            if (param.hasOwnProperty(F_KEY)) {
                let getValueFunc = param[F_KEY];
                let selector = param[SEL_KEY];
                dataH[k] = getValueFunc(selector);
            }
        }
        return dataH;
    };

    this.setValue = function(selector, fieldName, value) {
        let func = fieldSelectors[fieldName][F_KEY];
        func(selector, value);
    };
}