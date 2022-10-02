**Javascript Charts für FHEM mit Chart.js**

Forum: https://forum.fhem.de/index.php/topic,105341.0.html

1. Voraussetzung:
   * Funktionierendes [dbLog](https://wiki.fhem.de/wiki/DbLog) und [dbRep](https://wiki.fhem.de/wiki/DbRep_-_Reporting_und_Management_von_DbLog-Datenbankinhalten)

2. `update all https://raw.githubusercontent.com/MarcProe/Chart.fhem.js/master/controls_chart.txt`

3. Javascripts in dieser Reihenfolge in FHEM einbinden:
   * `set WEB JavaScripts chart.js/moment-with-locales.min.js chart.js/Chart.min.js chart.js/Chart.fhem.js`
   * (Vorsicht: Nichts überschreiben, was eventuell schon drinsteht)

4. CSS einbinden:
   * In `defaultCommon.css` (oder den genutzten Stylesheet) die folgende Zeile am
   Anfang hinzufügen:
      * `@import url("Chart.min.css");`

5. Ein [Chart konfigurieren](https://www.chartjs.org/docs/latest/configuration/) und im `www/chart.js` Verzeichnis
ablegen
   * Ein Chart wird als JSON Datei definiert, siehe Beispiel `HeizungDefault.json`

6. Einen `weblink` definieren:
   * `define Mein_Chart weblink htmlCode <div></div>`

7. Die DEF wie folgt ändern:
   * Syntax für createChart:
      * `createChart(dbRep, von, bis, htmlElement, Daten, ChartDefinition)`
   * `dbRep` ist der Name der dbRep-Instanz
   * `von`und `bis` definiert den Zeitraum des Charts
      * Die Helferfunktion `getChartTime(m,h,d,m,y)` gibt das aktuelle Datum zurück, abzüglich der Parameter.
      * `getChartTime(0,12)` ist jetzt vor 12 Stunden und 0 Minuten
   * Die Daten werden als JSON-Array definiert:
      * `"d"` ist das device, `"r"` das reading, `"l"`: Label des Graphen, `"f"` (optional) eine Funktion, die
      auf den auszugebenden Wert angewendet wird
   * `ChartDefinition` ist der Pfad auf die Config-Datei
    ```html
   htmlCode <div>
       <canvas id="Heizung" width="800" height="300"></canvas>
   </div>
   <script>

       createChart(  "logrep",
                     getChartTime(0,12),
                     getChartTime(),
                     "Heizung",
                     [
                       { "d": "Heizung", "r": "desired-temp" },
                       { "d": "Heizung", "r": "measured-temp", "l": "Temperatur" },
                       { "d": "Heizung", "r": "window", "f": function(d) { return d === "closed"?0:1; } },
                       { "d": "Heizung", "r": "actuator", "f": function(d) { return d.slice(0, -1); } }                 
                     ],
                     "/fhem/chart.js/HeizungDefault.json"
                   );

   </script>
   ```

8. Fertig!
   * ![Beispiel](https://github.com/MarcProe/Chart.fhem.js/raw/master/.assets/Beispiel.png)

9. Man kann den Chart auch ohne die `createChart`-Methode oder JSON-Template erstellen, wenn man weitere Einstellungsmöglichkeiten haben möchte:
    ```html
    htmlCode <div><a href="/fhem?detail=chart_TEST">TEST</a>
        <canvas id="TEST" width="1400" height="500"></canvas>
    </div>
    <script>

    async function myChart() {

        var data0 = await loadData("logrep", { "d": "feinstaub", "r": "temperature" }, getChartTime(0,25), getChartTime()).catch(err => {console.log(err)});
        var data1 = await loadData("logrep", { "d": "weather_current", "r": "tempc" },  getChartTime(0,25), getChartTime()).catch(err => {console.log(err)});
        var data2 = await loadData("logrep", { "d": "TempStall", "r": "huette" }, getChartTime(0,25), getChartTime()).catch(err => {console.log(err)});
        var data3 = await loadData("logrep", { "d": "TempStall", "r": "aussen" }, getChartTime(0,25), getChartTime()).catch(err => {console.log(err)});
        var data4 = await loadData("logrep", { "d": "TempStall", "r": "stall" }, getChartTime(0,25), getChartTime()).catch(err => {console.log(err)});
    
        var myHandychart = {
          "type": "line",
          "data": {
            "datasets": [{
              "label": "Temp Feinstaub",
              "data": data0,
              "yAxesID": "T", "backgroundColor": ["rgba(255, 0, 0, 0.2)"], "borderColor": ["rgba(255, 16, 16, 1)"], "borderWidth": 2, "pointRadius": 1, "fill": false
            },{
                "label": "Temp OWM",
                "data": data1,
              "yAxesID": "T", "backgroundColor": ["rgba(0, 255, 0, 0.2)"], "borderColor": ["rgba(16, 255, 16, 1)"], "borderWidth": 2, "pointRadius": 1, "fill": false
              },{
                "label": "Temp Hütte",
                "data": data2,
              "yAxesID": "T", "backgroundColor": ["rgba(0, 0, 255, 0.2)"], "borderColor": ["rgba(16, 16, 255, 1)"], "borderWidth": 2, "pointRadius": 1, "fill": false
              },
              {
                "label": "Temp Außen",
                "data": data3,
                "yAxesID": "T", "backgroundColor": ["rgba(255, 255, 0, 0.2)"], "borderColor": ["rgba(255, 255, 16, 200)"], "borderWidth": 2, "pointRadius": 1, "fill": false
              },
              {
                "label": "Temp Stall",
                "data": data4,
                "yAxesID": "T", "backgroundColor": ["rgba(0, 255, 255, 0.2)"], "borderColor": ["rgba(16, 255, 255, 1)"], "borderWidth": 2, "pointRadius": 1, "fill": false,
              }]
          },
          "options": {
            "responsive": false,
            "scales": {
              "yAxes": [{
                "id": "T", "scaleLabel": { "display": true, "labelString": "°C" }, "ticks": { "beginAtZero": false, "suggestedMin": 15, "suggestedMax": 25 }
              }],
              "xAxes": [{ "type": "time", "time": { "unit": "hour" }, 
                "ticks": { 
                  "maxTicksLimit": 10,
                  "min": moment(getChartTime(0,25), "YYYY-MM-DD HH:mm:ss").format(),
                  "max": moment(getChartTime(), "YYYY-MM-DD HH:mm:ss").format()
                } 
              }]
            }
          }
        };
   
        const ctx = document.getElementById("TEST").getContext('2d');
        return new Chart(ctx, myHandychart);       
    }

    myChart();

    </script>
    ```

10. Mit Javascript können auch Steuerknöpfe erzeugt werden:
    ```html
    <canvas id="Heizung" width="800" height="300"></canvas>
    <button type="button" onClick="adjustTime(fhemChartjs['Heizung'], -1, 'days')">&larr;</button>
    <button type="button" onClick="gotoTime(fhemChartjs['Heizung'], getChartTime(0,25), getChartTime())">Jetzt</button>
    <button type="button" onClick="adjustTime(fhemChartjs['Heizung'], 1, 'days');">&rarr;</button>
    ```
