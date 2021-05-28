// ALGORITHM
function runAlgorithm() {
    const currentProcessList = processList.clone();
    // initiate values
    const tempQueue = [];
    const timeline = getTimeline(100);
    const cpuBox = timeline.map(x => null);
    const ioBox = timeline.map(x => []);
    const readyQueue = [];

    let cpuRemainTime = -1;
    let ioRemainObject = {};
    currentProcessList.list.forEach(p => {
        ioRemainObject[p.name] = -1;
    })
    let currentProcess = null;

    // loop timeline
    timeline.forEach(time => {
        console.log(`\nAt ${time} ===========`);

        // ready queue
        solveReadyQueue(time, readyQueue, tempQueue, currentProcessList)

        if (cpuRemainTime > 0) {
            cpuBox[time] = currentProcess.name;
        } else {
            // run algorithm
            switch (algo) {
                case 'fcfs':
                    [cpuRemainTime, currentProcess] = fcfs(time, currentProcess, ioRemainObject, readyQueue, cpuBox, cpuRemainTime, currentProcessList)
                    break;
            }

        }

        // solve io
        solveIoBox(time, ioBox, ioRemainObject, tempQueue, currentProcessList)

        logData(cpuBox, ioBox, readyQueue, time);
        if (cpuRemainTime > 0) cpuRemainTime--;
    })
}

function fcfs(time, currentProcess, ioRemainObject, readyQueue, cpuBox, cpuRemainTime, currentProcessList) {
    // grant io for current process
    if (currentProcess?.ios?.length > 0) grantIo(ioRemainObject, currentProcess);

    // grant new
    let topProcess = readyQueue[time][0];
    if (topProcess) {
        const pName = readyQueue[time].shift();
        currentProcess = currentProcessList.getProcessByName(pName);
        cpuBox[time] = currentProcess.name;
        cpuRemainTime = currentProcess.cpus.shift();
    }
    return [cpuRemainTime, currentProcess];
}


function grantIo(ioRemainObject, process) {
    ioRemainObject[process.name] = process.ios.shift() - 1;
}

function solveIoBox(time, ioBox, ioRemainObject, tempQueue, currentProcessList) {
    for (let key in ioRemainObject) {
        if (ioRemainObject[key] > -1) {
            ioBox[time].push(key);
            if (ioRemainObject[key] == 0) {
                let tempP = currentProcessList.getProcessByName(key);
                if (tempP.cpus.length > 0) {
                    tempQueue.push(key);
                }
            }
            ioRemainObject[key]--;
        }
    }
}

function solveReadyQueue(time, readyQueue, tempQueue, currentProcessList) {
    const arrivalProcess = currentProcessList.getProcessByArrival(time)[0];
    // solve arrival process (READY QUEUE)
    if (time == 0) readyQueue[time] = [arrivalProcess.name];
    else {
        readyQueue[time] = [...readyQueue[time - 1],];
        if (arrivalProcess) {
            readyQueue[time].push(arrivalProcess.name);
        }
        if (tempQueue.length > 0) {
            readyQueue[time] = [...readyQueue[time], ...tempQueue];
            tempQueue.splice(0, tempQueue.length);
        }
    }
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