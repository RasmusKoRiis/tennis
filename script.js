/* ===================== Theme Toggle & Tennisball Rain ===================== */
document.getElementById("themeToggle").addEventListener("click", function() {
    const body = document.body;
    // Toggle between dark and light mode classes
    if (body.classList.contains("dark-mode")) {
      body.classList.remove("dark-mode");
      body.classList.add("light-mode");
    } else {
      body.classList.remove("light-mode");
      body.classList.add("dark-mode");
    }
    // Update chart themes (see function definition below)
    updateChartTheme();
    // Trigger the tennisball rain animation
    rainTennisballs();
  });

  function updateChartTheme() {
    let fontColor, gridColor;
    if (document.body.classList.contains("light-mode")) {
      fontColor = "#121212";         // Dark text for light background
      gridColor = "rgba(0, 0, 0, 0.1)"; // Dark grid lines
    } else {
      fontColor = "#fff";            // White text for dark background
      gridColor = "rgba(255, 255, 255, 0.1)"; // Light grid lines
    }
    
    // Update legends, axes, and grid colors for each chart
    if (progressChart) {
      progressChart.options.plugins.legend.labels.color = fontColor;
      progressChart.options.scales.x.title.color = fontColor;
      progressChart.options.scales.x.ticks.color = fontColor;
      progressChart.options.scales.x.grid.color = gridColor;
      progressChart.options.scales.y.title.color = fontColor;
      progressChart.options.scales.y.ticks.color = fontColor;
      progressChart.options.scales.y.grid.color = gridColor;
      progressChart.update();
    }
    
    if (speedChart) {
      speedChart.options.plugins.legend.labels.color = fontColor;
      speedChart.options.scales.x.title.color = fontColor;
      speedChart.options.scales.x.ticks.color = fontColor;
      speedChart.options.scales.x.grid.color = gridColor;
      speedChart.options.scales.y.title.color = fontColor;
      speedChart.options.scales.y.ticks.color = fontColor;
      speedChart.options.scales.y.grid.color = gridColor;
      speedChart.update();
    }
    
    if (accuracyChart) {
      accuracyChart.options.plugins.legend.labels.color = fontColor;
      accuracyChart.options.scales.x.title.color = fontColor;
      accuracyChart.options.scales.x.ticks.color = fontColor;
      accuracyChart.options.scales.x.grid.color = gridColor;
      accuracyChart.options.scales.y.title.color = fontColor;
      accuracyChart.options.scales.y.ticks.color = fontColor;
      accuracyChart.options.scales.y.grid.color = gridColor;
      accuracyChart.update();
    }
  }
  
  
  
  
  function rainTennisballs() {
    const ballCount = 200; // Adjust as needed
    for (let i = 0; i < ballCount; i++) {
      const ball = document.createElement("div");
      ball.classList.add("tennisball");
      ball.style.left = Math.random() * 100 + "vw";
      ball.style.animationDelay = Math.random() * 0.5 + "s";
      document.body.appendChild(ball);
      ball.addEventListener("animationend", function() {
        ball.remove();
      });
    }
  }
  
  /* ===================== Helper Functions ===================== */
  function calculateIQRAverage(values) {
    if (!values || values.length === 0) return null;
    
    // Sort the array in ascending order.
    const sorted = values.slice().sort((a, b) => a - b);
    const n = sorted.length;
  
    // A helper function to compute quartiles.
    function getQuartile(sortedArr, q) {
      const pos = (sortedArr.length - 1) * q;
      const base = Math.floor(pos);
      const rest = pos - base;
      if (base + 1 < sortedArr.length) {
        return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
      } else {
        return sortedArr[base];
      }
    }
    
    // Calculate Q1 (25th percentile) and Q3 (75th percentile)
    const Q1 = getQuartile(sorted, 0.25);
    const Q3 = getQuartile(sorted, 0.75);
    const IQR = Q3 - Q1;
    
    // Define lower and upper bounds (using 1.5 * IQR is common)
    const lowerBound = Q1 - 1.5 * IQR;
    const upperBound = Q3 + 1.5 * IQR;
    
    // Filter values to keep only those within the bounds
    const filtered = sorted.filter(value => value >= lowerBound && value <= upperBound);
    
    // If no values remain, return null.
    if (filtered.length === 0) return null;
    
    // Return the average of the filtered values.
    const sum = filtered.reduce((total, value) => total + value, 0);
    return sum / filtered.length;
  }
  
  
  function calculateAverageSpeed(data) {
    if (!data || data.length === 0) return null;
    let speeds = [];
    data.forEach(row => {
      let spd = parseFloat(row["Speed (KM/H)"]);
      if (!isNaN(spd)) {
        speeds.push(spd);
      }
    });
    if (speeds.length === 0) return null;
    // Use the IQR-based method to compute a robust average
    const avg = calculateIQRAverage(speeds);
    return avg !== null ? parseFloat(avg.toFixed(2)) : null;
  }

  function calculateRobustAverageSpeed(data) {
    if (!data || data.length === 0) return null;
    let speeds = [];
    data.forEach(row => {
      let spd = parseFloat(row["Speed (KM/H)"]);
      if (!isNaN(spd)) {
        speeds.push(spd);
      }
    });
    if (speeds.length === 0) return null;
    const avg = calculateIQRAverage(speeds);
    return avg !== null ? parseFloat(avg.toFixed(2)) : null;
  }
  
  
  function calculateAccuracy(data) {
    if (!data || data.length === 0) return null;
    let inCount = 0;
    data.forEach(row => {
      if (String(row.Result).toLowerCase() === "in") {
        inCount++;
      }
    });
    return data.length ? parseFloat(((inCount / data.length) * 100).toFixed(2)) : null;
  }

  function calculateRobustAccuracy(data) {
    if (!data || data.length === 0) return null;
    let accuracies = [];
    data.forEach(row => {
      // Assign 100 for a successful ("in") shot and 0 otherwise.
      let acc = (String(row.Result).toLowerCase() === "in") ? 100 : 0;
      accuracies.push(acc);
    });
    if (accuracies.length === 0) return null;
    const avg = calculateIQRAverage(accuracies);
    return avg !== null ? parseFloat(avg.toFixed(2)) : null;
  }

  function computeComposite(robustSpeedArr, robustAccArr) {
    return robustSpeedArr.map((spd, i) => {
      let acc = robustAccArr[i];
      if (spd === null || acc === null) return 0;
      return parseFloat(((spd + acc) / 2).toFixed(2));
    });
  }
  
  
  function computeOverallMetricsForPlayer(sessionsArr, stroke, player) {
    let totalSpeed = 0, countSpeed = 0, inCount = 0, totalShots = 0;
    sessionsArr.forEach(session => {
      session.rawData.forEach(row => {
        if (row.Stroke === stroke && row.Player === player) {
          let spd = parseFloat(row["Speed (KM/H)"]);
          if (!isNaN(spd)) {
            totalSpeed += spd;
            countSpeed++;
          }
          totalShots++;
          if (String(row.Result).toLowerCase() === "in") {
            inCount++;
          }
        }
      });
    });
    let avgSpeed = countSpeed ? (totalSpeed / countSpeed).toFixed(2) : "N/A";
    let accuracy = totalShots ? ((inCount / totalShots) * 100).toFixed(2) : "N/A";
    return { avgSpeed, accuracy };
  }
  
  // NEW: Compute composite metric for progress.
  // Here composite = (average speed + average accuracy) / 2 for each session.
  function computeComposite(speedArr, accArr) {
    return speedArr.map((spd, i) => {
      let acc = accArr[i];
      if (spd === null || acc === null) return 0;
      return parseFloat(((spd + acc) / 2).toFixed(2));
    });
  }
  
  /* ===================== Global Variables ===================== */
  let sessions = []; // Each session: { label, rawData }
  let currentPlayer = "Both"; // Options: "Both", "Rasmus Kopperud Riis", or "Reidar Andreas Tveit"
  let speedChart = null;
  let accuracyChart = null;
  let progressChart = null;
  
  // --- Color configuration for strokes and players ---
  const colorConfig = {
    "Serve": {
      "Rasmus Kopperud Riis": {
        border: "#e53935", 
        gradient: { start: "rgba(229,57,53,0.5)", end: "rgba(229,57,53,0)" }
      },
      "Reidar Andreas Tveit": {
        border: "#ff5252",
        gradient: { start: "rgba(255,82,82,0.5)", end: "rgba(255,82,82,0)" }
      }
    },
    "Forehand": {
      "Rasmus Kopperud Riis": {
        border: "#1e88e5",
        gradient: { start: "rgba(30,136,229,0.5)", end: "rgba(30,136,229,0)" }
      },
      "Reidar Andreas Tveit": {
        border: "#64b5f6",
        gradient: { start: "rgba(100,181,246,0.5)", end: "rgba(100,181,246,0)" }
      }
    },
    "Backhand": {
      "Rasmus Kopperud Riis": {
        border: "#43a047",
        gradient: { start: "rgba(67,160,71,0.5)", end: "rgba(67,160,71,0)" }
      },
      "Reidar Andreas Tveit": {
        border: "#81c784",
        gradient: { start: "rgba(129,199,132,0.5)", end: "rgba(129,199,132,0)" }
      }
    }
  };
  
  /* ===================== Data Loading ===================== */
  function loadDataFromFolder() {
    fetch('data/manifest.json')
      .then(response => response.json())
      .then(fileNames => {
        const promises = fileNames.map(fileName =>
          fetch('data/' + fileName)
            .then(resp => resp.text())
            .then(text => ({ fileName, text }))
        );
        return Promise.all(promises);
      })
      .then(results => {
        results.forEach(result => {
          Papa.parse(result.text, {
            header: true,
            dynamicTyping: true,
            complete: function(parsedResult) {
              processCSVData(parsedResult.data, result.fileName);
            },
            error: function(error) {
              console.error("Error parsing CSV (" + result.fileName + "):", error);
            }
          });
        });
      })
      .catch(error => console.error("Error loading manifest:", error));
  }
  
  /* ===================== Data Processing ===================== */
  function processCSVData(data, fileName) {
    // Default: use the file name (without extension)
    let sessionLabel = fileName.split('.')[0];
  
    // If the CSV file includes a Date column in its first row, use that
    if (data && data.length > 0 && data[0].Date) {
      sessionLabel = data[0].Date;
    }
    
    const session = {
      label: sessionLabel, // This label now holds the date (if available)
      rawData: data
    };
    
    sessions.push(session);
    updateDashboardAndCharts();
  }
  
  
  /* ===================== UI Update Functions ===================== */
  function selectPlayer(player, button) {
    // Update the current player
    currentPlayer = player;
    
    // Remove the active class from all buttons inside the controls container
    document.querySelectorAll('.controls button').forEach(btn => btn.classList.remove('active'));
    
    // Add the active class to the clicked button
    button.classList.add('active');
    
    // Update the dashboard and charts accordingly
    updateDashboardAndCharts();
  }
  
  function updateDashboardAndCharts() {
    updateDashboard();
    updateCharts();
  }
  
  function updateDashboard() {
    const dashboardCards = document.getElementById('dashboardCards');
    const sessionCount = parseInt(document.getElementById('sessionCount').value, 10) || sessions.length;
    const filteredSessions = sessions.slice(-sessionCount);
    let html = "";
    if (currentPlayer === "Both") {
      const players = ["Rasmus Kopperud Riis", "Reidar Andreas Tveit"];
      players.forEach(player => {
        html += `<div class="dashboard-card">
                  <h3>${player}</h3>`;
        ["Serve", "Forehand", "Backhand"].forEach(stroke => {
          const metrics = computeOverallMetricsForPlayer(filteredSessions, stroke, player);
          html += `<p><strong>${stroke}</strong><br>
                    Avg Speed: ${metrics.avgSpeed} km/h<br>
                    Accuracy: ${metrics.accuracy} %</p>`;
        });
        html += `</div>`;
      });
    } else {
      html += `<div class="dashboard-card">
                <h3>${currentPlayer}</h3>`;
      ["Serve", "Forehand", "Backhand"].forEach(stroke => {
        const metrics = computeOverallMetricsForPlayer(filteredSessions, stroke, currentPlayer);
        html += `<p><strong>${stroke}</strong><br>
                  Avg Speed: ${metrics.avgSpeed} km/h<br>
                  Accuracy: ${metrics.accuracy} %</p>`;
      });
      html += `</div>`;
    }
    dashboardCards.innerHTML = html;
    document.getElementById('totalSessions').innerText = sessions.length;
  }
  
  /* ===================== Chart Update Function ===================== */
  function updateCharts() {
    const sessionCount = parseInt(document.getElementById('sessionCount').value, 10) || sessions.length;
    const filteredSessions = sessions.slice(-sessionCount);
    const labels = filteredSessions.map(session => session.label);
  
    if (currentPlayer === "Both") {
      // ---------------- Both Players Mode ----------------
      const rServeSpeed = [], rForehandSpeed = [], rBackhandSpeed = [];
      const aServeSpeed = [], aForehandSpeed = [], aBackhandSpeed = [];
      const rServeAcc = [], rForehandAcc = [], rBackhandAcc = [];
      const aServeAcc = [], aForehandAcc = [], aBackhandAcc = [];
      
      filteredSessions.forEach(session => {
        // Rasmus data
        const rServeData = session.rawData.filter(row => row.Player === "Rasmus Kopperud Riis" && row.Stroke === "Serve");
        const rForehandData = session.rawData.filter(row => row.Player === "Rasmus Kopperud Riis" && row.Stroke === "Forehand");
        const rBackhandData = session.rawData.filter(row => row.Player === "Rasmus Kopperud Riis" && row.Stroke === "Backhand");
        rServeSpeed.push(calculateRobustAverageSpeed(rServeData) || 0);
        rForehandSpeed.push(calculateRobustAverageSpeed(rForehandData) || 0);
        rBackhandSpeed.push(calculateRobustAverageSpeed(rBackhandData) || 0);
        rServeAcc.push(calculateRobustAccuracy(rServeData) || 0);
        rForehandAcc.push(calculateRobustAccuracy(rForehandData) || 0);
        rBackhandAcc.push(calculateRobustAccuracy(rBackhandData) || 0);
        
        // Andreas data
        const aServeData = session.rawData.filter(row => row.Player === "Reidar Andreas Tveit" && row.Stroke === "Serve");
        const aForehandData = session.rawData.filter(row => row.Player === "Reidar Andreas Tveit" && row.Stroke === "Forehand");
        const aBackhandData = session.rawData.filter(row => row.Player === "Reidar Andreas Tveit" && row.Stroke === "Backhand");
        aServeSpeed.push(calculateRobustAverageSpeed(aServeData) || 0);
        aForehandSpeed.push(calculateRobustAverageSpeed(aForehandData) || 0);
        aBackhandSpeed.push(calculateRobustAverageSpeed(aBackhandData) || 0);
        aServeAcc.push(calculateRobustAccuracy(aServeData) || 0);
        aForehandAcc.push(calculateRobustAccuracy(aForehandData) || 0);
        aBackhandAcc.push(calculateRobustAccuracy(aBackhandData) || 0);
      });
      
      // Compute composite metric for each stroke:
      const rServeComposite = computeComposite(rServeSpeed, rServeAcc);
      const rForehandComposite = computeComposite(rForehandSpeed, rForehandAcc);
      const rBackhandComposite = computeComposite(rBackhandSpeed, rBackhandAcc);
      const aServeComposite = computeComposite(aServeSpeed, aServeAcc);
      const aForehandComposite = computeComposite(aForehandSpeed, aForehandAcc);
      const aBackhandComposite = computeComposite(aBackhandSpeed, aBackhandAcc);
      
      const ctxProgress = document.getElementById('progressChart').getContext('2d');
      const gradRasmusServeProg = ctxProgress.createLinearGradient(0, 0, 0, ctxProgress.canvas.height);
      gradRasmusServeProg.addColorStop(0, colorConfig["Serve"]["Rasmus Kopperud Riis"].gradient.start);
      gradRasmusServeProg.addColorStop(1, colorConfig["Serve"]["Rasmus Kopperud Riis"].gradient.end);
      const gradRasmusForehandProg = ctxProgress.createLinearGradient(0, 0, 0, ctxProgress.canvas.height);
      gradRasmusForehandProg.addColorStop(0, colorConfig["Forehand"]["Rasmus Kopperud Riis"].gradient.start);
      gradRasmusForehandProg.addColorStop(1, colorConfig["Forehand"]["Rasmus Kopperud Riis"].gradient.end);
      const gradRasmusBackhandProg = ctxProgress.createLinearGradient(0, 0, 0, ctxProgress.canvas.height);
      gradRasmusBackhandProg.addColorStop(0, colorConfig["Backhand"]["Rasmus Kopperud Riis"].gradient.start);
      gradRasmusBackhandProg.addColorStop(1, colorConfig["Backhand"]["Rasmus Kopperud Riis"].gradient.end);
      
      const gradAndreasServeProg = ctxProgress.createLinearGradient(0, 0, 0, ctxProgress.canvas.height);
      gradAndreasServeProg.addColorStop(0, colorConfig["Serve"]["Reidar Andreas Tveit"].gradient.start);
      gradAndreasServeProg.addColorStop(1, colorConfig["Serve"]["Reidar Andreas Tveit"].gradient.end);
      const gradAndreasForehandProg = ctxProgress.createLinearGradient(0, 0, 0, ctxProgress.canvas.height);
      gradAndreasForehandProg.addColorStop(0, colorConfig["Forehand"]["Reidar Andreas Tveit"].gradient.start);
      gradAndreasForehandProg.addColorStop(1, colorConfig["Forehand"]["Reidar Andreas Tveit"].gradient.end);
      const gradAndreasBackhandProg = ctxProgress.createLinearGradient(0, 0, 0, ctxProgress.canvas.height);
      gradAndreasBackhandProg.addColorStop(0, colorConfig["Backhand"]["Reidar Andreas Tveit"].gradient.start);
      gradAndreasBackhandProg.addColorStop(1, colorConfig["Backhand"]["Reidar Andreas Tveit"].gradient.end);

    
      
      const progressDatasets = [
        {
          label: "Rasmus Serve",
          data: rServeComposite,
          borderColor: colorConfig["Serve"]["Rasmus Kopperud Riis"].border,
          backgroundColor: gradRasmusServeProg,
          fill: true,
          tension: 0.1
        },
        {
          label: "Rasmus Forehand",
          data: rForehandComposite,
          borderColor: colorConfig["Forehand"]["Rasmus Kopperud Riis"].border,
          backgroundColor: gradRasmusForehandProg,
          fill: true,
          tension: 0.1
        },
        {
          label: "Rasmus Backhand",
          data: rBackhandComposite,
          borderColor: colorConfig["Backhand"]["Rasmus Kopperud Riis"].border,
          backgroundColor: gradRasmusBackhandProg,
          fill: true,
          tension: 0.1
        },
        {
          label: "Andreas Serve",
          data: aServeComposite,
          borderColor: colorConfig["Serve"]["Reidar Andreas Tveit"].border,
          backgroundColor: gradAndreasServeProg,
          fill: true,
          tension: 0.1
        },
        {
          label: "Andreas Forehand",
          data: aForehandComposite,
          borderColor: colorConfig["Forehand"]["Reidar Andreas Tveit"].border,
          backgroundColor: gradAndreasForehandProg,
          fill: true,
          tension: 0.1
        },
        {
          label: "Andreas Backhand",
          data: aBackhandComposite,
          borderColor: colorConfig["Backhand"]["Reidar Andreas Tveit"].border,
          backgroundColor: gradAndreasBackhandProg,
          fill: true,
          tension: 0.1
        }
      ];
      
      if (progressChart) {
        progressChart.data.labels = labels;
        progressChart.data.datasets = progressDatasets;
        progressChart.update();
      } else {
        progressChart = new Chart(ctxProgress, {
          type: 'line',
          data: { labels: labels, datasets: progressDatasets },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#fff', usePointStyle: true, usePointStyle: true } } },
            scales: {
              x: {
                title: { display: true, text: 'Session', color: '#fff' },
                grid: { color: 'rgba(255,255,255,0.1)' },
                ticks: { color: '#fff' }
              },
              y: {
                title: { display: true, text: 'Progress', color: '#fff' },
                grid: { color: 'rgba(255,255,255,0.1)' },
                ticks: { color: '#fff' }
              }
            }
          }
        });
      }
      
      // ---------------- Speed Chart (Both Mode) ----------------
      const ctxSpeed = document.getElementById('speedChart').getContext('2d');
      const gradientRasmusServe = ctxSpeed.createLinearGradient(0, 0, 0, ctxSpeed.canvas.height);
      gradientRasmusServe.addColorStop(0, colorConfig["Serve"]["Rasmus Kopperud Riis"].gradient.start);
      gradientRasmusServe.addColorStop(1, colorConfig["Serve"]["Rasmus Kopperud Riis"].gradient.end);
      const gradientRasmusForehand = ctxSpeed.createLinearGradient(0, 0, 0, ctxSpeed.canvas.height);
      gradientRasmusForehand.addColorStop(0, colorConfig["Forehand"]["Rasmus Kopperud Riis"].gradient.start);
      gradientRasmusForehand.addColorStop(1, colorConfig["Forehand"]["Rasmus Kopperud Riis"].gradient.end);
      const gradientRasmusBackhand = ctxSpeed.createLinearGradient(0, 0, 0, ctxSpeed.canvas.height);
      gradientRasmusBackhand.addColorStop(0, colorConfig["Backhand"]["Rasmus Kopperud Riis"].gradient.start);
      gradientRasmusBackhand.addColorStop(1, colorConfig["Backhand"]["Rasmus Kopperud Riis"].gradient.end);
      const gradientAndreasServe = ctxSpeed.createLinearGradient(0, 0, 0, ctxSpeed.canvas.height);
      gradientAndreasServe.addColorStop(0, colorConfig["Serve"]["Reidar Andreas Tveit"].gradient.start);
      gradientAndreasServe.addColorStop(1, colorConfig["Serve"]["Reidar Andreas Tveit"].gradient.end);
      const gradientAndreasForehand = ctxSpeed.createLinearGradient(0, 0, 0, ctxSpeed.canvas.height);
      gradientAndreasForehand.addColorStop(0, colorConfig["Forehand"]["Reidar Andreas Tveit"].gradient.start);
      gradientAndreasForehand.addColorStop(1, colorConfig["Forehand"]["Reidar Andreas Tveit"].gradient.end);
      const gradientAndreasBackhand = ctxSpeed.createLinearGradient(0, 0, 0, ctxSpeed.canvas.height);
      gradientAndreasBackhand.addColorStop(0, colorConfig["Backhand"]["Reidar Andreas Tveit"].gradient.start);
      gradientAndreasBackhand.addColorStop(1, colorConfig["Backhand"]["Reidar Andreas Tveit"].gradient.end);
      
      const speedDatasets = [
        {
          label: "Rasmus Serve",
          data: rServeSpeed,
          borderColor: colorConfig["Serve"]["Rasmus Kopperud Riis"].border,
          backgroundColor: gradientRasmusServe,
          fill: true,
          tension: 0.1
        },
        {
          label: "Rasmus Forehand",
          data: rForehandSpeed,
          borderColor: colorConfig["Forehand"]["Rasmus Kopperud Riis"].border,
          backgroundColor: gradientRasmusForehand,
          fill: true,
          tension: 0.1
        },
        {
          label: "Rasmus Backhand",
          data: rBackhandSpeed,
          borderColor: colorConfig["Backhand"]["Rasmus Kopperud Riis"].border,
          backgroundColor: gradientRasmusBackhand,
          fill: true,
          tension: 0.1
        },
        {
          label: "Andreas Serve",
          data: aServeSpeed,
          borderColor: colorConfig["Serve"]["Reidar Andreas Tveit"].border,
          backgroundColor: gradientAndreasServe,
          fill: true,
          tension: 0.1
        },
        {
          label: "Andreas Forehand",
          data: aForehandSpeed,
          borderColor: colorConfig["Forehand"]["Reidar Andreas Tveit"].border,
          backgroundColor: gradientAndreasForehand,
          fill: true,
          tension: 0.1
        },
        {
          label: "Andreas Backhand",
          data: aBackhandSpeed,
          borderColor: colorConfig["Backhand"]["Reidar Andreas Tveit"].border,
          backgroundColor: gradientAndreasBackhand,
          fill: true,
          tension: 0.1
        }
      ];
      
      if (speedChart) {
        speedChart.data.labels = labels;
        speedChart.data.datasets = speedDatasets;
        speedChart.update();
      } else {
        speedChart = new Chart(ctxSpeed, {
          type: 'line',
          data: { labels: labels, datasets: speedDatasets },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#fff', usePointStyle: true, usePointStyle: true } } },
            scales: {
              x: { title: { display: true, text: 'Session', color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
              y: { title: { display: true, text: 'Avg Speed (km/h)', color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }
            }
          }
        });
      }
      
      // ---------------- Accuracy Chart (Both Mode) ----------------
      const ctxAcc = document.getElementById('accuracyChart').getContext('2d');
      const gradRasmusServeAcc = ctxAcc.createLinearGradient(0, 0, 0, ctxAcc.canvas.height);
      gradRasmusServeAcc.addColorStop(0, colorConfig["Serve"]["Rasmus Kopperud Riis"].gradient.start);
      gradRasmusServeAcc.addColorStop(1, colorConfig["Serve"]["Rasmus Kopperud Riis"].gradient.end);
      const gradRasmusForehandAcc = ctxAcc.createLinearGradient(0, 0, 0, ctxAcc.canvas.height);
      gradRasmusForehandAcc.addColorStop(0, colorConfig["Forehand"]["Rasmus Kopperud Riis"].gradient.start);
      gradRasmusForehandAcc.addColorStop(1, colorConfig["Forehand"]["Rasmus Kopperud Riis"].gradient.end);
      const gradRasmusBackhandAcc = ctxAcc.createLinearGradient(0, 0, 0, ctxAcc.canvas.height);
      gradRasmusBackhandAcc.addColorStop(0, colorConfig["Backhand"]["Rasmus Kopperud Riis"].gradient.start);
      gradRasmusBackhandAcc.addColorStop(1, colorConfig["Backhand"]["Rasmus Kopperud Riis"].gradient.end);
      const gradAndreasServeAcc = ctxAcc.createLinearGradient(0, 0, 0, ctxAcc.canvas.height);
      gradAndreasServeAcc.addColorStop(0, colorConfig["Serve"]["Reidar Andreas Tveit"].gradient.start);
      gradAndreasServeAcc.addColorStop(1, colorConfig["Serve"]["Reidar Andreas Tveit"].gradient.end);
      const gradAndreasForehandAcc = ctxAcc.createLinearGradient(0, 0, 0, ctxAcc.canvas.height);
      gradAndreasForehandAcc.addColorStop(0, colorConfig["Forehand"]["Reidar Andreas Tveit"].gradient.start);
      gradAndreasForehandAcc.addColorStop(1, colorConfig["Forehand"]["Reidar Andreas Tveit"].gradient.end);
      const gradAndreasBackhandAcc = ctxAcc.createLinearGradient(0, 0, 0, ctxAcc.canvas.height);
      gradAndreasBackhandAcc.addColorStop(0, colorConfig["Backhand"]["Reidar Andreas Tveit"].gradient.start);
      gradAndreasBackhandAcc.addColorStop(1, colorConfig["Backhand"]["Reidar Andreas Tveit"].gradient.end);
      
      const accuracyDatasets = [
        {
          label: "Rasmus Serve",
          data: rServeAcc,
          borderColor: colorConfig["Serve"]["Rasmus Kopperud Riis"].border,
          backgroundColor: gradRasmusServeAcc,
          fill: true,
          tension: 0.1
        },
        {
          label: "Rasmus Forehand",
          data: rForehandAcc,
          borderColor: colorConfig["Forehand"]["Rasmus Kopperud Riis"].border,
          backgroundColor: gradRasmusForehandAcc,
          fill: true,
          tension: 0.1
        },
        {
          label: "Rasmus Backhand",
          data: rBackhandAcc,
          borderColor: colorConfig["Backhand"]["Rasmus Kopperud Riis"].border,
          backgroundColor: gradRasmusBackhandAcc,
          fill: true,
          tension: 0.1
        },
        {
          label: "Andreas Serve",
          data: aServeAcc,
          borderColor: colorConfig["Serve"]["Reidar Andreas Tveit"].border,
          backgroundColor: gradAndreasServeAcc,
          fill: true,
          tension: 0.1
        },
        {
          label: "Andreas Forehand",
          data: aForehandAcc,
          borderColor: colorConfig["Forehand"]["Reidar Andreas Tveit"].border,
          backgroundColor: gradAndreasForehandAcc,
          fill: true,
          tension: 0.1
        },
        {
          label: "Andreas Backhand",
          data: aBackhandAcc,
          borderColor: colorConfig["Backhand"]["Reidar Andreas Tveit"].border,
          backgroundColor: gradAndreasBackhandAcc,
          fill: true,
          tension: 0.1
        }
      ];
      
      if (accuracyChart) {
        accuracyChart.data.labels = labels;
        accuracyChart.data.datasets = accuracyDatasets;
        accuracyChart.update();
      } else {
        accuracyChart = new Chart(ctxAcc, {
          type: 'line',
          data: { labels: labels, datasets: accuracyDatasets },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#fff', usePointStyle: true, usePointStyle: true } } },
            scales: {
              x: { title: { display: true, text: 'Session', color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
              y: { title: { display: true, text: 'Accuracy (%)', color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' }, min: 0, max: 100 }
            }
          }
        });
      }
    } else {
      // ---------------- Single Player Mode ----------------
      const player = currentPlayer;
      const serveSpeed = [], forehandSpeed = [], backhandSpeed = [];
      const serveAcc = [], forehandAcc = [], backhandAcc = [];
      
      filteredSessions.forEach(session => {
        const sData = session.rawData.filter(row => row.Player === player && row.Stroke === "Serve");
        const fData = session.rawData.filter(row => row.Player === player && row.Stroke === "Forehand");
        const bData = session.rawData.filter(row => row.Player === player && row.Stroke === "Backhand");
        serveSpeed.push(calculateRobustAverageSpeed(sData) || 0);
        forehandSpeed.push(calculateRobustAverageSpeed(fData) || 0);
        backhandSpeed.push(calculateRobustAverageSpeed(bData) || 0);
        serveAcc.push(calculateRobustAccuracy(sData) || 0);
        forehandAcc.push(calculateRobustAccuracy(fData) || 0);
        backhandAcc.push(calculateRobustAccuracy(bData) || 0);
      });
      
      const progServe = computeComposite(serveSpeed, serveAcc);
      const progForehand = computeComposite(forehandSpeed, forehandAcc);
      const progBackhand = computeComposite(backhandSpeed, backhandAcc);
      
      const ctxProgress = document.getElementById('progressChart').getContext('2d');
      const gradServeProg = ctxProgress.createLinearGradient(0, 0, 0, ctxProgress.canvas.height);
      gradServeProg.addColorStop(0, colorConfig["Serve"][player].gradient.start);
      gradServeProg.addColorStop(1, colorConfig["Serve"][player].gradient.end);
      const gradForehandProg = ctxProgress.createLinearGradient(0, 0, 0, ctxProgress.canvas.height);
      gradForehandProg.addColorStop(0, colorConfig["Forehand"][player].gradient.start);
      gradForehandProg.addColorStop(1, colorConfig["Forehand"][player].gradient.end);
      const gradBackhandProg = ctxProgress.createLinearGradient(0, 0, 0, ctxProgress.canvas.height);
      gradBackhandProg.addColorStop(0, colorConfig["Backhand"][player].gradient.start);
      gradBackhandProg.addColorStop(1, colorConfig["Backhand"][player].gradient.end);
      
      const progressDatasets = [
        {
          label: "Serve",
          data: progServe,
          borderColor: colorConfig["Serve"][player].border,
          backgroundColor: gradServeProg,
          fill: true,
          pointRadius: 10,        // Increase the radius of the points
          pointHoverRadius: 7,   // Increase the radius when hovering
          tension: 0.1
        },
        {
          label: "Forehand",
          data: progForehand,
          borderColor: colorConfig["Forehand"][player].border,
          backgroundColor: gradForehandProg,
          fill: true,
          pointRadius: 10,        // Increase the radius of the points
          pointHoverRadius: 7,   // Increase the radius when hovering
          tension: 0.1
        },
        {
          label: "Backhand",
          data: progBackhand,
          borderColor: colorConfig["Backhand"][player].border,
          backgroundColor: gradBackhandProg,
          fill: true,
          pointRadius: 10,        // Increase the radius of the points
          pointHoverRadius: 7,   // Increase the radius when hovering
          tension: 0.1
        }
      ];
      
      if (progressChart) {
        progressChart.data.labels = filteredSessions.map(session => session.label);
        progressChart.data.datasets = progressDatasets;
        progressChart.options.scales.x.title.text = 'Date'; // Update title to "Date"
        progressChart.update();
      } else {
        progressChart = new Chart(ctxProgress, {
          type: 'line',
          data: { labels: filteredSessions.map(session => session.label), datasets: progressDatasets },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
              x: { title: { display: true, text: 'Session', color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
              y: { title: { display: true, text: 'Progress (%)', color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }
            }
          }
        });
      }
      
      const ctxSpeed = document.getElementById('speedChart').getContext('2d');
      const gradServe = ctxSpeed.createLinearGradient(0, 0, 0, ctxSpeed.canvas.height);
      gradServe.addColorStop(0, colorConfig["Serve"][player].gradient.start);
      gradServe.addColorStop(1, colorConfig["Serve"][player].gradient.end);
      const gradForehand = ctxSpeed.createLinearGradient(0, 0, 0, ctxSpeed.canvas.height);
      gradForehand.addColorStop(0, colorConfig["Forehand"][player].gradient.start);
      gradForehand.addColorStop(1, colorConfig["Forehand"][player].gradient.end);
      const gradBackhand = ctxSpeed.createLinearGradient(0, 0, 0, ctxSpeed.canvas.height);
      gradBackhand.addColorStop(0, colorConfig["Backhand"][player].gradient.start);
      gradBackhand.addColorStop(1, colorConfig["Backhand"][player].gradient.end);
      
      const speedDatasets = [
        {
          label: "Serve",
          data: serveSpeed,
          borderColor: colorConfig["Serve"][player].border,
          backgroundColor: gradServe,
          fill: true,
          pointRadius: 10,        // Increase the radius of the points
          pointHoverRadius: 7,   // Increase the radius when hovering
          tension: 0.1
        },
        {
          label: "Forehand",
          data: forehandSpeed,
          borderColor: colorConfig["Forehand"][player].border,
          backgroundColor: gradForehand,
          fill: true,
          pointRadius: 10,        // Increase the radius of the points
          pointHoverRadius: 7,   // Increase the radius when hovering
          tension: 0.1
        },
        {
          label: "Backhand",
          data: backhandSpeed,
          borderColor: colorConfig["Backhand"][player].border,
          backgroundColor: gradBackhand,
          fill: true,
          pointRadius: 10,        // Increase the radius of the points
          pointHoverRadius: 7,   // Increase the radius when hovering
          tension: 0.1
        }
      ];
      
      if (speedChart) {
        speedChart.data.labels = labels;
        speedChart.data.datasets = speedDatasets;
        speedChart.update();
      } else {
        speedChart = new Chart(ctxSpeed, {
          type: 'line',
          data: { labels: labels, datasets: speedDatasets },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
              x: { title: { display: true, text: 'Session', color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
              y: { title: { display: true, text: 'Avg Speed (km/h)', color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } }
            }
          }
        });
      }
      
      const ctxAcc = document.getElementById('accuracyChart').getContext('2d');
      const gradServeAcc = ctxAcc.createLinearGradient(0, 0, 0, ctxAcc.canvas.height);
      gradServeAcc.addColorStop(0, colorConfig["Serve"][player].gradient.start);
      gradServeAcc.addColorStop(1, colorConfig["Serve"][player].gradient.end);
      const gradForehandAcc = ctxAcc.createLinearGradient(0, 0, 0, ctxAcc.canvas.height);
      gradForehandAcc.addColorStop(0, colorConfig["Forehand"][player].gradient.start);
      gradForehandAcc.addColorStop(1, colorConfig["Forehand"][player].gradient.end);
      const gradBackhandAcc = ctxAcc.createLinearGradient(0, 0, 0, ctxAcc.canvas.height);
      gradBackhandAcc.addColorStop(0, colorConfig["Backhand"][player].gradient.start);
      gradBackhandAcc.addColorStop(1, colorConfig["Backhand"][player].gradient.end);
      
      const accuracyDatasets = [
        {
          label: "Serve",
          data: serveAcc,
          borderColor: colorConfig["Serve"][player].border,
          backgroundColor: gradServeAcc,
          fill: true,
          pointRadius: 10,        // Increase the radius of the points
          pointHoverRadius: 7,   // Increase the radius when hovering
          tension: 0.1
        },
        {
          label: "Forehand",
          data: forehandAcc,
          borderColor: colorConfig["Forehand"][player].border,
          backgroundColor: gradForehandAcc,
          fill: true,
          pointRadius: 10,        // Increase the radius of the points
          pointHoverRadius: 7,   // Increase the radius when hovering
          tension: 0.1
        },
        {
          label: "Backhand",
          data: backhandAcc,
          borderColor: colorConfig["Backhand"][player].border,
          backgroundColor: gradBackhandAcc,
          fill: true,
          pointRadius: 10,        // Increase the radius of the points
          pointHoverRadius: 7,   // Increase the radius when hovering
          tension: 0.1
        }
      ];
      
      if (accuracyChart) {
        accuracyChart.data.labels = labels;
        accuracyChart.data.datasets = accuracyDatasets;
        accuracyChart.update();
      } else {
        accuracyChart = new Chart(ctxAcc, {
          type: 'line',
          data: { labels: labels, datasets: accuracyDatasets },
          options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
              x: { title: { display: true, text: 'Session', color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' } },
              y: { title: { display: true, text: 'Accuracy (%)', color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#fff' }, min: 0, max: 100 }
            }
          }
        });
      }
    }
  }
  
  /* ===================== On Page Load ===================== */
  window.onload = function() {
    loadDataFromFolder();
  };
  