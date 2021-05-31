// interface value
let renderResultMode = Data.renderResultMode.playing
let intervalRenderingTime = 400;

// initiate values
let processList = new ProcessList(new Data().defaultProcessArr);
let algorithmName = 'fcfs';
let quantum = 2;


// html dom elm
const domEle = {
    // form
    quantumContainer: document.getElementById('quantum-container'),
    algorithmSelect: document.getElementById('algorithm-select'),
    quantumInput: document.getElementById('quantum-input'),
    mainForm: document.getElementById('main-form'),


    // box
    resultBox: document.querySelector('.box:last-child'),

    // table
    formTableInputs: () => document.querySelectorAll('.table-input'),

    // buttons
    addProcessBtn: document.getElementById('add-process-btn'),
    requestBtn: document.getElementById('add-request-btn'),
    resetBtn: document.getElementById('reset-btn'),
    controlBarButtons: document.querySelectorAll('.control-bar button'),

    // area
    resultTableArea: document.getElementById('result-table-area'),
    statisticTableArea: document.getElementById('statistic-table-area'),
    errorMessageArea: document.getElementById('error-message-area'),
    formTableArea: document.getElementById('form-table-area'),

    // heading
    algorithmHeading: document.getElementById('algorithm-heading'),

}


main();
function main() {
    renderFormTable();
    setupControlEvents();
    setupFormEvents();
}

// ALGORITHM
function runAlgorithm() {
    const algorithm = new Algorithm(processList, algorithmName, quantum);
    const [pList, cpuBox, ioBox, readyQueue] = algorithm.run();
    renderResult(pList, cpuBox, ioBox, readyQueue);
}

// SETUP
function setupTableEvents() {
    domEle.formTableInputs().forEach(input => {
        input.addEventListener('change', () => {
            updateProcessList();
        })
    })
}

function setupControlEvents() {
    // add process btn click
    domEle.addProcessBtn.addEventListener('click', () => {
        processList.addNewProcess();
        renderFormTable(processList);
    })

    // add cpu btn click
    domEle.requestBtn.addEventListener('click', () => {
        processList.addNewRequest();
        renderFormTable(processList);
    })
    domEle.resetBtn.addEventListener('click', () => {
        domEle.resultTableArea.innerHTML = '';
        domEle.statisticTableArea.innerHTML = '';
        domEle.algorithmHeading.innerHTML = '';
        domEle.errorMessageArea.innerHTML = '';
        processList = new ProcessList(new Data().defaultProcessArr);
        renderFormTable();
    })
}

function setupFormEvents() {
    domEle.mainForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const errMessage = processList.getError();
        if (!errMessage) {
            // clear error message
            domEle.errorMessageArea.innerHTML = '';

            // run algorithm
            runAlgorithm();
        }
        else {
            // show error message
            domEle.errorMessageArea.innerHTML = `<h3>${errMessage}</h3>`;
        }
    })

    domEle.algorithmSelect.addEventListener('change', (e) => {
        algorithmName = e.target.value;
        renderOption();
    })
    domEle.quantumInput.addEventListener('change', (e) => {
        quantum = e.target.value;
    })

    renderOption();
}

