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
            return new Process(p.name, p.arrival, p.cpus, p.ios, p.cpuRequests);
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

    this.calculationTimes = function (cpuBox) {
        this.list.forEach(process => process.calculateTimes(cpuBox))
        this.calculateAverageTimes();
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
            if (lastNonZeroCpuIndex - lastNonZeroIoIndex > 1 || this.isZeroValueInTheMiddle(p.cpus, p.ios, lastNonZeroIoIndex + 1)) {
                err = `Process "${p.name}" must not have empty value in the middle`;
                break;
            }
        }
        return err;
    }

    this.isZeroValueInTheMiddle = function (arr1, arr2, n) {
        for (let i = 0; i < n; i++) {
            if (arr1[i] == 0 || arr2[i] == 0) return true;
        }
        return false;
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

function Process(name, arrival, cpus, ios, cpuRequests = null) {
    this.name = name;
    this.arrival = arrival;
    this.cpuRequests = cpuRequests || [arrival];
    this.cpus = cpus.map(val => {
        let n = Number.parseInt(val);
        return Number.isNaN(n) ? 0 : n;
    });
    this.ios = ios.map(val => {
        let n = Number.parseInt(val);
        return Number.isNaN(n) ? 0 : n;
    });

    // ADD REQUEST
    this.addNewRequest = function () {
        this.cpus.push(0);
        this.ios.push(0);
    }

    // CALCULATE TIMES
    this.calculateTimes = function (cpuBox) {
        this.cpuRequestHistories = this.getCpuRequestHistories(cpuBox);
        this.waitingTime = this.getProcessWaitingTime();
        this.responseTime = this.cpuRequestHistories[0][1] - this.cpuRequestHistories[0][0];
        this.turnAroundTime = this.getProcessTurnAroundTime(cpuBox);
    }

    this.getCpuRequestHistories = function (cpuBox) {
        return this.cpuRequests.map(request => {
            const grantedTime = this.getFirstGrantedCpuTimeOfProcess(cpuBox, request);
            return [request, grantedTime];
        })
    }

    this.getProcessWaitingTime = function () {
        return this.cpuRequestHistories.reduce((prev, current) => {
            return prev + (current[1] - current[0]);
        }, 0);
    }

    this.getProcessTurnAroundTime = function (cpuBox) {
        const endCpuTime = this.getEndCpuTimeOfProcess(cpuBox);
        const firstGranted = this.getFirstGrantedCpuTimeOfProcess(cpuBox);
        return endCpuTime - firstGranted + this.responseTime + 1;
    }

    this.getFirstGrantedCpuTimeOfProcess = function (cpuBox, start = 0) {
        let index = -1;
        for (let i = start; i < cpuBox.length; i++) {
            if (cpuBox[i] == this.name) {
                index = i
                break;
            }
        }
        return index;
    }

    this.getEndCpuTimeOfProcess = function (cpuBox) {
        let index = -1;
        for (let key = cpuBox.length - 1; key >= 0; key--) {
            if (cpuBox[key] == this.name) {
                index = key
                break;
            }
        }
        return index;
    }

}
