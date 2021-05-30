// DEFINE OBJECTS
function ProcessList(list) {
    this.list = list;

    this.add = function (process) {
        this.list.push(process);
    }

    this.addNewProcess = function () {
        let process1 = this.list[0];
        let cpus = process1.cpus.map(item => 0);
        let ios = cpus.slice(0, cpus.length - 1);
        let process = new Process(`p${this.list.length + 1}`, this.getLastArrivalTime() + 1, cpus, ios);
        this.add(process);
    }

    this.addNewRequest = function () {
        this.list.forEach(item => {
            item.addNewRequest();
        })
    }

    this.clone = function () {
        let plainObject = JSON.parse(JSON.stringify(this));
        let processes = plainObject.list.map(p => {
            return new Process(p.name, p.arrival, p.cpus, p.ios);
        })
        let processList = new ProcessList(processes);
        return processList;
    }

    this.getProcessByArrival = function (time) {
        return this.list.filter(item => {
            return item.arrival == time;
        })
    }

    this.getProcessByName = function (name) {
        return this.list.filter(item => item.name == name)[0];
    }

    this.calculateAverageTimes = function () {
        let totalProcess = this.list.length;
        let totalResponseTime = 0;
        let totalWaitingTime = 0;
        let totalTurnAroundTime = 0;
        this.list.forEach(p => {
            totalResponseTime += p.responseTime;
            totalWaitingTime += p.waitingTime;
            totalTurnAroundTime += p.turnAroundTime;
        })
        this.avgResponseTime = totalResponseTime / totalProcess;
        this.avgWaitingTime = totalWaitingTime / totalProcess;
        this.avgTurnAroundTime = totalTurnAroundTime / totalProcess;
    }

    this.getError = function () {
        let err = null;
        for (let p of this.list) {
            const lastNonZeroCpuIndex = this.getLastNonZeroValIndex(p.cpus);
            const lastNonZeroIoIndex = this.getLastNonZeroValIndex(p.ios);

            // 1. cpus[0], cpus[1], ios[0] > 0
            if (lastNonZeroCpuIndex < 1) {
                err = `Process "${p.name}" values required`;
                break;
            }

            // 2. end cpu
            if (lastNonZeroCpuIndex <= lastNonZeroIoIndex) {
                err = `Process "${p.name}" must end with cpu`;
                break;
            }

            // 3. no 0 between
            if (lastNonZeroCpuIndex - lastNonZeroIoIndex > 1) {
                err = `Process "${p.name}" must not have empty value in the middle`;
                break;
            }


        }
        return err;
    }

    this.getLastNonZeroValIndex = function (arr) {
        for (let i = arr.length - 1; i >= 0; i--) {
            if (arr[i] != 0) return i;
        }
        return -1;
    }

    this.getLastArrivalTime = function () {
        let max = 0;
        this.list.forEach(p => {
            if (p.arrival > max)
                max = p.arrival;
        })
        return max;
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