function updateProcessList() {
    const formData = new FormData(domEle.mainForm)
    const arrivalIndexArr = [];
    let i = 0;

    for (let item of formData.keys()) {
        console.log('item', item);
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
    domEle.algorithmSelect.value = algorithmName;
    let quantumDisplayVal = (algorithmName === 'rr') ? 'block' : 'none';
    domEle.quantumContainer.style.display = quantumDisplayVal;
    domEle.quantumInput.value = quantum;
}

function renderFormTable() {
    domEle.formTableArea.innerHTML = getTableHtml();
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
    return `<td>
                <input class="table-input" name="${name}" value="${value}" type="number" min="${min}" max="100" step="1"/>
            </td> `;
}

// GENERATE RESULT TABLE

function renderResult(resultProcessList, cpuBox, ioBox, readyQueue) {
    // display result box
    timelineLength = cpuBox.length;
    domEle.resultBox.scrollLeft = 0;
    // algorithm name
    let algorithmHeadingVal = (algorithmName == 'rr') ? `${algorithmName.toUpperCase()} Algorithm (q=${quantum})` : `${algorithmName.toUpperCase()} Algorithm`;
    domEle.algorithmHeading.innerText = algorithmHeadingVal;

    if (renderResultMode == Data.renderResultMode.immediate) renderResultImmediateMode(resultProcessList, cpuBox, ioBox, readyQueue);
    else renderResultPlayingMode(resultProcessList, cpuBox, ioBox, readyQueue);

    // display result box
    domEle.resultBox.style.display = 'block';
    setTimeout(() => {
        scrollToBottom();
    }, intervalRenderingTime);
}

function renderResultImmediateMode(resultProcessList, cpuBox, ioBox, readyQueue) {
    renderResultTable(resultProcessList, cpuBox, ioBox, readyQueue);
    renderStatisticTable(resultProcessList)
}

let timelineLength = 0;
let resultTableMaxTime = 0;
let renderResultTableInterval = null;
let isRendering = false;
function renderResultPlayingMode(resultPList, cpuBox, ioBox, readyQueue) {
    toggleControlBar(false);
    isRendering = true;

    // render result table
    renderResultTableInterval = setInterval(() => {
        renderResultTable(resultPList, cpuBox, ioBox, readyQueue, resultTableMaxTime);

        // scroll to current running cell
        scrollToCurrentRunningCell()

        if (resultTableMaxTime == cpuBox.length) onRenderResultFinish(resultPList);
        resultTableMaxTime++;
    }, intervalRenderingTime);
}

function onRenderResultFinish(resultPList) {
    clearInterval(renderResultTableInterval)
    toggleControlBar(true);
    resultTableMaxTime = 0;
    timelineLength = 0;
    isRendering = false;
    setTimeout(() => {
        // statistic table
        renderStatisticTable(resultPList);
        scrollToBottom();
    }, intervalRenderingTime);
}

function scrollToCurrentRunningCell() {
    const runningCell = document.querySelector('table#result-table tbody td:last-child');
    const halfClientBoxWidth = domEle.resultBox.clientWidth / 2;
    const leftOffset = runningCell.offsetLeft - halfClientBoxWidth;
    if (leftOffset > 0) scrollHorizontal(domEle.resultBox, leftOffset)
}

function renderResultTable(resultProcessList, cpuBox, ioBox, readyQueue, maxTime = -1) {
    domEle.resultTableArea.innerHTML = getResultTableHtml(resultProcessList, cpuBox, ioBox, readyQueue, maxTime);
}

function renderStatisticTable(resultProcessList) {
    domEle.statisticTableArea.innerHTML = getStatisticTableHtml(resultProcessList);
}

function getResultTableHtml(resultProcessList, cpuBox, ioBox, readyQueue, maxTime = -1) {
    let html = `
        <table id="result-table" class="table">
            ${getResultTableTHeadHtml(cpuBox.length)}
            ${getResultTableTBodyHtml(resultProcessList, cpuBox, ioBox, readyQueue, maxTime)}
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

function getResultTableTBodyHtml(pList, cpuBox, ioBox, readyQueue, maxTime = -1) {
    const pColor = {};

    // assign background color for each process
    pList.list.forEach((p, index) => {
        const colorIndex = (index < Data.colors.length) ? index : index % Data.colors.length;
        pColor[p.name] = Data.colors[colorIndex]
    })

    if (maxTime > -1) {
        cpuBox = cpuBox.slice(0, maxTime);
        ioBox = ioBox.slice(0, maxTime);
        readyQueue = readyQueue.slice(0, maxTime);
    }
    let cpuLevelHtml = getCpuLevelHtml(pList, cpuBox, pColor);
    let ioLevelHtml = getIoLevelHtml(pList, ioBox, pColor);
    let readyQueueHtml = getReadyQueueHtml(pList, readyQueue);
    const tBodyHtml = `${cpuLevelHtml}${ioLevelHtml}${readyQueueHtml}`
    return tBodyHtml;
}

function toggleControlBar(value) {
    domEle.controlBarButtons.forEach(item => {
        if (!value) item.setAttribute('disabled', 'disabled');
        else item.removeAttribute('disabled');
    })

}

function getCpuLevelHtml(pList, cpuBox, pColor) {
    let cpuTrArr = pList.list.map((p, index) => {
        let trHtml = '';
        let tdArr = cpuBox.map((pName, subIndex) => {
            return drawTableCell('cpu', pName == p.name, cpuBox[subIndex - 1] != pName, p, pColor, subIndex, pName == null, cpuBox[subIndex - 1], cpuBox[subIndex + 1]);
        })
        let tdHtml = convertArrayToString(tdArr);

        if (index == 0) {
            // first row
            trHtml = `
                <tr class="level-row">
                    <th class="level-name-cell" scope="row" rowspan="${pList.list.length}">CPU</th>
                    <td class="process-name">${p.name}</td>
                    ${tdHtml}
                </tr> `;
        } else {
            trHtml = `
                <tr>
                    <td class="process-name">${p.name}</td>
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
            return drawTableCell('io', pNames.includes(p.name), !previousIo.includes(p.name), p, pColor, subIndex);
        })
        let tdHtml = convertArrayToString(tdArr);
        if (index == 0) {
            trHtml = `
                <tr class="level-row">
                    <th class="level-name-cell" scope="row" rowspan="${pList.list.length}">IO</th>
                    <td class="process-name">${p.name}</td>
                    ${tdHtml}
                </tr> `;
        } else {
            trHtml = `
                <tr>
                    <td class="process-name">${p.name}</td>
                    ${tdHtml}
                </tr> `;
        }
        return trHtml;
    })
    const html = addSpacing(convertArrayToString(trArr));
    return html;
}

