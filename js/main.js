// ALGORITHM
function runAlgorithm() {
    const maxTime = 1000;
    const currentProcessList = processList.clone();
    let currentProcess = null;

    // contain processes back from io
    const tempQueue = [];

    // array of time
    const timeline = getTimeline(maxTime);

    // initiate boxes
    const cpuBox = timeline.map(x => null);
    const ioBox = timeline.map(x => []);
    const readyQueue = [];

    // counter
    let ioRemainingObj = initiateIoRemainingObj(currentProcessList);
    let cpuRemainingTime = -1;
    let quantumCounter = -1;


    // loop timeline
    timeline.forEach(time => {
        // log time
        //console.log(`\n${time} ===========`);

        // ready queue
        solveReadyQueue(time, readyQueue, tempQueue, currentProcessList)
        if (cpuRemainingTime > 0 && checkSpecialConditionOfAlgorithm(quantumCounter, readyQueue[time], cpuRemainingTime, currentProcessList)) {
            cpuBox[time] = currentProcess.name;
        }
        else {
            // run algorithm
            switch (algo) {
                case 'fcfs':
                    [cpuRemainingTime, currentProcess] = fcfs(time, currentProcess, ioRemainingObj, readyQueue, cpuBox, cpuRemainingTime, currentProcessList)
                    break;
                case 'sjf':
                    [cpuRemainingTime, currentProcess] = sjf(time, currentProcess, ioRemainingObj, readyQueue, cpuBox, cpuRemainingTime, currentProcessList)
                    break;
                case 'srtf':
                    [cpuRemainingTime, currentProcess] = srtf(time, currentProcess, ioRemainingObj, readyQueue, cpuBox, cpuRemainingTime, currentProcessList)
                    break;
                case 'rr':
                    [cpuRemainingTime, currentProcess, quantumCounter] = roundRobin(time, currentProcess, ioRemainingObj, readyQueue, cpuBox, cpuRemainingTime, currentProcessList, quantumCounter)
                    break;
            }
        }
        solveIoBox(time, ioBox, ioRemainingObj, tempQueue, currentProcessList, quantumCounter)
        //logDataAtTimePoint(cpuBox, ioBox, readyQueue, time);

        // decrease cpu counter
        if (cpuRemainingTime > 0) cpuRemainingTime--;
        if (quantumCounter > 0) quantumCounter--;
    })
    lastCpuTime = getLastCpuTime(cpuBox, maxTime);
    cpuBox.splice(lastCpuTime + 1, maxTime);
    ioBox.splice(lastCpuTime + 1, maxTime);
    readyQueue.splice(lastCpuTime + 1, maxTime);

    // calculation
    const resultProcessList = processList.clone();
    resultProcessList.list.forEach(process => {
        process.waitingTime = getProcessWaitingTime(cpuBox, process);
        process.responseTime = getProcessResponseTime(cpuBox, process);
        process.turnAroundTime = getProcessTurnAroundTime(cpuBox, process.responseTime, process);
    })
    resultProcessList.calculateAverageTimes();

    // LOG DATA
    //console.log('\n--');
    //logBoxData(cpuBox, ioBox, readyQueue);
    //console.log('PROCESS LIST\t', resultProcessList);
    renderResult(resultProcessList, cpuBox, ioBox, readyQueue);
}

