async function createChartJSON(logrep, from, to, canvas, specs, axes, chartJSON, callback) {
    //defaults

    if(!from) from = getChartTime(0,25);
    if(!to) to = getChartTime();
    if(!logrep) logrep = "logrep";

    const isof = toISO(from);
    const isot = toISO(to);

    if(!chartJSON) {
            chartJSON = {
            type: "line",
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {},
                scales: {
                    x: {
                        type: "time",
                        time: {
                            unit: "hour"
                        },
                        maxTicksLimit: 10,
                        adapters: {
                            date: {
                                locale: "de"
                            }
                        },
                        min: isof,
                        max: isot
                    },
                }
            }
        }
    }

    if(axes) {
        Object.entries(axes).forEach((e) => {
            const k = e[0];
            const v = e[1];
            chartJSON.options.scales[k] = {
                "position": (v.p ? v.p : "right"),
                "title": {
                    "display": (v.l ? true : false),
                    "text": v.l
                }
            }

            if(v.min) {
                chartJSON.options.scales[k].min = v.min;
            }
            if(v.max) {
                chartJSON.options.scales[k].max = v.max;
            }

            if(v.smin) {
                chartJSON.options.scales[k].suggestedMin = v.smin;
            }

            if(v.smax) {
                chartJSON.options.scales[k].suggestedMax = v.smax;
            }

            if(v.o) {
                Object.entries(v.o).forEach((f) => {
                    ok = f[0];
                    ov = f[1];
                    chartJSON.options.scales[k][ok] = ov;
                });
            }
        });
    }

    if (!chartJSON.options.animation) chartJSON.options.animation = {};
    if(callback) {
        chartJSON.options.animation.onComplete = callback;
    }

    chartJSON.fhem = {
        "logrep": logrep,
        "from": from,
        "to": to,
        "canvas": canvas,
        "specs": specs,
        "chartJSON": chartJSON,
        "callback": callback
    };

    await loadAllData(logrep, specs, from, to, chartJSON.data).catch(err => {
        console.log(err)
    });
    const ctx = document.getElementById(canvas);

    if (!window.fhemChartjs) window.fhemChartjs = {};

    window.fhemChartjs[canvas] = new Chart(ctx, chartJSON);

    gotoTime(window.fhemChartjs[canvas], from, to)

    console.log(chartJSON);
}

function createChartJSONAsync(logrep, from, to, canvas, specs, axes, chart, callback, wait) {
    setTimeout(function () {
        createChartJSON(logrep, from, to, canvas, specs, axes, chart, callback)
    }, wait ? wait : 0);
}

function createChart(canvas, specs, axes, from, to, logrep, wait, callback) {
    createChartJSONAsync(logrep, from, to, canvas, specs, axes, null, callback, wait);
}

async function reloadData(chart, from, to) {
    await loadAllData(chart.config._config.fhem.logrep, chart.config._config.fhem.specs, from, to, chart.data);
}

async function loadAllData(logrep, specs, from, to, data) {
    if(!data) data = {};
    if(!data.datasets) data.datasets = [];
    for (let i = 0; i < specs.length; i++) {
        const spec = specs[i];
        const d = await loadData(logrep, spec, from, to).catch(err => {
            console.log(err)
        });

        if(!data.datasets[i]) data.datasets.push({});
        if (d) {
            data.datasets[i].data = d;
        }
        if (spec.a) {
            data.datasets[i].yAxisID = spec.a;
        }
        if (spec.l) {
            data.datasets[i].label = spec.l;
        } else {
            data.datasets[i].label = spec.d + " " + spec.r;
        }
        if(spec.c) {
            data.datasets[i].borderColor = spec.c;
        } else {
            data.datasets[i].borderColor = c(i);
        }
    }
}

function loadChartFromUrl(chartUrl) {
    return new Promise(function (resolve, reject) {
        fetch(chartUrl, { "redirect": "error" }).then(response => {
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
        const cmd = encodeURI("get " + logrep + " sqlCmdBlocking " + sql);
        const csrws = getCSRF();
        const csrf = csrws ? ("&fwcsrf=" + csrws) : "";

        fetch('/fhem?cmd=' + cmd + csrf, { "redirect": "error" }).then(response => {
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

                    ret.push([ toISO(e[0]), y ]);
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

    // TODO this is crap.
    const date = today.getFullYear() + '-' + ("0" + (today.getMonth() + 1)).slice(-2) + '-' + ("0" + today.getDate()).slice(-2);
    const time = ("0" + today.getHours()).slice(-2) + ":" + ("0" + today.getMinutes()).slice(-2) + ":" + ("0" + today.getSeconds()).slice(-2);
    const ret = date + ' ' + time;

    return ret;
}

function getCSRF() {
    return document.body.getAttribute("fwcsrf");
}

async function adjustTime(chart, time) {
    const s = chart.options.scales["x"]
    gotoTime(chart, adjust(s.min, time), adjust(s.max, time));
}

async function gotoTime(chart, from, to) {
    chart.options.scales["x"].min = toISO(from);
    chart.options.scales["x"].max = toISO(to);

    await reloadData(chart, from, to);
    chart.update();
}

function toISO(date) {
    const ret = luxon.DateTime.fromFormat(date, "yyyy-LL-dd HH:mm:ss");
    return ret.toISO();
}

function adjust(dt, time) {
    var ret = luxon.DateTime.fromISO(dt);
    ret = ret.plus(time);
    ret = ret.toFormat("yyyy-LL-dd HH:mm:ss");
    return ret;
}

function c(i) {
    const col = [];
    col.push("rgb(255,64,64)");
    col.push("rgb(64,255,64)");
    col.push("rgb(64,64,255)");
    col.push("rgb(255,255,64)");
    col.push("rgb(255,64,255)");
    col.push("rgb(64,255,255)");
    const r = (i % 8) * 32 - 1;
    const g = (i % 4) * 64 - 1;
    const b = 0;
    return i < 6 ? col[i] : "rgb(" + r + "," + g + "," + b + ")";
}
