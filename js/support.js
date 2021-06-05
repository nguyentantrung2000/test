// HTML DOM ELM
const domEle = {
    // form
    quantumContainer: document.getElementById('quantum-container'),
    algorithmSelect: document.getElementById('algorithm-select'),
    quantumInput: document.getElementById('quantum-input'),
    inputTableForm: document.getElementById('input-table-form'),
    optionForm: document.getElementById('option-form'),


    // box
    resultBox: document.querySelector('.box:last-child'),

    // table
    formTableInputs: () => document.querySelectorAll('#form-table-area table tbody input'),
    resultTableTimeColumns: () => document.querySelectorAll('table#result-table th[time], table#result-table td[time]'),
    resultTableTimeColumnsAtTime: (time) => document.querySelectorAll(`table#result-table th[time="${time}"], table#result-table td[time="${time}"]`),

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

// DEFINE OBJECTS
class Data {
    static colors = ['blue', 'green', 'red', 'orange',];

    static renderResultMode = {
        immediate: 'immediate',
        playing: 'playing',
    }

    constructor() {
        const lectureData = [
            new Process('p1', 0, [3, 4], [4]),
            new Process('p2', 1, [2, 2], [2]),
            new Process('p3', 2, [1, 3], [1]),
        ];

        const exerciseData = [
            new Process('p1', 0, [1, 1, 1, 1, 1], [4, 4, 4, 4]),
            new Process('p2', 0, [2, 2, 3, 0, 0], [7, 7, 0, 0]),
            new Process('p3', 0, [13, 2, 0, 0, 0], [6, 0, 0, 0]),
        ];
        this.defaultProcessArr = exerciseData;
    }
}

class FormTable {
    pList = [];

    render(pList) {
        this.pList = pList;
        domEle.formTableArea.innerHTML = this.getTableHtml();
        this.setupTableEvents();

    }

    setupTableEvents() {
        domEle.formTableInputs().forEach(input => {
            input.addEventListener('change', () => {
                this.loadProcessListFromTable();
            })
        })
    }

    getTableHtml() {
        let tableHtml = `<table table class="form-table" > ${this.getFormTableTHeadHtml()} ${this.getFormTableTBodyHtml()}</table > `;
        return tableHtml;
    }

    getFormTableTHeadHtml() {
        let htmlStr = '';
        let process1 = this.pList.list[0];
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

    getFormTableTBodyHtml() {
        let rows = '';
        this.pList.list.forEach((item, index) => {
            let htmlStr = ` 
            <th scope="row">${index + 1}</th>
            <td class="process-name">
                <input type="text" minlength="1" required="required" maxlength="2" name="process-name" value="${item.name}" />
                
            </td>`;
            htmlStr += this.getNumberInputHtml(`arrival-${index}`, item.arrival, 0) + this.getCpuAndIoColumn(item, index);
            rows += `<tr> ${htmlStr}</tr> `;
        })

        let tBody = ` <tbody> ${rows}</tbody>`;
        return tBody;
    }

    getCpuAndIoColumn(item, index) {
        let str = ''
        item.cpus.forEach((cpuVal, cpuIndex) => {
            cpuVal = cpuVal || '';
            str += this.getNumberInputHtml(`cpu - ${index} -${cpuIndex} `, cpuVal);
            if (cpuIndex < item.cpus.length - 1) {
                let ioVal = item.ios[cpuIndex] || '';
                str += this.getNumberInputHtml(`io - ${index} -${cpuIndex} `, ioVal);
            }
        })
        return str;
    }

    getNumberInputHtml(name, value, min = 1) {
        return `<td>
                <input class="table-input" name="${name}" value="${value}" type="number" min="${min}" max="100" step="1"/>
            </td> `;
    }

    loadProcessListFromTable() {
        const formData = new FormData(domEle.inputTableForm)
        const pIndexArr = [];
        let i = 0;

        for (let item of formData.keys()) {
            if (item.includes('process-name')) pIndexArr.push(i);
            i++;
        }
        const entries = [];
        for (let item of formData.entries()) {
            entries.push(item);
        }
        //
        let step = pIndexArr[1] - pIndexArr[0];
        let processes = pIndexArr.map((val, index) => {
            let data = entries.slice(val, val + step);
            let name = data[0][1];
            let arrival = data[1][1];
            let cpus = [];
            let ios = [];
            data.slice(2).forEach(item => {
                if (item[0].indexOf('cpu') > -1) cpus.push(item[1]);
                else ios.push(item[1]);
            })
            return new Process(name, arrival, cpus, ios);
        })
        this.pList.list = processes;
    }
}

class ResultBox {
    static renderingMode = Data.renderResultMode.immediate
    static renderingGapTime = 400;

    algorithmName = null;
    timelineLength = 0;
    resultTableMaxTime = 0;
    renderResultTableInterval = null;
    quantum = -1;

    resultTable = new ResultTable();
    statisticTable = new StatisticTable();

    constructor() {
    }

    render(resultProcessList, cpuBox, ioBox, readyQueue, algorithmName, quantum) {
        ResultBox.clearTables();
        this.algorithmName = algorithmName;
        this.quantum = quantum;
        // display result box
        this.timelineLength = cpuBox.length;
        domEle.resultBox.scrollLeft = 0;
        // algorithm name
        let algorithmHeadingVal = (this.algorithmName == 'rr') ? `${this.algorithmName.toUpperCase()} Algorithm (q=${this.quantum})` : `${this.algorithmName.toUpperCase()} Algorithm`;
        domEle.algorithmHeading.innerText = algorithmHeadingVal;

        let renderPromise = null;
        if (ResultBox.renderingMode == Data.renderResultMode.immediate) renderPromise = this.renderResultImmediateMode(resultProcessList, cpuBox, ioBox, readyQueue);
        else renderPromise = this.renderResultPlayingMode(resultProcessList, cpuBox, ioBox, readyQueue);

        // render finish
        renderPromise.then(x => {
            const hoverClass = 'td-hover';
            this.onRenderResultFinish(resultProcessList);
            domEle.resultTableTimeColumns().forEach(item => {
                let time = item.getAttribute('time');
                item.addEventListener('mouseenter', (e) => {
                    const columns = domEle.resultTableTimeColumnsAtTime(time);
                    columns.forEach(column => {
                        column.classList.add(hoverClass);
                    })
                })

                item.addEventListener('mouseleave', (e) => {
                    const columns = domEle.resultTableTimeColumnsAtTime(time);
                    columns.forEach(column => {
                        column.classList.remove(hoverClass);
                    })
                })
            });

        })

        // display result box
        domEle.resultBox.style.display = 'block';
        Helper.scrollToBottom();
    }

    renderResultImmediateMode(resultProcessList, cpuBox, ioBox, readyQueue) {
        return new Promise(resolve => {
            this.resultTable.render(resultProcessList, cpuBox, ioBox, readyQueue, this.timelineLength);
            resolve(true);
        })
    }

    renderResultPlayingMode(resultPList, cpuBox, ioBox, readyQueue) {
        return new Promise(resolve => {
            Helper.toggleControlBar(false);
            this.isRendering = true;

            // render result table
            this.renderResultTableInterval = setInterval(() => {
                this.resultTable.render(resultPList, cpuBox, ioBox, readyQueue, this.timelineLength, this.resultTableMaxTime);

                // scroll to current running cell
                this.scrollToCurrentRunningCell()

                if (this.resultTableMaxTime == cpuBox.length) resolve(true)
                this.resultTableMaxTime++;
            }, ResultBox.renderingGapTime);
        })
    }

    onRenderResultFinish(resultPList) {
        clearInterval(this.renderResultTableInterval)
        Helper.toggleControlBar(true);
        this.resultTableMaxTime = 0;
        this.timelineLength = 0;
        this.isRendering = false;
        this.statisticTable.render(resultPList);
    }

    scrollToCurrentRunningCell() {
        const runningCell = document.querySelector('table#result-table tbody tr:first-child td:last-child');
        if (runningCell) {
            const halfClientBoxWidth = domEle.resultTableArea.clientWidth / 1;
            const leftOffset = runningCell.offsetLeft - halfClientBoxWidth;
            if (leftOffset > 0) Helper.scrollHorizontal(domEle.resultTableArea, leftOffset)
        }
    }

    static clearTables() {
        domEle.resultTableArea.innerHTML = '';
        domEle.statisticTableArea.innerHTML = '';
    }

    static clear() {
        ResultBox.clearTables();
        domEle.algorithmHeading.innerHTML = '';
    }
}

class ResultTable {
    timelineLength = 0;
    maxTime = 0;
    isRendering = false;
    nPreCol = 2;

    constructor() {
    }

    render(resultProcessList, cpuBox, ioBox, readyQueue, timelineLength, maxTime = -1) {
        this.maxTime = maxTime;
        this.timelineLength = timelineLength;
        domEle.resultTableArea.innerHTML = this.getResultTableHtml(resultProcessList, cpuBox, ioBox, readyQueue, maxTime);

        // highlight
        if (maxTime < timelineLength)
            domEle.resultTableTimeColumnsAtTime(maxTime - 1).forEach(cell => {
                cell.classList.add('highlight-column');
                const cellHtml = '<div class="highlight-box"></div>' + cell.innerHTML;
                cell.innerHTML = cellHtml;
            })

    }

    getResultTableHtml(resultProcessList, cpuBox, ioBox, readyQueue, maxTime = -1) {
        let html = `
        <table id="result-table" class="table">
            ${this.getResultTableTHeadHtml(cpuBox.length)}
            ${this.getResultTableTBodyHtml(resultProcessList, cpuBox, ioBox, readyQueue, maxTime)}
        </table>`;
        return html;
    }

    getResultTableTHeadHtml(length) {
        let thHtml = '';
        for (let i = 0; i < length; i++) thHtml += `<th time="${i}">${i}</th>`;
        return `
        <thead>
            <tr>
                <th class="level-thead"></th>
                <th class="process-thead">Process</th>
                ${thHtml}
            </tr>
        </thead> `;

    }

    getResultTableTBodyHtml(pList, cpuBox, ioBox, readyQueue, maxTime = -1) {
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
        let cpuLevelHtml = this.getCpuLevelHtml(pList, cpuBox, pColor);
        let ioLevelHtml = this.getIoLevelHtml(pList, ioBox, pColor);
        let readyQueueHtml = this.getReadyQueueHtml(pList, readyQueue, pColor);
        const tBodyHtml = `${cpuLevelHtml}${ioLevelHtml}${readyQueueHtml}`
        return tBodyHtml;
    }

    getCpuLevelHtml(pList, cpuBox, pColor) {
        let cpuTrArr = pList.list.map((p, index) => {
            let trHtml = '';
            let tdArr = cpuBox.map((pName, subIndex) => {
                return this.drawTableCell('cpu', pName == p.name, cpuBox[subIndex - 1] != pName, p, pColor, subIndex, pName == null, cpuBox[subIndex - 1], cpuBox[subIndex + 1]);
            })
            let tdHtml = Helper.convertArrayToString(tdArr);

            if (index == 0) {
                // first row
                trHtml = `
                <tr class="level-row">
                    <th class="level-name-cell" scope="row" rowspan="${pList.list.length}">CPU</th>
                    <th class="process-name text-${pColor[p.name]}">${p.name}</th>
                    ${tdHtml}
                </tr> `;
            } else {
                trHtml = `
                <tr>
                    <th class="process-name text-${pColor[p.name]}">${p.name}</th>
                    ${tdHtml}
                </tr> `;
            }
            return trHtml;
        })
        const html = Helper.addSpacing(Helper.convertArrayToString(cpuTrArr), this.nPreCol, this.timelineLength);
        return html;
    }

    getIoLevelHtml(pList, ioBox, pColor) {
        let trArr = pList.list.map((p, index) => {
            let trHtml = '';
            let tdArr = ioBox.map((pNames, subIndex) => {
                const previousIo = ioBox[subIndex - 1] || [];
                return this.drawTableCell('io', pNames.includes(p.name), !previousIo.includes(p.name), p, pColor, subIndex);
            })
            let tdHtml = Helper.convertArrayToString(tdArr);
            if (index == 0) {
                trHtml = `
                <tr class="level-row">
                    <th class="level-name-cell" scope="row" rowspan="${pList.list.length}">IO</th>
                    <th class="process-name text-${pColor[p.name]}">${p.name}</th>
                    ${tdHtml}
                </tr> `;
            } else {
                trHtml = `
                <tr>
                    <th class="process-name text-${pColor[p.name]}">${p.name}</th>
                    ${tdHtml}
                </tr> `;
            }
            return trHtml;
        })
        const html = Helper.addSpacing(Helper.convertArrayToString(trArr), this.nPreCol, this.timelineLength);
        return html;
    }

    drawTableCell(level, isCurrent, showLabel, rowP, pColor, time = null, isEmpty = false, prevPname = null, nextPname = null) {
        let content = (showLabel && isCurrent) ? rowP.name : '';
        let htmlClass = this.getTableCellHtmlClasses(level, time, time == rowP.arrival, showLabel, isCurrent, isEmpty, pColor[rowP.name], this.isWaitingForCpu(time, rowP.cpuRequestHistories), prevPname, nextPname)
        //let highlightBox = (this.isHighlightCell(time)) ? '<div class="highlight-box"></div>' : '';
        return `<td class="${htmlClass}" time="${time}">${content}</td> `;
    }

    getTableCellHtmlClasses(level, time, isArrival, isShowLabel, isHoldingCpu, isEmpty, color, isWaitingForCpu, prevPname, nextPname) {
        let htmlClass = (isEmpty) ? this.getEmptyLevelClass(prevPname, nextPname) : '';
        if (isHoldingCpu) {
            htmlClass = `bg-${color}`;
            if (isShowLabel) htmlClass += ' process-label ';
        } else if (level == 'cpu') {
            if (isArrival) htmlClass += ` border-dashes-left-${color}`;
            if (isWaitingForCpu) htmlClass += ` border-dashes-bottom-${color}`;
        }
        //htmlClass += this.getHtmlHighlightClassIfPassCondition(time);
        return htmlClass;
    }

    getHtmlHighlightClassIfPassCondition(time) {
        const htmlClass = (this.isHighlightCell(time)) ? ' highlight-column' : '';
        return htmlClass;
    }

    isHighlightCell(time) {
        return (time == this.maxTime - 1 && time < this.timelineLength - 1);
    }

    isWaitingForCpu(time, cpuRequestHistories) {
        for (let i = 0; i < cpuRequestHistories.length; i++) {
            let item = cpuRequestHistories[i];
            if (time >= item[0] && time < item[1]) return true;
        }
        return false;
    }

    getEmptyLevelClass(prev, next) {
        let pos = '';
        if (!prev && !next) return '';
        else {
            if (prev && next) pos = 'vertical';
            else pos = (!prev) ? 'right' : 'left';
        }
        return `${pos}-dashes-border`;
    }

    getReadyQueueHtml(pList, readyQueue, pColor) {
        let trHtml = '';
        let tdArr = readyQueue.map((subQueue, subIndex) => {
            let queueTdHtml = '';
            for (let i = 0; i < pList.list.length; i++) {
                let value = '';
                const queueProcesses = subQueue[i];
                if (queueProcesses) {
                    const pName = queueProcesses[0];
                    const pCpu = queueProcesses[1];
                    value = `<div>${pName}<span class="process-cpu">${pCpu}</span></div>`;
                }

                queueTdHtml += `<tr><td class="">${value}</td></tr>`;
            }
            let queueTrHtml = `<table>${queueTdHtml}</table>`;
            const htmlClass = this.getHtmlHighlightClassIfPassCondition(subIndex)
            return `<td  class="${htmlClass}" time="${subIndex}">${queueTrHtml}</td> `;
        })
        let tdHtml = Helper.convertArrayToString(tdArr);
        trHtml = `
            <tr id="ready-queue" class="level-row">
                <th colspan="2"   class="level-name-cell" scope="row" rowspan="${pList.list.length}">Ready Queue</th>
                ${tdHtml}
            </tr> `;
        return trHtml;
    }


}

class StatisticTable {
    constructor() {
    }

    render(resultProcessList) {
        domEle.statisticTableArea.innerHTML = this.getStatisticTableHtml(resultProcessList);
    }

    getStatisticTableHtml(resultProcessList) {
        let html = `
        <table id="statistic-table" class="table">
            ${this.getStatisticTableTHeadHtml()}
            ${this.getStatisticTableTBodyHtml(resultProcessList)}
        </table>`;
        return html;
    }

    getStatisticTableTHeadHtml() {
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
    getStatisticTableTBodyHtml(pList) {
        return `
        <tbody>
            ${this.getStatisticDataRows(pList)}
            ${this.getStatisticAverageRow(pList)}
        </tbody>
          `;
    }

    getStatisticDataRows(pList) {
        const trArr = pList.list.map((p) => {
            return `
            <tr>
                <td>${p.name}</td>
                <td>${p.responseTime}</td>
                <td>${p.waitingTime}</td>
                <td>${p.turnAroundTime}</td>
            </tr> `;
        })
        return Helper.convertArrayToString(trArr);
    }

    getStatisticAverageRow(pList) {
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

}

class Helper {
    static addSpacing(value, nPreCol, timelineLength, n = 1) {
        let html = value;
        let tdHtml = `<td colspan="${nPreCol}"></td>`;
        for (let i = 0; i < timelineLength; i++) tdHtml += `<td time="${i}"></td>`;
        html += `   <tr>
                        ${tdHtml}
                    </tr>
                    <tr class="tr-spacing">
                        ${tdHtml}
                    </tr>`.repeat(n);
        return html;
    }

    static convertArrayToString(array) {
        let str = array.reduce((prev, current) => {
            return prev + current;
        }, '');
        return str;
    }

    static scrollHorizontal(element, offset) {
        setTimeout(() => {
            // scroll to the end
            element.scrollLeft = offset;
        }, ResultBox.renderingGapTime);
    }

    static scrollToBottom() {
        setTimeout(() => {
            window.scrollTo(0, document.body.scrollHeight);
        }, ResultBox.renderingGapTime);
    }

    static toggleControlBar(value) {
        domEle.controlBarButtons.forEach(item => {
            if (!value) item.setAttribute('disabled', 'disabled');
            else item.removeAttribute('disabled');
        })
    }
}

new Main().run();
function Main() {

    // initiate values
    this.formTable = new FormTable();
    this.processList = new ProcessList(new Data().defaultProcessArr);
    this.algorithmName = 'fcfs';
    this.quantum = 5;

    // MAIN CODE HERE =============
    this.run = function () {
        this.formTable.render(this.processList);
        this.setupControlEvents();
        this.setupFormEvents();

        document.getElementById(`${ResultBox.renderingMode}`).checked = true;
    }

    // ALGORITHM
    this.runAlgorithm = function () {
        const algorithm = new Algorithm(this.processList, this.algorithmName, this.quantum);
        const [pList, cpuBox, ioBox, readyQueue] = algorithm.run();
        const resultBox = new ResultBox();
        resultBox.render(pList, cpuBox, ioBox, readyQueue, this.algorithmName, this.quantum);
    }

    // SETUP
    this.setupControlEvents = function () {
        // add process btn click
        domEle.addProcessBtn.addEventListener('click', () => {
            this.processList.addNewProcess();
            this.formTable.render(this.processList);
        })

        // add cpu btn click
        domEle.requestBtn.addEventListener('click', () => {
            this.processList.addNewRequest();
            this.formTable.render(this.processList);
        })
        domEle.resetBtn.addEventListener('click', () => {
            ResultBox.clear();
            domEle.errorMessageArea.innerHTML = '';
            this.processList = new ProcessList(new Data().defaultProcessArr);
            this.formTable.render(this.processList);
        })
    }

    this.setupFormEvents = function () {
        domEle.inputTableForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // rendering mode
            const formData = new FormData(domEle.optionForm)
            ResultBox.renderingMode = formData.get('rendering-mode');

            //
            const errMessage = this.processList.getError();
            if (!errMessage) {
                // clear error message
                domEle.errorMessageArea.innerHTML = '';

                // run algorithm
                this.runAlgorithm();
            }
            else {
                // show error message
                domEle.errorMessageArea.innerHTML = `<h3>${errMessage}</h3>`;
                this.formTable.render(this.processList);
            }
        })

        domEle.algorithmSelect.addEventListener('change', (e) => {
            this.algorithmName = e.target.value;
            this.renderOption();
        })
        domEle.quantumInput.addEventListener('change', (e) => {
            this.quantum = e.target.value;
        })

        this.renderOption();
    }

    this.renderOption = function () {
        domEle.algorithmSelect.value = this.algorithmName;
        let quantumDisplayVal = (this.algorithmName === 'rr') ? 'block' : 'none';
        domEle.quantumContainer.style.display = quantumDisplayVal;
        domEle.quantumInput.value = this.quantum;
    }

}