function checkSpecialConditionOfAlgorithm(quantumCounter, readyQueueAtTime, cpuRemainingTime, currentProcessList) {
    let roundRobin = (algo != 'rr' || quantumCounter > 0);
    let minCpuProcess = getMinCpuProcessInReadyQueue(readyQueueAtTime, currentProcessList);
    let srtf = (algo != 'srtf' || cpuRemainingTime <= minCpuProcess?.cpus[0]);
    return (roundRobin && srtf);
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

function sjf(time, currentProcess, ioRemainingObj, readyQueue, cpuBox, cpuRemainingTime, currentProcessList) {
    // grant io for current process
    if (currentProcess?.ios?.length > 0) grantIo(ioRemainingObj, currentProcess);

    if (readyQueue[time][0]) {
        // find min cpu process name
        const [pName] = readyQueue[time].splice(getMinCpuProcessIndexInReadyQueue(readyQueue[time], currentProcessList), 1);
        currentProcess = currentProcessList.getProcessByName(pName);
        cpuBox[time] = currentProcess.name;
        cpuRemainingTime = currentProcess.cpus.shift();
    }
    return [cpuRemainingTime, currentProcess];
}

function srtf(time, currentProcess, ioRemainingObj, readyQueue, cpuBox, cpuRemainingTime, currentProcessList) {
    // grant io for current process
    if (cpuRemainingTime == 0 && currentProcess?.ios?.length > 0) grantIo(ioRemainingObj, currentProcess);

    const grantCpu = () => {
        if (readyQueue[time][0]) {
            // find min cpu process name
            const [pName] = readyQueue[time].splice(getMinCpuProcessIndexInReadyQueue(readyQueue[time], currentProcessList), 1);
            currentProcess = currentProcessList.getProcessByName(pName);
            cpuBox[time] = currentProcess.name;
            cpuRemainingTime = currentProcess.cpus.shift();
        }
    }

    if (cpuRemainingTime > 0) {
        const rest = cpuRemainingTime;
        currentProcess.cpus.unshift(rest);
        readyQueue[time].push(currentProcess.name);
        grantCpu();
    } else {
        grantCpu();

    }
    return [cpuRemainingTime, currentProcess];
}

function roundRobin(time, currentProcess, ioRemainingObj, readyQueue, cpuBox, cpuRemainingTime, currentProcessList, quantumCounter) {
    // grant io for current process 
    // when time = 0 => currentProcess = null => not grant IO 
    if ((algo != 'rr' || cpuRemainingTime == 0) && currentProcess?.ios?.length > 0) grantIo(ioRemainingObj, currentProcess);

    // grant cpu for the top process of ready queue
    const grantCpuForTopProcess = () => {
        if (readyQueue[time][0]) {
            const pName = readyQueue[time].shift();
            currentProcess = currentProcessList.getProcessByName(pName);
            cpuBox[time] = currentProcess.name;
            cpuRemainingTime = currentProcess.cpus.shift();
            quantumCounter = quantum;
        }
    }

    if (cpuRemainingTime > 0) {
        const rest = cpuRemainingTime;
        currentProcess.cpus.unshift(rest);
        readyQueue[time].push(currentProcess.name);
        grantCpuForTopProcess();
    } else grantCpuForTopProcess();

    return [cpuRemainingTime, currentProcess, quantumCounter];
}

function getMinCpuProcessInReadyQueue(readyQueueAtTime, currentProcessList) {
    let minProcess = null;
    let minCpuVal = 1000;
    readyQueueAtTime.forEach((pName, index) => {
        let process = currentProcessList.getProcessByName(pName);
        if (process.cpus[0] < minCpuVal) {
            minProcess = process;
            minCpuVal = process.cpus[0];
        }
    })
    return minProcess;

}
function getMinCpuProcessIndexInReadyQueue(readyQueueAtTime, currentProcessList) {
    let minCpuVal = 1000;
    let minCpuProcessIndex = 0;
    readyQueueAtTime.forEach((pName, index) => {
        let process = currentProcessList.getProcessByName(pName);
        if (process.cpus[0] < minCpuVal) {
            minCpuVal = process.cpus[0];
            minCpuProcessIndex = index;
        }
    })
    return minCpuProcessIndex;

}

// ALGORITHM FUNCTIONS
function grantIo(ioRemainingObj, process) {
    ioRemainingObj[process.name] = process.ios.shift() - 1;
}

function solveIoBox(time, ioBox, ioRemainingObj, tempQueue, currentProcessList, quantumCounter) {
    //if (algo != 'rr' || quantumCounter == 0) {
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
    //}
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

function getLastCpuTime(cpuBox) {
    let counter = 0;
    for (let i = cpuBox.length - 1; i >= 0; i--) {
        if (cpuBox[i] != null) {
            counter = i;
            break;
        }
    }
    return counter;
}

//  RESULT CALCULATION
function getProcessResponseTime(cpuBox, process) {
    return getFirstGrantedCpuTimeOfProcess(cpuBox, process.name) - process.arrival;
}

function getProcessWaitingTime(cpuBox, process) {
    let timePoints = [];
    let continuos = 0;
    const firstGrantedProcessNames = [];
    for (let index in cpuBox) {
        index = Number.parseInt(index)
        if (index > 0 && cpuBox[index - 1] == process.name) {
            if (cpuBox[index] == process.name) {
                if (index == cpuBox.length - 1)
                    timePoints.push(index - 1 - continuos);
                continuos++;
            } else {
                let calculationTime = index;
                if (firstGrantedProcessNames.includes(process.name)) {
                    calculationTime -= continuos + 1;
                } else firstGrantedProcessNames.push(process.name);
                timePoints.push(calculationTime);
                continuos = 0;
            }
        }

    }
    let result = 0;
    timePoints.forEach((val, index) => {
        if (index > 0 && index % 2 == 1) {
            result += val - timePoints[index - 1];
        }
    })

    const waitingTime = result + getProcessResponseTime(cpuBox, process);
    return waitingTime;
}

function getProcessTurnAroundTime(cpuBox, responseTime, process) {
    const endCpuTime = getEndCpuTimeOfProcess(cpuBox, process.name);
    const firstGranted = getFirstGrantedCpuTimeOfProcess(cpuBox, process.name);
    console.log('\naround time p\t', process.name);
    console.log('end\t\t\t\t', endCpuTime);
    console.log('first\t\t\t', firstGranted);
    console.log('res\t\t\t\t', responseTime);
    return endCpuTime - firstGranted + responseTime + 1;
}

function getFirstGrantedCpuTimeOfProcess(cpuBox, pName) {
    let index = -1;
    for (let key in cpuBox) {
        if (cpuBox[key] == pName) {
            index = key
            break;
        }
    }
    return index;
}

function getEndCpuTimeOfProcess(cpuBox, pName) {
    let index = -1;
    for (let key = cpuBox.length - 1; key >= 0; key--) {
        if (cpuBox[key] == pName) {
            index = key
            break;
        }
    }
    return index;
}

// LOG
function logDataAtTimePoint(cpuBox, ioBox, readyQueue, time) {
    console.log('CPU\t\t', cpuBox[time]);
    console.log('IO\t\t', [...ioBox[time]]);
    console.log('QUEUE\t', [...readyQueue[time]]);
}

function logBoxData(cpuBox, ioBox, readyQueue) {
    console.log('CPU BOX\t\t\t', cpuBox);
    console.log('IO BOX\t\t\t', ioBox);
    console.log('QUEUE BOX\t\t', readyQueue);
}