'use strict';
// SoapUI-5.5.0.vmoptions
// -Dfile.encoding=UTF8
let formWrapper = document.querySelector('.vote-wrapper');
let variantsURL = 'http://localhost:8089/variants';

let performRequest = function(url) { 
    return new Promise(function(resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.onload = function() {
            if (xhr.status === 200)
                resolve(xhr.responseText);
            else
                reject(xhr.statusText);
        };
        xhr.onerror = function() {
            reject(url);
        };
        xhr.open('GET', url);
        xhr.send();   
    });
};

let createInputs = questions => {
    let inputs = questions.map(q => 
        `<label class="gaidai"><input type="radio" name="gaidai" value="${q.code}">${q.text}</label>`
    );
    return inputs;
};

let createForm = inputs => {
    let formMarkup = 
        `<form id="vote-form" action="#" onsubmit="sendAndUpdate()">
            ${inputs}
        </form>`;
    return formMarkup;
    
};

let createErrorResponse = e => {
    console.log(`Ошибка ${e}`);
};

let getVariants = performRequest(variantsURL);
getVariants
    .then(res =>
        JSON.parse(res)
    )
    .then( questions => createInputs(questions) )
    .then( inputs => createForm(inputs.join('\n')) )
    .then( formMarkup => {
        formWrapper.innerHTML = formMarkup;
    })
    .catch(function(e) {
        createErrorResponse(e);
    })
;
        