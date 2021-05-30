// MAIN
class Data {
    static colors = ['blue', 'green', 'red', 'orange',];

    static lectureData = [
        new Process('p1', 0, [3, 4], [4]),
        new Process('p2', 1, [2, 2], [2]),
        new Process('p3', 2, [1, 3], [1]),
    ];

    static exerciseData = [
        new Process('p1', 0, [1, 1, 1, 1, 1], [4, 4, 4, 4]),
        new Process('p2', 1, [2, 2, 3, 0, 0], [7, 7, 0, 0]),
        new Process('p3', 2, [13, 2, 0, 0, 0], [6, 0, 0, 0]),
    ];

    static defaultProcessArr = this.lectureData;

}

// initiate values
let processList = new ProcessList(Data.defaultProcessArr);
let algorithmName = 'fcfs';
let quantum = 2;

main();
function main() {
    renderFormTable();
    setupControlEvents();
    setupForm();
}

// ALGORITHM
function runAlgorithm() {
    const algorithm = new Algorithm(processList, algorithmName, quantum);
    const [pList, cpuBox, ioBox, readyQueue] = algorithm.run();
    renderResult(pList, cpuBox, ioBox, readyQueue);
}

// SETUP
function setupTableEvents() {
    let inputs = document.querySelectorAll('.table-input');
    inputs.forEach(input => {
        input.addEventListener('change', () => {
            updateProcessList();
        })
    })
}

function setupControlEvents() {
    let addProcessBtn = document.getElementById('add-process-btn');
    let requestBtn = document.getElementById('add-request-btn');
    let resetBtn = document.getElementById('reset-btn');
    // add process btn click
    addProcessBtn.addEventListener('click', () => {
        processList.addNewProcess();
        renderFormTable(processList);
    })

    // add cpu btn click
    requestBtn.addEventListener('click', () => {
        processList.addNewRequest();
        renderFormTable(processList);
    })
    resetBtn.addEventListener('click', () => {
        document.getElementById('result-table-area').innerHTML = '';
        document.getElementById('statistic-table-area').innerHTML = '';
        document.getElementById('algorithm-heading').innerHTML = '';
        document.getElementById('error-message-area').innerHTML = '';
        processList = new ProcessList(Data.defaultProcessArr);
        renderFormTable();
    })
}

function setupForm() {
    let algorithmSelect = document.getElementById('algorithm-select');
    let quantumInput = document.getElementById('quantum-input');
    let mainForm = document.getElementById('main-form');
    mainForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const errMessageArea = document.getElementById('error-message-area');
        const errMessage = processList.getError();
        if (!errMessage) {
            // clear error message
            errMessageArea.innerHTML = '';

            // run algorithm
            runAlgorithm();
        }
        else {
            // show error message
            errMessageArea.innerHTML = `<h3>${errMessage}</h3>`;
        }
    })

    algorithmSelect.addEventListener('change', (e) => {
        algorithmName = e.target.value;
        renderOption();
    })
    quantumInput.addEventListener('change', (e) => {
        quantum = e.target.value;
    })

    renderOption();
}

function updateProcessList() {
    const formData = new FormData(document.querySelector('#main-form'))
    const arrivalIndexArr = [];
    let i = 0;
    for (let item of formData.keys()) {
        if (item.includes('arrival')) arrivalIndexArr.push(i);
        i++;
    }
    const entries = [];
    for (let item of formData.entries()) {
        entries.push(item);
    }
    //
    let step = arrivalIndexArr[1] - arrivalIndexArr[0];
    let processes = arrivalIndexArr.map((val, index) => {
        let data = entries.slice(val, val + step);
        let arrival = (data.length > 0) ? data[0][1] : 0;
        let cpus = [];
        let ios = [];
        data.slice(1).forEach(item => {
            if (item[0].indexOf('cpu') > -1) cpus.push(item[1]);
            else ios.push(item[1]);
        })
        return new Process(`p${index + 1}`, arrival, cpus, ios);
    })
    processList.list = processes;

}

// GENERATE FORM TABLE
function renderOption() {
    let algorithmSelect = document.getElementById('algorithm-select');
    let quantumContainer = document.getElementById('quantum-container');
    let quantumInput = document.getElementById('quantum-input');
    algorithmSelect.value = algorithmName;
    let quantumDisplayVal = (algorithmName === 'rr') ? 'block' : 'none';
    quantumContainer.style.display = quantumDisplayVal;
    quantumInput.value = quantum;
}

function renderFormTable() {
    let tableArea = document.getElementById('form-table-area');
    tableArea.innerHTML = getTableHtml();
    setupTableEvents();

}

function getTableHtml() {
    let tableHtml = `<table table class="form-table" > ${getFormTableTHeadHtml()} ${getFormTableTBodyHtml()}</table > `;
    return tableHtml;
}

