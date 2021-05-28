// MAIN
function Data() {
    this.processData = [
        new Process('p1', 0, [3, 4], [4]),
        new Process('p2', 1, [2, 2], [2]),
        new Process('p3', 2, [1, 3], [1]),
    ]
}
//let processData = [
//new Process('p1', 0, [3, 4], [4]),
//new Process('p2', 1, [2, 2], [2]),
//new Process('p3', 2, [1, 3], [1]),
//]

// initiate values
var processList = new ProcessList(new Data().processData);
var algo = 'fcfs';
var quantum = 2;

main();
function main() {
    renderTable();
    setupControlEvents();
    setupForm();
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
        renderTable(processList);
    })

    // add cpu btn click
    requestBtn.addEventListener('click', () => {
        processList.addNewRequest();
        renderTable(processList);
    })
    resetBtn.addEventListener('click', () => {
        let r = confirm('Do you want to reset?');
        if (r) {
            processList = new ProcessList(new Data().processData);
            renderTable();
        }
    })
}

function setupForm() {
    let algorithmSelect = document.getElementById('algorithm-select');
    let quantumInput = document.getElementById('quantum-input');
    let mainForm = document.getElementById('main-form');
    mainForm.addEventListener('submit', (e) => {
        e.preventDefault();
        runAlgorithm(processList);
    })

    algorithmSelect.addEventListener('change', (e) => {
        algo = e.target.value;
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
        let arrival = data[0][1];
        let cpus = [];
        let ios = [];
        data.slice(1).forEach(item => {
            if (item[0].indexOf('cpu') > -1) cpus.push(item[1]);
            else ios.push(item[1]);
        })
        return new Process(`p${index + 1} `, arrival, cpus, ios);
    })
    processList.list = processes;

}

// HTML GENERATES
function renderOption() {
    let algorithmSelect = document.getElementById('algorithm-select');
    let quantumContainer = document.getElementById('quantum-container');
    let quantumInput = document.getElementById('quantum-input');
    algorithmSelect.value = algo;
    let quantumDisplayVal = (algo === 'rr') ? 'block' : 'none';
    quantumContainer.style.display = quantumDisplayVal;
    quantumInput.value = quantum;
}

function renderTable() {
    let tableArea = document.getElementById('table-area');
    tableArea.innerHTML = getTableHtml();
    setupTableEvents();

}
function getTableHtml() {
    let tableHtml = `<table table class="form-table" > ${getTHeadHtml()} ${getTBodyHtml()}</table > `;
    return tableHtml;
}
function getTHeadHtml() {
    let htmlStr = '';
    let process1 = processList.list[0];
    for (let i = 0; i < process1.ios.length; i++) {
        htmlStr += `<th th > IO</th > <th>CPU</th>`;
    }

    let tHead = `<thead thead >
            <tr>
                <th scope="col">#</th>
                <th>Process</th>
                <th>Arrival</th>
                <th>CPU</th>
                            ${htmlStr}
            </tr>
                    </thead > `;
    return tHead;

}
function getTBodyHtml() {
    let rows = '';
    processList.list.forEach((item, index) => {
        let htmlStr = ` <th th scope = "row" > ${index + 1}</th >
            <td class="process-name">${item.name}</td> `;
        htmlStr += getNumberInputHtml(`arrival - ${index} `, item.arrival, 0) + getCpuAndIoColumn(item, index);
        rows += `<tr tr > ${htmlStr}</tr > `;
    })

    let tBody = ` <tbody tbody > ${rows}</tbody > `;
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