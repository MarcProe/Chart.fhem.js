**Javascript Charts für FHEM mit [Chart.js](https://github.com/chartjs/Chart.js)**

Forum: https://forum.fhem.de/index.php/topic,105341.0.html

1. Voraussetzung:
   * Funktionierendes [dbLog](https://wiki.fhem.de/wiki/DbLog) und [dbRep](https://wiki.fhem.de/wiki/DbRep_-_Reporting_und_Management_von_DbLog-Datenbankinhalten)
   * Der Device Name des dbRep ist idealerweise `logrep`.

2. `update all https://raw.githubusercontent.com/MarcProe/Chart.fhem.js/master/controls_chart.txt`

3. Javascripts in dieser Reihenfolge in FHEM einbinden:
   * `set WEB JavaScripts chart.js/luxon.min.js chart.js/chart.min.js chart.js/chart.fhem.js chart.js/chartjs-adapter-luxon.min.js`
   * (Vorsicht: Nichts überschreiben, was eventuell schon drinsteht)

4. Einen `weblink` definieren:
   * `define Mein_Chart weblink htmlCode <div></div>`

5. Die DEF wie folgt ändern:
   * Syntax für createChart:
      * `createChart(htmlElement, Daten, [Achsen], [von], [bis], [dbRep])`
   * `dbRep` ist der Name der dbRep-Instanz. Standard ist `logrep`.
   * `von`und `bis` definiert den Zeitraum des Charts. Standard ist "letzte 25 Stunden".
      * Die Helferfunktion `getChartTime(m,h,d,m,y)` gibt das aktuelle Datum zurück, abzüglich der Parameter.
      * `getChartTime(0,12)` ist jetzt vor 12 Stunden und 0 Minuten
   * Die Daten werden als JSON-Array definiert:
      * `"d"`: das device
      * `"r"`: das reading
      * `"l"`: Label des Graphen
      * `"a"`: Achse, auf der die Daten angezeigt werden sollen
      * `"c"`: (optional) Die Linienfarbe im Format `"rgb(128,64,64)"`
      * `"f"` (optional) eine Funktion, die auf den auszugebenden Wert angewendet wird
   * Da Achsendefiniton wird als JSON-Objekt definiert:
      * Objektname ist die ID der Achse, die bei den Daten unter `"a"` verwendet wird.
      * `"p"`: Position der Achse, links oder rechts vom Graphen
      * `"l"`: Label der Achse
      * `"min"`: Minimalwert auf der Achse
      * `"max"`: Maximalwert auf der Achse
      * `"smin"`: [Vorgeschlagener Minimalwert der Achse](https://www.chartjs.org/docs/latest/samples/scales/linear-min-max-suggested.html)
      * `"smax"`: Vorgeschlagener Maximalwert der Achse
      
   
    ```html
   htmlCode <div>
       <canvas id="HeizungBad"></canvas>
   </div>
   <script>
   createChart( "HeizungBad", 
                  [
                    { "d": "FensterBad", "r": "temperature", "a": "T", "l": "gewollte Temperatur", "c": "rgb(128,64,64)" },
                    { "d": "TempBad", "r": "temperature", "a": "T", "l": "gemessene Temperatur", "c": "rgb(255,64,64)"  },
                    { "d": "FensterBad", "r": "state", "a": "L", "c": "rgb(64,196,64)", "f": d => { return d === "closed"?0:1; } },
                    { "d": "HumiBad", "r": "humidity", "a": "A", "l": "Feuchtigkeit", "c": "rgb(64,64,192)" }
                  ],
                  {
                      "T": { "p": "left", "l": "°C", "smin": "15", "smax": "25" },
                      "L": { "l": "on/off", "min": "0", "max": "1" },
                      "A": { "l": "pct", "smin": "40", "smax": "80" }
                  }                  
                );

   </script>
   ```
6. Fertig!

7. Mit Javascript können auch Steuerknöpfe erzeugt werden, zudem kann die Breite des Charts angegeben werden, und ein Link auf die Chartdefinition erezeeugt werden:
    ```html
   htmlCode 
   <div>
      <!-- Link auf die Definition -->
      <a href="/fhem?detail=chart_Heizung_Bad">Bad</a>
      <div class="chart-container" style="style=width:100%;max-width:700px">
        <!-- Chart Canvas -->
        <canvas id="HeizungBad"></canvas>
      </div>
      <!-- 12 Stunden zurück -->
      <button type="button" onClick="adjustTime(fhemChartjs['HeizungBad'], {'hours': '-12'})">&larr;</button>
      <!-- 25 Stunden zurück bis jetzt -->
      <button type="button" onClick="gotoTime(fhemChartjs['HeizungBad'], getChartTime(0,25), getChartTime())">Jetzt</button>
      <!-- 12 Stunden vor -->
      <button type="button" onClick="adjustTime(fhemChartjs['HeizungBad'], {'hours': '12'});">&rarr;</button>
    </div>
    <script>
      /* */
    </script>
    ```