function getFormTableTHeadHtml() {
    let htmlStr = '';
    let process1 = processList.list[0];
    for (let i = 0; i < process1.ios.length; i++) {
        htmlStr += `<th>IO</th><th>CPU</th>`;
    }

    let tHead = `
        <thead thead >
            <tr>
                <th scope="col">#</th>
                <th>Process</th>
                <th>Arrival</th>
                <th>CPU</th>
                ${htmlStr}
            </tr>
        </thead>`;
    return tHead;

}

function getFormTableTBodyHtml() {
    let rows = '';
    processList.list.forEach((item, index) => {
        let htmlStr = ` 
            <th scope="row">${index + 1}</th>
            <td class="process-name">${item.name}</td>`;
        htmlStr += getNumberInputHtml(`arrival - ${index} `, item.arrival, 0) + getCpuAndIoColumn(item, index);
        rows += `<tr> ${htmlStr}</tr> `;
    })

    let tBody = ` <tbody> ${rows}</tbody>`;
    return tBody;
}

function getCpuAndIoColumn(item, index) {
    let str = ''
    item.cpus.forEach((cpuVal, cpuIndex) => {
        cpuVal = cpuVal || '';
        str += getNumberInputHtml(`cpu - ${index} -${cpuIndex} `, cpuVal);
        if (cpuIndex < item.cpus.length - 1) {
            let ioVal = item.ios[cpuIndex] || '';
            str += getNumberInputHtml(`io - ${index} -${cpuIndex} `, ioVal);
        }
    })
    return str;
}

function getNumberInputHtml(name, value, min = 1) {
    return `<td td > <input class="table-input" name="${name}" value="${value}" type="number" min="${min}" /></td > `;
}

// GENERATE RESULT TABLE
function renderResult(resultProcessList, cpuBox, ioBox, readyQueue) {
    // algorithm name
    let algorithmHeading = document.getElementById('algorithm-heading');
    let algorithmHeadingVal = (algorithmName == 'rr') ? `${algorithmName.toUpperCase()} Algorithm (q=${quantum})` : `${algorithmName.toUpperCase()} Algorithm`;
    algorithmHeading.innerText = algorithmHeadingVal;


    // display result box
    document.getElementById('result-box').style.display = 'block';

    // result table
    document.getElementById('result-table-area').innerHTML = getResultTableHtml(resultProcessList, cpuBox, ioBox, readyQueue);

    // statistic table
    document.getElementById('statistic-table-area').innerHTML = getStatisticTableHtml(resultProcessList);
}

function getResultTableHtml(resultProcessList, cpuBox, ioBox, readyQueue) {
    let html = `
        <table id="result-table" class="table">
            ${getResultTableTHeadHtml(cpuBox.length)}
            ${getResultTableTBodyHtml(resultProcessList, cpuBox, ioBox, readyQueue)}
        </table>`;
    return html;
}


function getResultTableTHeadHtml(length) {
    let thHtml = '';
    for (let i = 0; i < length; i++) thHtml += `<th>${i}</th>`;
    return `
        <thead>
            <tr>
                <th class="level-thead"></th>
                <th class="process-thead">Process</th>
                ${thHtml}
            </tr>
        </thead> `;

}

function getResultTableTBodyHtml(pList, cpuBox, ioBox, readyQueue) {
    const pColor = {};

    // assign background color for each process
    pList.list.forEach((p, index) => {
        const colorIndex = (index < Data.colors.length) ? index : index % Data.colors.length;
        pColor[p.name] = Data.colors[colorIndex]
    })

    let cpuLevelHtml = getCpuLevelHtml(pList, cpuBox, pColor);
    let ioLevelHtml = getIoLevelHtml(pList, ioBox, pColor);
    let readyQueueHtml = getReadyQueueHtml(pList, readyQueue);
    const tBodyHtml = `${cpuLevelHtml}${ioLevelHtml}${readyQueueHtml}`
    return tBodyHtml;
}

function getCpuLevelHtml(pList, cpuBox, pColor) {
    let cpuTrArr = pList.list.map((p, index) => {
        let trHtml = '';
        let tdArr = cpuBox.map((pName, subIndex) => {
            return drawTableCell(pName == p.name, cpuBox[subIndex - 1] != pName, p, pColor, pName == null, cpuBox[subIndex - 1], cpuBox[subIndex + 1], subIndex);
        })
        let tdHtml = convertArrayToString(tdArr);

        if (index == 0) {
            // first row
            trHtml = `
                <tr class="level-row">
                    <th class="level-name-cell" scope="row" rowspan="${pList.list.length}">CPU</th>
                    <td>${p.name}</td>
                    ${tdHtml}
                </tr> `;
        } else {
            trHtml = `
                <tr>
                    <td>${p.name}</td>
                    ${tdHtml}
                </tr> `;
        }
        return trHtml;
    })
    const html = addSpacing(convertArrayToString(cpuTrArr));
    return html;
}

