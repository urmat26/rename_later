let weatherChart = null;
let chartDailyData = null;
let currentChartType = 'line';

function updateWeatherChart(daily){
  chartDailyData = daily;
  renderChart(currentChartType);
}

const WEATHER_GROUPS = {
  '☀️ Ясно':       {codes: [0],                 color: '#fbbf24'},
  '⛅ Облачно':     {codes: [1,2,3],             color: '#a78bfa'},
  '🌫 Туман':       {codes: [45,48],             color: '#94a3b8'},
  '🌧 Дождь':       {codes: [51,53,55,56,57,61,63,65,66,67,80,81,82], color: '#60a5fa'},
  '❄️ Снег':        {codes: [71,73,75,77,85,86], color: '#e2e8f0'},
  '⛈ Гроза':        {codes: [95,96,99],           color: '#f87171'},
};

function groupWeatherCodes(codes){
  const counts = {};
  for (const key in WEATHER_GROUPS) counts[key] = 0;
  codes.forEach(code => {
    for (const [label, group] of Object.entries(WEATHER_GROUPS)){
      if (group.codes.includes(code)) { counts[label]++; return; }
    }
  });
  return Object.entries(counts).filter(([,v]) => v > 0);
}

function renderChart(type){
  const isDark = document.documentElement.dataset.theme==='dark';
  const textColor = isDark?'rgba(240,240,248,0.5)':'#5f6368';
  if(!chartDailyData) return;

  if(weatherChart){ weatherChart.destroy(); weatherChart=null; }
  const ctx = document.getElementById('weatherChart').getContext('2d');

  if (type === 'pie'){
    const grouped = groupWeatherCodes(chartDailyData.weathercode);
    weatherChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: grouped.map(([l]) => l),
        datasets: [{
          data: grouped.map(([,v]) => v),
          backgroundColor: grouped.map(([l]) => WEATHER_GROUPS[l].color),
          borderColor: isDark ? '#111118' : '#ffffff',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: {duration: 600, easing: 'easeInOutQuart'},
        plugins: {
          legend: {
            position: 'bottom',
            labels: {color: textColor, font: {family: "'Space Mono'", size: 10}, boxWidth: 12, padding: 14}
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.parsed} дн.`
            }
          }
        }
      }
    });
    return;
  }

  const gridColor = isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.07)';
  const labels = chartDailyData.time.map(d=>{
    const dt = new Date(d);
    return dt.toLocaleDateString('ru',{weekday:'short',day:'numeric'});
  });

  weatherChart = new Chart(ctx,{
    type,
    data:{
      labels,
      datasets:[
        {label:'Макс °C',data:chartDailyData.temperature_2m_max,
         borderColor:'#ef4444',backgroundColor:type==='bar'?'rgba(239,68,68,0.6)':'rgba(239,68,68,0.12)',
         tension:0.4,fill:type==='line',pointRadius:5,pointHoverRadius:8,
         pointBackgroundColor:'#ef4444'},
        {label:'Мин °C',data:chartDailyData.temperature_2m_min,
         borderColor:'#3b82f6',backgroundColor:type==='bar'?'rgba(59,130,246,0.6)':'rgba(59,130,246,0.08)',
         tension:0.4,fill:type==='line',pointRadius:5,pointHoverRadius:8,
         pointBackgroundColor:'#3b82f6'},
      ]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      animation:{duration:600,easing:'easeInOutQuart'},
      plugins:{
        legend:{labels:{color:textColor,font:{family:"'Space Mono'",size:11},boxWidth:12,padding:16}}
      },
      scales:{
        x:{grid:{color:gridColor},ticks:{color:textColor,font:{family:"'Space Mono'",size:10}}},
        y:{grid:{color:gridColor},ticks:{color:textColor,font:{family:"'Space Mono'",size:10},callback:v=>v+'°'}}
      }
    }
  });
}

function switchChart(type, btn){
  currentChartType = type;
  document.querySelectorAll('.chart-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  renderChart(type);
}

function updateChartTheme(){
  if(!weatherChart||!chartDailyData) return;
  renderChart(currentChartType);
}