function drawTableCell(level, isCurrent, showLabel, rowP, pColor, time = null, isEmpty = false, prevPname = null, nextPname = null) {
    let content = (showLabel && isCurrent) ? rowP.name : '';
    let htmlClass = getTableCellHtmlClasses(level, timelineLength, resultTableMaxTime, time, time == rowP.arrival, showLabel, isCurrent, isEmpty, pColor[rowP.name], isWaitingForCpu(time, rowP.cpuRequestHistories), prevPname, nextPname)
    return `<td class="${htmlClass}">${content}</td> `;
}

function getTableCellHtmlClasses(level, timelineLength, maxTime, time, isArrival, isShowLabel, isHoldingCpu, isEmpty, color, isWaitingForCpu, prevPname, nextPname) {
    let htmlClass = (isEmpty) ? getEmptyLevelClass(prevPname, nextPname) : '';
    if (isHoldingCpu) {
        htmlClass = `bg-${color}`;
        if (isShowLabel) htmlClass += ' process-label ';
    } else if (level == 'cpu') {
        if (isArrival) htmlClass += ` border-dashes-left-${color}`;
        if (isWaitingForCpu) htmlClass += ` border-dashes-bottom-${color}`;
    }
    htmlClass += getHtmlHighlightClassIfPassCondition(timelineLength, maxTime, time);
    return htmlClass;
}

function getHtmlHighlightClassIfPassCondition(timelineLength, maxTime, time) {
    const htmlClass = (time == maxTime - 1 && time < timelineLength - 1) ? ' border-solid-right-highlight' : '';
    return htmlClass;
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
            queueTdHtml += `<tr><td >${value}</td></tr>`;
        }
        let queueTrHtml = `<table>${queueTdHtml}</table>`;
        const htmlClass = getHtmlHighlightClassIfPassCondition(timelineLength, resultTableMaxTime, subIndex)
        return `<td  class="${htmlClass}">${queueTrHtml}</td> `;
    })
    let tdHtml = convertArrayToString(tdArr);
    trHtml = `
            <tr id="ready-queue" class="level-row">
                <th   class="level-name-cell" scope="row" rowspan="${pList.list.length}">Ready Queue</th>
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

function scrollHorizontal(element, offset) {
    setTimeout(() => {
        // scroll to the end
        element.scrollLeft = offset;
    }, intervalRenderingTime);
}

function scrollToBottom() {
    setTimeout(() => {
        window.scrollTo(0, document.body.scrollHeight);
    }, intervalRenderingTime);
}