function getIoLevelHtml(pList, ioBox, pColor) {
    let trArr = pList.list.map((p, index) => {
        let trHtml = '';
        let tdArr = ioBox.map((pNames, subIndex) => {
            const previousIo = ioBox[subIndex - 1] || [];
            return drawTableCell(pNames.includes(p.name), !previousIo.includes(p.name), p, pColor);
        })
        let tdHtml = convertArrayToString(tdArr);
        if (index == 0) {
            trHtml = `
                <tr class="level-row">
                    <th class="level-name-cell" scope="row" rowspan="${pList.list.length}">IO</th>
                    <td>${p.name}</td>
                    ${tdHtml}
                </tr> `;
        } else {
            trHtml = `
                <tr>
                    <td>${p.name}</td>
                    ${tdHtml}
                </tr> `;
        }
        return trHtml;
    })
    const html = addSpacing(convertArrayToString(trArr));
    return html;
}

function drawTableCell(isCurrent, showLabel, rowP, pColor, isEmpty = false, prevPname = null, nextPname = null, time = null) {
    let content = '';
    let htmlClass = (isEmpty) ? getEmptyLevelClass(prevPname, nextPname) : '';

    if (isCurrent) {
        htmlClass = `bg-${pColor[rowP.name]}`;
        if (showLabel) {
            htmlClass += ' process-label ';
            content = `<span>${rowP.name}</span>`;
        }
    } else {
        if (time == rowP.arrival) htmlClass += ` border-dashes-left-${pColor[rowP.name]}`;
        if (isWaitingForCpu(time, rowP.cpuRequestHistories)) htmlClass += ` border-dashes-bottom-${pColor[rowP.name]}`;
    }
    return `<td class="${htmlClass}">${content}</td> `;
}

function isWaitingForCpu(time, cpuRequestHistories) {
    for (let i = 0; i < cpuRequestHistories.length; i++) {
        let item = cpuRequestHistories[i];
        if (time >= item[0] && time < item[1]) return true;
    }
    return false;
}

function getEmptyLevelClass(prev, next) {
    let pos = '';
    if (!prev && !next) return '';
    else {
        if (prev && next) pos = 'vertical';
        else pos = (!prev) ? 'right' : 'left';
    }
    return `${pos}-dashes-border`;
}

function getReadyQueueHtml(pList, readyQueue) {
    // create 3 row
    let trHtml = '';
    let tdArr = readyQueue.map((subQueue, subIndex) => {
        let queueTdHtml = '';
        for (let i = 0; i < pList.list.length; i++) {
            const value = subQueue[i] || '';
            queueTdHtml += `<tr><td>${value}</td></tr>`;
        }
        let queueTrHtml = `<table>${queueTdHtml}</table>`;

        return `<td>${queueTrHtml}</td> `;
    })
    let tdHtml = convertArrayToString(tdArr);
    trHtml = `
            <tr id="ready-queue" class="level-row">
                <th  class="level-name-cell" scope="row" rowspan="${pList.list.length}">Ready Queue</th>
                <td></td>
                ${tdHtml}
            </tr> `;
    return trHtml;
}

// GENERATE STATISTIC TABLE
function getStatisticTableHtml(resultProcessList) {
    let html = `
        <table id="statistic-table" class="table">
            ${getStatisticTableTHeadHtml()}
            ${getStatisticTableTBodyHtml(resultProcessList)}
        </table>`;
    return html;
}

function getStatisticTableTHeadHtml() {
    return `
        <thead>
            <tr>
                <th>Process</th>
                <th>R</th>
                <th>W</th>
                <th>T</th>
            </tr>
        </thead> `;
}
function getStatisticTableTBodyHtml(pList) {
    return `
        <tbody>
            ${getStatisticDataRows(pList)}
            ${getStatisticAverageRow(pList)}
        </tbody>
          `;
}

function getStatisticDataRows(pList) {
    const trArr = pList.list.map((p) => {
        return `
            <tr>
                <td>${p.name}</td>
                <td>${p.responseTime}</td>
                <td>${p.waitingTime}</td>
                <td>${p.turnAroundTime}</td>
            </tr> `;
    })
    return convertArrayToString(trArr);
}

function getStatisticAverageRow(pList) {
    const formatNumber = (val) => {
        return val.toFixed(2)
    }
    let html = `
        <tr>
            <th>Average</th>
            <td>${formatNumber(pList.avgResponseTime)}</td>
            <td>${formatNumber(pList.avgWaitingTime)}</td>
            <td>${formatNumber(pList.avgTurnAroundTime)}</td>
        </tr> `;
    return html
}

// OTHER FUNCTIONS
function addSpacing(value, n = 1) {
    const html = `${value}${'<tr ><td colspan="1000"><br/></td></tr><tr class="tr-spacing"><td colspan="1000"><br/></td></tr>'.repeat(n)}`
    return html;
}

function convertArrayToString(array) {
    let str = array.reduce((prev, current) => {
        return prev + current;
    }, '');
    return str;
}