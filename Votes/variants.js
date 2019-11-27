'use strict';
window.addEventListener('DOMContentLoaded', buildVoteForm);

const buildVoteForm = () => {
    let formWrapper = document.querySelector('.vote-form__variants');
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
            xhr.onerror = function(e) {
                reject(e);
            };
            xhr.open('GET', url);
            xhr.send();   
        });
    };
    
    let createInputs = questions =>
        questions.map(q => 
            `<label class="vote-form__variants"><input type="radio" name="gaidai" value="${q.code}">${q.text}</label>`
        ).join('\n');
    
    let createForm = inputs => 
        `<form id="vote-form" action="#" onsubmit="sendAndUpdate()" class="vote-form__body">
            ${inputs}
            <input type="submit" class="vote-form__submit">
        </form>`;
    
    let getVariants = performRequest(variantsURL);
    getVariants
        .then(res =>
            JSON.parse(res)
        )
        .then( questions => createInputs(questions) )
        //.then( inputs => createForm(inputs) )
        .then( formMarkup => {
            formWrapper.innerHTML = formMarkup;
        })
        .then(  )
        .catch(function(e) {
            console.log(e);
        })
    ;
}; // buildVoteForm

        