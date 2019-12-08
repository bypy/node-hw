'use strict';
(() => {
    window.addEventListener('DOMContentLoaded', createVotingInterface);

    function createVotingInterface() {
        const tableWrapper = document.querySelector('.vote-table__wrapper');
        const exportBtns = tableWrapper.querySelector('.vote-table__export').cloneNode(true);
        const variantsURL = '/variants';
        const statURL = '/stat';
        const voteURL = '/vote';
        const voteButtonActionName = 'vote';

        const performRequest = function(url, params) {
            params = params || {};
            const request = new Request(url, params);
            return new Promise((resolve, reject) => {
                fetch(request).then(response => {
                    if (response.status === 200) {
                        resolve(response.text());
                    } else {
                        throw new Error('Something went wrong on api server!');
                    }
                });
            });
        };

        const getVariants = () => performRequest(variantsURL);

        const getStat = () => {
            const params = {
                method: 'GET'
            };
            return performRequest(statURL, params);
        };

        const sendVote = answerCode => {
            const params = {
                method: 'POST',
                headers: {
                    'Content-Type':
                        'application/x-www-form-urlencoded'
                },
                body: 'code=' + encodeURIComponent(answerCode)
            };
            return performRequest(voteURL, params);
        };

        const createInputs = (stat, questions) =>
            questions
                .map(
                    q =>
                        `<tr>
                    <td class='vote-table__question'>
                        <input type='button' data-action='${voteButtonActionName}'
                            name='${q.code}' value='${q.text}'></td>
                    <td class='vote-table__result'>${stat[q.code]}</td>
                </tr>`
                )
                .join('\n');

        const createQuestionTable = inputs =>
            `<table class='vote-table__body'>
                    <tbody>
                        ${inputs}
                    </tbody>
                </table>`;

        const refreshStat = stat => {
            let statRows = tableWrapper.querySelectorAll('tr');
            statRows.forEach(row => {
                let voteBtn = row.querySelector('input[data-action="vote"]');
                if (voteBtn) {
                    let currVoteCode = voteBtn.getAttribute('name');
                    row.querySelector(
                        'td[class="vote-table__result"]'
                    ).textContent = stat[currVoteCode];
                }
            });
        };

        const sendAndUpdate = EO => {
            if (
                EO.target.getAttribute('data-action') === voteButtonActionName
            ) {
                sendVote(EO.target.name)
                    .then(() => {
                        console.log('Голос засчитан');
                        return getStat();
                    })
                    .then(stat => {
                        let updStat = JSON.parse(stat);
                        refreshStat(updStat);
                    })
                    .catch(function(e) {
                        console.log(e);
                    });
            }
        };

        const listenVotes = () => {
            tableWrapper.addEventListener('click', sendAndUpdate);
        };

        Promise.all([getStat(), getVariants()])
            .then(values => {
                let stats = JSON.parse(values[0]);
                let variants = JSON.parse(values[1]);
                let inputs = createInputs(stats, variants);
                let questionTable = createQuestionTable(inputs);
                tableWrapper.innerHTML = questionTable;
                tableWrapper.appendChild(exportBtns);
                listenVotes();
            })
            .catch(function(e) {
                console.log(e);
            });
    } // buildVoteForm

})();
