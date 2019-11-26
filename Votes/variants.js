'use strict';
function reqListener () {
    console.log(this.responseText);
}
  
var oReq = new XMLHttpRequest();
oReq.addEventListener("load", reqListener);
oReq.open("GET", "http://localhost:8080/variants");
oReq.send();



// let inputGroup = document.querySelector('.inputs');
// let variantsURL = 'http://localhost:8080/variants';

// let performRequest = function(url) { 
//     return new Promise(function(resolve, reject) {
//         let xhr = new XMLHttpRequest();
//         xhr.onload = function() {
//           if (xhr.status === 200)
//             resolve(xhr.responseText);
//           else
//             reject(xhr.statusText)
//         };
//         xhr.onerror = function() {
//             reject(xhr);
//         };
//         xhr.open('GET', url);
//         xhr.send();   
//     });
// };

// let parseResponse = res =>
//     JSON.parse(res)

// let createInputs = questions => {
//     let inputs = questions.map(q => 
//         `<input type="radio" name="${q.code}" value="${q.value}" class="gaidai">`
//     );
//     appendInputs(inputs.join('\n'));
// };

// let appendInputs = inputs => {
//     inputGroup.innerHTML = inputs;
// }

// let getVariants = performRequest(variantsURL);
// getVariants
//     .then(res =>
//         JSON.parse(res)
//     )
//     .then( questions => {
//         createInputs(questions);
//     })
//     .catch(function(error) {
//         console.log(error);
//     })
//     ;
        