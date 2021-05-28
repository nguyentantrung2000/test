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
        let process = new Process(`p${this.list.length + 1}`, this.list.length, cpus, ios);
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
