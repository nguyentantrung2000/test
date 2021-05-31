// HTML DOM ELM
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
            new Process('p2', 1, [2, 2, 3, 0, 0], [7, 7, 0, 0]),
            new Process('p3', 2, [13, 2, 0, 0, 0], [6, 0, 0, 0]),
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
            <td class="process-name">${item.name}</td>`;
            htmlStr += this.getNumberInputHtml(`arrival - ${index} `, item.arrival, 0) + this.getCpuAndIoColumn(item, index);
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
        const formData = new FormData(domEle.mainForm)
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
        this.pList.list = processes;
    }
}

class ResultBox {
    static renderingMode = Data.renderResultMode.playing
    static renderingGapTime = 200;

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
        this.algorithmName = algorithmName;
        this.quantum = quantum;
        // display result box
        this.timelineLength = cpuBox.length;
        domEle.resultBox.scrollLeft = 0;
        // algorithm name
        let algorithmHeadingVal = (this.algorithmName == 'rr') ? `${this.algorithmName.toUpperCase()} Algorithm (q=${this.quantum})` : `${this.algorithmName.toUpperCase()} Algorithm`;
        domEle.algorithmHeading.innerText = algorithmHeadingVal;

        if (ResultBox.renderingMode == Data.renderResultMode.immediate) this.renderResultImmediateMode(resultProcessList, cpuBox, ioBox, readyQueue);
        else this.renderResultPlayingMode(resultProcessList, cpuBox, ioBox, readyQueue);

        // display result box
        domEle.resultBox.style.display = 'block';
        setTimeout(() => {
            Helper.scrollToBottom();
        }, ResultBox.renderingGapTime);
    }

    renderResultImmediateMode(resultProcessList, cpuBox, ioBox, readyQueue) {
        this.resultTable.render(resultProcessList, cpuBox, ioBox, readyQueue, this.timelineLength);
        this.statisticTable.render(resultProcessList)
    }

    renderResultPlayingMode(resultPList, cpuBox, ioBox, readyQueue) {
        Helper.toggleControlBar(false);
        this.isRendering = true;

        // render result table
        this.renderResultTableInterval = setInterval(() => {
            this.resultTable.render(resultPList, cpuBox, ioBox, readyQueue, this.timelineLength, this.resultTableMaxTime);

            // scroll to current running cell
            this.scrollToCurrentRunningCell()

            if (this.resultTableMaxTime == cpuBox.length) this.onRenderResultFinish(resultPList);
            this.resultTableMaxTime++;
        }, ResultBox.renderingGapTime);
    }

    onRenderResultFinish(resultPList) {
        clearInterval(this.renderResultTableInterval)
        Helper.toggleControlBar(true);
        this.resultTableMaxTime = 0;
        this.timelineLength = 0;
        this.isRendering = false;
        setTimeout(() => {
            // statistic table
            this.statisticTable.render(resultPList);
            Helper.scrollToBottom();
        }, ResultBox.renderingGapTime);
    }

    scrollToCurrentRunningCell() {
        const runningCell = document.querySelector('table#result-table tbody td:last-child');
        const halfClientBoxWidth = domEle.resultBox.clientWidth / 2;
        const leftOffset = runningCell.offsetLeft - halfClientBoxWidth;
        if (leftOffset > 0) Helper.scrollHorizontal(domEle.resultBox, leftOffset)
    }
}

class ResultTable {
    timelineLength = 0;
    maxTime = 0;
    isRendering = false;

    constructor() {
    }

    render(resultProcessList, cpuBox, ioBox, readyQueue, timelineLength, maxTime = -1) {
        this.maxTime = maxTime;
        this.timelineLength = timelineLength;
        domEle.resultTableArea.innerHTML = this.getResultTableHtml(resultProcessList, cpuBox, ioBox, readyQueue, maxTime);
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
        let readyQueueHtml = this.getReadyQueueHtml(pList, readyQueue);
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
        const html = Helper.addSpacing(Helper.convertArrayToString(cpuTrArr));
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
        const html = Helper.addSpacing(Helper.convertArrayToString(trArr));
        return html;
    }

    drawTableCell(level, isCurrent, showLabel, rowP, pColor, time = null, isEmpty = false, prevPname = null, nextPname = null) {
        let content = (showLabel && isCurrent) ? rowP.name : '';
        let htmlClass = this.getTableCellHtmlClasses(level, time, time == rowP.arrival, showLabel, isCurrent, isEmpty, pColor[rowP.name], this.isWaitingForCpu(time, rowP.cpuRequestHistories), prevPname, nextPname)
        return `<td class="${htmlClass}">${content}</td> `;
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
        htmlClass += this.getHtmlHighlightClassIfPassCondition(time);
        return htmlClass;
    }

    getHtmlHighlightClassIfPassCondition(time) {
        console.log('highlight');
        const htmlClass = (time == this.maxTime - 1 && time < this.timelineLength - 1) ? ' border-solid-right-highlight' : '';
        return htmlClass;
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

    getReadyQueueHtml(pList, readyQueue) {
        // create 3 row
        let trHtml = '';
        let tdArr = readyQueue.map((subQueue, subIndex) => {
            let queueTdHtml = '';
            for (let i = 0; i < pList.list.length; i++) {
                const value = subQueue[i] || '';
                queueTdHtml += `<tr><td >${value}</td></tr>`;
            }
            let queueTrHtml = `<table>${queueTdHtml}</table>`;
            const htmlClass = this.getHtmlHighlightClassIfPassCondition(subIndex)
            return `<td  class="${htmlClass}">${queueTrHtml}</td> `;
        })
        let tdHtml = Helper.convertArrayToString(tdArr);
        trHtml = `
            <tr id="ready-queue" class="level-row">
                <th   class="level-name-cell" scope="row" rowspan="${pList.list.length}">Ready Queue</th>
                <td></td>
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
    static addSpacing(value, n = 1) {
        const html = `${value}${'<tr ><td colspan="1000"><br/></td></tr><tr class="tr-spacing"><td colspan="1000"><br/></td></tr>'.repeat(n)}`
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

class Main {

    // initiate values
    formTable = new FormTable();
    processList = new ProcessList(new Data().defaultProcessArr);
    algorithmName = 'fcfs';
    quantum = 2;

    // MAIN CODE HERE =============
    constructor() {
        this.formTable.render(this.processList);
        this.setupControlEvents();
        this.setupFormEvents();
    }

    // ALGORITHM
    runAlgorithm() {
        const algorithm = new Algorithm(this.processList, this.algorithmName, this.quantum);
        const [pList, cpuBox, ioBox, readyQueue] = algorithm.run();
        const resultBox = new ResultBox();
        resultBox.render(pList, cpuBox, ioBox, readyQueue, this.algorithmName, this.quantum);
    }

    // SETUP
    setupControlEvents() {
        // add process btn click
        domEle.addProcessBtn.addEventListener('click', () => {
            this.processList.addNewProcess();
            this.formTable.render(this.processList);
        })

        // add cpu btn click
        domEle.requestBtn.addEventListener('click', () => {
            this.processList.addNewRequest();
            this.formTable.render(processList);
        })
        domEle.resetBtn.addEventListener('click', () => {
            domEle.resultTableArea.innerHTML = '';
            domEle.statisticTableArea.innerHTML = '';
            domEle.algorithmHeading.innerHTML = '';
            domEle.errorMessageArea.innerHTML = '';
            this.processList = new ProcessList(new Data().defaultProcessArr);
            this.formTable.render();
        })
    }

    setupFormEvents() {
        domEle.mainForm.addEventListener('submit', (e) => {
            e.preventDefault();
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


    renderOption() {
        domEle.algorithmSelect.value = this.algorithmName;
        let quantumDisplayVal = (this.algorithmName === 'rr') ? 'block' : 'none';
        domEle.quantumContainer.style.display = quantumDisplayVal;
        domEle.quantumInput.value = this.quantum;
    }
}

// MAIN
new Main();