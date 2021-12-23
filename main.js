let algorithm = {
    FCFS: 0,
    SJF: 1,
    SRTF: 2,
    RR: 3,
}

// DEFINE OBJECTS
function ProcessList(list) {
    console.log(list);
    this.list = list;

    this.add = function (process) {
        this.list.push(process);
    }

    this.addNewProcess = function () {
        let process1 = this.list[0];
        let cpus = process1.cpus.map(item => 0);
        let ios = cpus.slice(0, cpus.length - 1);
        let process = new Process(`p${this.list.length + 1}`, this.list.length, cpus, ios);
        this.add(process);
    }

    this.addNewRequest = function () {
        this.list.forEach(item => {
            item.addNewRequest();
        })
    }
}

function Process(name, arrival, cpus, ios) {
    this.name = name;
    this.arrival = arrival;
    this.cpus = cpus.map(val => {
        let n = Number.parseInt(val);
        return Number.isNaN(n) ? 0 : n;
    });
    this.ios = ios.map(val => {
        let n = Number.parseInt(val);
        return Number.isNaN(n) ? 0 : n;
    });

    this.addNewRequest = function () {
        this.cpus.push(0);
        this.ios.push(0);
    }
}

// MAIN
let processData = [
    new Process('p1', 0, [3, 4], [4]),
    new Process('p2', 1, [2, 2], [2]),
    new Process('p3', 2, [1, 3], [1]),
]
var processList = new ProcessList(processData.slice(0));
main();
function main() {
    renderTable();
    setupControlEvents();
    setupForm();
}

// ALGORITHM
function runAlgorithm() {
    alert('run algorithm')
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
    let addCpuBtn = document.getElementById('add-cpu-btn');
    let resetBtn = document.getElementById('reset-btn');
    // add process btn click
    addProcessBtn.addEventListener('click', () => {
        processList.addNewProcess();
        renderTable(processList);
    })

    // add cpu btn click
    addCpuBtn.addEventListener('click', () => {
        processList.addNewRequest();
        renderTable(processList);
    })
    resetBtn.addEventListener('click', () => {
        location.reload();
    })
}

function setupForm() {
    let mainForm = document.getElementById('main-form');
    mainForm.addEventListener('submit', (e) => {
        e.preventDefault();
        runAlgorithm(processList);
    })
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
        let arrival = data[0][1];
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

// HTML GENERATES
function renderTable() {
    let tableArea = document.getElementById('table-area');
    tableArea.innerHTML = getTableHtml();
    setupTableEvents();

}
function getTableHtml() {
    let tableHtml = `<table class="form-table">${getTHeadHtml()}${getTBodyHtml()}</table>`;
    return tableHtml;
}
function getTHeadHtml() {
    let htmlStr = '';
    let process1 = processList.list[0];
    for (let i = 0; i < process1.ios.length; i++) {
        htmlStr += `<th>IO</th><th>CPU</th>`;
    }

    let tHead = `<thead>
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
function getTBodyHtml() {
    let rows = '';
    processList.list.forEach((item, index) => {
        let htmlStr = ` <th scope="row">${index + 1}</th>
                            <td class="process-name">${item.name}</td> `;
        let dataStr = getNumberInputHtml(`arrival-${index}`, item.arrival, 0);
        item.cpus.forEach((cpuVal, cpuIndex) => {

            cpuVal = cpuVal || '';
            dataStr += getNumberInputHtml(`cpu-${index}-${cpuIndex}`, cpuVal);
            if (cpuIndex < item.cpus.length - 1) {
                let ioVal = item.ios[cpuIndex] || '';
                dataStr += getNumberInputHtml(`io-${index}-${cpuIndex}`, ioVal);
            }
        })
        htmlStr += dataStr;
        rows += `<tr>${htmlStr}</tr>`;
    })

    let tBody = ` <tbody> ${rows}</tbody> `;
    return tBody;
}

function getNumberInputHtml(name, value, min = 1) {
    return `<td><input class="table-input" name="${name}" value="${value}" type="number" min="${min}" /></td>`;
}
