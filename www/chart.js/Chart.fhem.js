async function createChart(logrep, from, to, canvas, specs, chartUrl, callback) {
    //load chart
    const chartJSON = await loadChartFromUrl(chartUrl).catch(err => {
        console.log(err)
    });

    //set start and end time for axis
    setTimePeriod(chartJSON.options, from, to);

    //register callback
    if (!chartJSON.options.animation) chartJSON.options.animation = {};
    chartJSON.options.animation.onComplete = callback;

    chartJSON.fhem = {
        "logrep": logrep,
        "from": from,
        "to": to,
        "canvas": canvas,
        "specs": specs,
        "chartUrl": chartUrl,
        "callback": callback
    };

    await loadAllData(logrep, specs, from, to, chartJSON.data).catch(err => {
        console.log(err)
    });
    const ctx = document.getElementById(canvas).getContext('2d');

    if (!window.fhemChartjs) window.fhemChartjs = {};

    window.fhemChartjs[canvas] = new Chart(ctx, chartJSON);
}

function setTimePeriod(options, from, to, index) {
    if (!index) index = 0;
    console.log(from.replace(" ","T"));
    console.log(to);
    console.log(moment(from, "YYYY-MM-DD HH:mm:ss").format());
    console.log(moment(to, "YYYY-MM-DD HH:mm:ss").format());
    options.scales.xAxis[index].ticks.min = moment(from, "YYYY-MM-DD HH:mm:ss").format();
    options.scales.xAxis[index].ticks.max = moment(to, "YYYY-MM-DD HH:mm:ss").format();
}


function createChartAsync(logrep, from, to, canvas, specs, chartUrl, callback, wait) {
    setTimeout(function () {
        createChart(logrep, from, to, canvas, specs, chartUrl, callback)
    }, wait ? wait : 0);
}

async function reloadData(chart, from, to) {
    await loadAllData(chart.config.fhem.logrep, chart.config.fhem.specs, from, to, chart.data);
}

async function loadAllData(logrep, specs, from, to, data) {
    for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        const d = await loadData(logrep, spec, from, to).catch(err => {
            console.log(err)
        });
        if (d) {
            data.datasets[i].data = d;
        }
        if(spec.l) {
            data.datasets[i].label = spec.l;
        }
    }
}

function loadChartFromUrl(chartUrl) {
    return new Promise(function (resolve, reject) {
        fetch(chartUrl, {"redirect": "error"}).then(response => {
            return response.json();
        }).then(data => {
            resolve(data);
        }).catch(err => {
            reject(err);
        });
    });
}

function loadData(logrep, spec, from, to) {
    return new Promise(function (resolve, reject) {
        const sql = "SELECT DISTINCT timestamp, max(value) as value FROM history WHERE device = '" + spec.d + "' AND reading = '" + spec.r + "' AND timestamp between '" + from + "' AND '" + to + "' GROUP BY timestamp ORDER BY timestamp;";
        const cmd = encodeURI("get " + logrep + " dbValue " + sql);
        const csrws = getCSRF();
        const csrf = csrws ? ("&fwcsrf=" + csrws) : "";

        fetch('/fhem?cmd=' + cmd + csrf, {"redirect": "error"}).then(response => {
            return response.text();
        }).then(data => {
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(data, 'text/html');
            let result;
            if (htmlDoc.getElementById('content').firstElementChild) {
                result = htmlDoc.getElementById('content').firstElementChild.innerHTML;
            } else {
                result = null;
            }

            let ret;
            if (result) {
                const lines = result.split("\n");
                ret = [];
                lines.forEach(line => {
                    const e = line.split("|");
                    let y;
                    if (spec.f) {
                        y = spec.f(e[1]);
                    } else {
                        y = e[1];
                    }
                    ret.push({"x": moment(e[0], "YYYY-MM-DD HH:mm:ss").format(), "y": y});
                });
            } else {
                ret = null;
            }

            if (ret) {
                resolve(ret);
            } else {
                reject("no data");
            }
        }).catch(err => {
            reject(err);
        });
    });
}

function getChartTime(M, H, d, m, y) {

    const today = new Date();

    if (M) today.setMinutes(today.getMinutes() - M);
    if (H) today.setHours(today.getHours() - H);
    if (d) today.setDate(today.getDate() - d);
    if (m) today.setMonth(today.getMonth() - m);
    if (y) today.setFullYear(today.getFullYear() - y);

    const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const ret = date + ' ' + time;

    return ret;
}

function getCSRF() {
    return document.body.getAttribute("fwcsrf");
}

async function adjustTime(chart, time, tname, idx) {
    if (!idx) idx = 0;
    const from = moment(chart.options.scales.xAxis[idx].ticks.min).add(time, tname);
    const to = moment(chart.options.scales.xAxis[idx].ticks.max).add(time, tname);

    chart.options.scales.xAxis[idx].ticks.min = from.format();
    chart.options.scales.xAxis[idx].ticks.max = to.format();

    await reloadData(chart, from.format("YYYY-MM-DD HH:mm:ss"), to.format("YYYY-MM-DD HH:mm:ss"));

    chart.update();
}

async function gotoTime(chart, f, t, idx) {
    if (!idx) idx = 0;
    const from = moment(f, "YYYY-MM-DD HH:mm:ss");
    const to = moment(t, "YYYY-MM-DD HH:mm:ss");

    chart.options.scales.xAxis[idx].ticks.min = from.format();
    chart.options.scales.xAxis[idx].ticks.max = to.format();

    await reloadData(chart, from.format("YYYY-MM-DD HH:mm:ss"), to.format("YYYY-MM-DD HH:mm:ss"));

    chart.update();
}
