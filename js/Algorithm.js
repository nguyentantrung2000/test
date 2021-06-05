class Algorithm {
    maxCpuVal = 999999;
    maxTime = 1000;

    algorithmName = null;
    quantum = -1;

    // input process list
    pList = null;

    // working process list
    currentPList = null;

    // current cpu holding process
    currentP = null;

    // contain processes back from io
    tempQueue = [];

    // array of time
    timeline = [];

    // boxes
    cpuBox = [];
    ioBox = [];
    readyQueue = [];

    // counter
    ioRemainingObj = {};
    cpuRemainingTime = -1;
    quantumCounter = -1;

    constructor(pList, algorithmName, quantum = 2) {
        this.pList = pList;
        this.currentPList = this.pList.clone();

        // array of time || ex: [0, 1, 2, 3 ... 1000]
        this.timeline = this.getTimeline()

        // initiate boxes
        this.cpuBox = this.timeline.map(x => null);
        this.ioBox = this.timeline.map(x => []);

        // counter
        this.ioRemainingObj = this.initiateIoRemainingObj();

        //
        this.algorithmName = algorithmName;
        this.quantum = quantum;
    }

    // RUN ALGORITHM
    run() {
        // loop timeline
        this.timeline.forEach(time => {
            // ready queue
            this.solveReadyQueue(time)
            const checkSpecialConditionOfAlgorithm = this.checkSpecialConditionOfAlgorithm(this.readyQueue[time]);
            if (this.cpuRemainingTime > 0 && checkSpecialConditionOfAlgorithm) this.cpuBox[time] = this.currentP.name;
            else {

                // choose algorithm to run
                switch (this.algorithmName) {
                    case 'fcfs':
                        this.fcfs(time);
                        break;
                    case 'sjf':
                        this.sjf(time);
                        break;
                    case 'srtf':
                        this.srtf(time)
                        break;
                    case 'rr':
                        this.roundRobin(time)
                        break;
                }
            }
            this.solveIoBox(time)

            // decrease cpu, quantum counter
            if (this.cpuRemainingTime > 0) this.cpuRemainingTime--;
            if (this.quantumCounter > 0) this.quantumCounter--;

            //this.logDataAtTimePoint(time);
        })
        const lastCpuTime = this.getLastCpuTime();
        this.cpuBox.splice(lastCpuTime + 1);
        this.ioBox.splice(lastCpuTime + 1);
        this.readyQueue.splice(lastCpuTime + 1);

        // re assign process cpus and ios from processList
        this.currentPList.list.forEach(p => {
            const tempP = this.pList.getProcessByName(p.name);
            p.cpus = [...tempP.cpus];
            p.ios = [...tempP.ios];
        })

        this.currentPList.calculationTimes(this.cpuBox);

        // LOG DATA
        this.logFinalData();
        return [this.currentPList, this.cpuBox, this.ioBox, this.readyQueue];
    }

    // 4 ALGORITHMS
    fcfs(time) {
        // grant io for current process
        if (this.isGrantIo()) this.grantIo();

        if (this.readyQueue[time][0]) {
            // grant cpu for the top process of ready queue
            const p = this.readyQueue[time].shift();
            //['p1', 1]
            this.currentP = this.currentPList.getProcessByName(p[0]);
            this.cpuBox[time] = this.currentP.name;
            this.cpuRemainingTime = this.currentP.cpus.shift();
        }
    }

    sjf(time) {
        // grant io for current process
        if (this.isGrantIo()) this.grantIo();

        if (this.readyQueue[time][0]) {
            // grant cpu for min cpu process
            const [p] = this.readyQueue[time].splice(this.getMinCpuProcessIndexInReadyQueue(this.readyQueue[time]), 1);
            this.currentP = this.currentPList.getProcessByName(p[0]);
            this.cpuBox[time] = this.currentP.name;
            this.cpuRemainingTime = this.currentP.cpus.shift();
        }
    }

    srtf(time) {
        // grant io for current process
        if (this.isGrantIo()) this.grantIo();

        const grantCpu = () => {
            if (this.readyQueue[time][0]) {
                // find min cpu process name
                const [p] = this.readyQueue[time].splice(this.getMinCpuProcessIndexInReadyQueue(this.readyQueue[time]), 1);
                this.currentP = this.currentPList.getProcessByName(p[0]);
                this.cpuBox[time] = this.currentP.name;
                this.cpuRemainingTime = this.currentP.cpus.shift();
            }
        }

        if (this.cpuRemainingTime > 0) {
            const rest = this.cpuRemainingTime;
            this.currentP.cpus.unshift(rest);
            this.readyQueue[time].push([this.currentP.name, rest]);
            grantCpu();
        } else {
            grantCpu();

        }
    }

    roundRobin(time) {
        // grant io for current process 
        // when time = 0 => currentProcess = null => not grant IO 
        if (this.isGrantIo()) this.grantIo();

        // grant cpu for the top process of ready queue
        const grantCpuForTopProcess = () => {
            if (this.readyQueue[time][0]) {
                const p = this.readyQueue[time].shift();
                this.currentP = this.currentPList.getProcessByName(p[0]);
                this.cpuBox[time] = this.currentP.name;
                this.cpuRemainingTime = this.currentP.cpus.shift();
                this.quantumCounter = this.quantum;
            }
        }

        if (this.cpuRemainingTime > 0) {
            const rest = this.cpuRemainingTime;
            this.currentP.cpus.unshift(rest);
            this.currentP.cpuRequests.push(time);
            this.readyQueue[time].push([this.currentP.name, rest]);
            grantCpuForTopProcess();
        } else grantCpuForTopProcess();
    }

    checkSpecialConditionOfAlgorithm(readyQueueAtTime) {
        let roundRobin = (this.algorithmName != 'rr' || this.quantumCounter > 0);
        let srtf = true;
        if (this.algorithmName == 'srtf') {
            let minCpuProcess = this.getMinCpuProcessInReadyQueue(readyQueueAtTime, this.currentPList);
            srtf = (this.cpuRemainingTime <= minCpuProcess?.cpus[0]);
        }
        return (roundRobin && srtf);
    }

    // SOLVE IO BOX
    isGrantIo() {
        return (this.ioRemainingObj[this.currentP?.name] == -1 && this.cpuRemainingTime == 0 && this.currentP?.ios?.length > 0)
    }

    grantIo() {
        this.ioRemainingObj[this.currentP.name] = this.currentP.ios.shift() - 1;
    }

    solveIoBox(time) {
        for (let key in this.ioRemainingObj) {
            if (this.ioRemainingObj[key] > -1) {
                // add process to io box
                this.ioBox[time].push(key);

                // if done io => push the process to the end of ready queue
                if (this.ioRemainingObj[key] == 0) {
                    let tempP = this.currentPList.getProcessByName(key);

                    // save time process request cpu for calculating times later
                    tempP.cpuRequests.push(time + 1);

                    // "tempQueue" will be added to the end of ready queue at the next loop 
                    this.tempQueue.push([tempP.name, tempP.cpus[0]]);
                }

                // decrease io counter of process
                this.ioRemainingObj[key]--;
            }
        }

        this.tempQueue = this.tempQueue.sort((a, b) => a[0].localeCompare(b[0]));
    }

    // SOLVE READY QUEUE
    solveReadyQueue(time) {
        const arrivalPNames = this.currentPList.getProcessNamesByArrival(time);

        // clone previous ready queue 
        this.readyQueue[time] = [...this.readyQueue[time - 1] || [],];

        // add arrival process at the end of ready queue
        if (arrivalPNames.length > 0) this.readyQueue[time] = [...this.readyQueue[time], ...arrivalPNames];


        if (this.tempQueue.length > 0) {
            // add processes back from io at the end of ready queue
            this.readyQueue[time] = [...this.readyQueue[time], ...this.tempQueue];

            // clear tempQueue
            this.tempQueue.splice(0, this.tempQueue.length);
        }
    }

    getMinCpuProcessInReadyQueue(readyQueueAtTime) {
        let minProcess = null;
        let minCpuVal = this.maxCpuVal;
        readyQueueAtTime.forEach((p, index) => {
            let process = this.currentPList.getProcessByName(p[0]);
            if (process.cpus[0] < minCpuVal) {
                minProcess = process;
                minCpuVal = process.cpus[0];
            }
        })
        return minProcess;

    }

    getMinCpuProcessIndexInReadyQueue(readyQueueAtTime,) {
        let minCpuVal = this.maxCpuVal;
        let minCpuProcessIndex = 0;
        readyQueueAtTime.forEach((p, index) => {
            let process = this.currentPList.getProcessByName(p[0]);
            if (process.cpus[0] < minCpuVal) {
                minCpuVal = process.cpus[0];
                minCpuProcessIndex = index;
            }
        })
        return minCpuProcessIndex;

    }

    // OTHER FUNCTIONS
    initiateIoRemainingObj() {
        const result = {};
        this.currentPList.list.forEach(p => {
            result[p.name] = -1;
        })
        return result;
    }

    getLastCpuTime() {
        let counter = 0;
        for (let i = this.cpuBox.length - 1; i >= 0; i--) {
            if (this.cpuBox[i] != null) {
                counter = i;
                break;
            }
        }
        return counter;
    }

    getTimeline() {
        let timeline = [];
        for (let i = 0; i < this.maxTime; i++) timeline.push(i);
        return timeline;
    }

    logDataAtTimePoint(time) {
        console.log(`\n${time} ===========`);
        console.log('CPU\t\t', this.cpuBox[time]);
        console.log('IO\t\t', [...this.ioBox[time]]);
        console.log('QUEUE\t', [...this.readyQueue[time]]);
    }

    logFinalData() {
        console.log('\n--');
        console.log('CPU BOX\t\t\t', this.cpuBox);
        console.log('IO BOX\t\t\t', this.ioBox);
        console.log('QUEUE BOX\t\t', this.readyQueue);
        console.log('PROCESS LIST\t', this.currentPList);
    }
}