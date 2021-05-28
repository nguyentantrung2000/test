// ALGORITHM
function runAlgorithm() {
    const currentProcessList = processList.clone();
    let currentProcess = null;

    // contain processes back from io
    const tempQueue = [];

    // array of time
    const timeline = getTimeline(50);

    // initiate boxes
    const cpuBox = timeline.map(x => null);
    const ioBox = timeline.map(x => []);
    const readyQueue = [];

    // counter
    let ioRemainingObj = initiateIoRemainingObj(currentProcessList);
    let cpuRemainingTime = -1;


    // loop timeline
    timeline.forEach(time => {
        // log time
        console.log(`\nAt ${time} ===========`);

        // ready queue
        solveReadyQueue(time, readyQueue, tempQueue, currentProcessList)

        if (cpuRemainingTime > 0) cpuBox[time] = currentProcess.name;
        else {
            // run algorithm
            switch (algo) {
                case 'fcfs':
                    [cpuRemainingTime, currentProcess] = fcfs(time, currentProcess, ioRemainingObj, readyQueue, cpuBox, cpuRemainingTime, currentProcessList)
                    break;
            }
        }
        solveIoBox(time, ioBox, ioRemainingObj, tempQueue, currentProcessList)
        logData(cpuBox, ioBox, readyQueue, time);

        // decrease cpu counter
        if (cpuRemainingTime > 0) cpuRemainingTime--;
    })
}

function fcfs(time, currentProcess, ioRemainingObj, readyQueue, cpuBox, cpuRemainingTime, currentProcessList) {
    // grant io for current process
    if (currentProcess?.ios?.length > 0) grantIo(ioRemainingObj, currentProcess);

    // grant cpu for the top process of ready queue
    if (readyQueue[time][0]) {
        const pName = readyQueue[time].shift();
        currentProcess = currentProcessList.getProcessByName(pName);
        cpuBox[time] = currentProcess.name;
        cpuRemainingTime = currentProcess.cpus.shift();
    }
    return [cpuRemainingTime, currentProcess];
}

function grantIo(ioRemainingObj, process) {
    ioRemainingObj[process.name] = process.ios.shift() - 1;
}

function solveIoBox(time, ioBox, ioRemainingObj, tempQueue, currentProcessList) {
    for (let key in ioRemainingObj) {
        if (ioRemainingObj[key] > -1) {
            // add process to io box
            ioBox[time].push(key);

            // if done io => push the process to the end of ready queue
            if (ioRemainingObj[key] == 0) {
                let tempP = currentProcessList.getProcessByName(key);
                if (tempP.cpus.length > 0) {
                    // "tempQueue" will be added to the end of ready queue at the next loop 
                    tempQueue.push(key);
                }
            }

            // decrease io counter
            ioRemainingObj[key]--;
        }
    }
}

function solveReadyQueue(time, readyQueue, tempQueue, currentProcessList) {
    const arrivalProcess = currentProcessList.getProcessByArrival(time)[0];

    // clone previous ready queue 
    readyQueue[time] = [...readyQueue[time - 1] || [],];

    // add arrival process at the end of ready queue
    if (arrivalProcess) readyQueue[time].push(arrivalProcess.name);

    if (tempQueue.length > 0) {
        // add processes back from io at the end of ready queue
        readyQueue[time] = [...readyQueue[time], ...tempQueue];

        // clear tempQueue
        tempQueue.splice(0, tempQueue.length);
    }
}

function initiateIoRemainingObj(pList) {
    const result = {};
    pList.list.forEach(p => {
        result[p.name] = -1;
    })
    return result;
}

// SUPPORT FUNCTIONS
function getTimeline(max) {
    let timeline = [];
    for (let i = 0; i < max; i++) {
        timeline.push(i);
    }
    return timeline;
}

function logData(cpuBox, ioBox, readyQueue, time) {
    console.log('CPU\t\t', cpuBox[time]);
    console.log('IO\t\t', [...ioBox[time]]);
    console.log('QUEUE\t', [...readyQueue[time]]);
    //console.log('CPU BOX\t\t', cpuBox);
    //console.log('IO BOX\t\t', ioBox);
    //console.log('QUEUE BOX\t\t', readyQueue);
}