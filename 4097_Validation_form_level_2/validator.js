let setResult = (status, errText) => ({
    status: status,
    text:(errText?errText:'')
});

// описание проверок
const isFilled = value => {
    if (value&&value!=="")
        return setResult(true);
    else
        return setResult(false, 'Поле необходимо заполнить');
}

const isNumber = value => {
    if (value.trim().length>0 && !isNaN(value))
        return setResult(true);
    else
        return setResult(false, 'Необходимо ввести число');
};

let actionsList = {
    'filled': isFilled,
    'number': isNumber,
};
let modelsList = {};

let normalizeValue = val =>
    val.trim().toLowerCase().replace(/[ё]/g, 'е');

const checkWithModel = (modelName, fieldName, fieldValue, normalize) => {
    let model = modelsList[modelName];
    let checkValue = normalize?normalizeValue(fieldValue):fieldValue;
    if (fieldName in model)
        if (model[fieldName] === checkValue)
            return setResult(true);
        else
            return setResult(false, 'Ответ неверный');
    else {
        console.log(`Проверяемого поля ${fieldName} нет в модели ${modelName}`);
        return setResult(true);
    }
};

const addModel = (name, data) => { modelsList[name] = data; };
const getActionByName = n => actionsList[n];


exports.setDataModel = (modelName, modelHash) => {
    addModel(modelName, modelHash);
};

exports.validate = (name, value) => {
    let action = getActionByName(name);
    if (action) return action(value);
};

exports.compare = (modelName, name, value, doNorm) => {
    return checkWithModel(modelName, name, value, doNorm);
}