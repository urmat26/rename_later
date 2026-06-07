const WMO = {
  0:'☀️ Ясно',1:'🌤 Почти ясно',2:'⛅ Переменная облачность',3:'☁️ Пасмурно',
  45:'🌫 Туман',48:'🌫 Изморозь',
  51:'🌦 Морось',61:'🌧 Лёгкий дождь',63:'🌧 Умеренный дождь',65:'🌧 Сильный дождь',
  71:'🌨 Слабый снег',73:'❄️ Умеренный снег',75:'❄️ Сильный снег',
  80:'🌦 Ливень',95:'⛈ Гроза',99:'⛈ Гроза с градом'
};

async function loadWeather(){
  const w = document.querySelector('.widget--weather');
  flashWidget(w);
  const signal = window.__abortSignal;
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${CONFIG.CITY_LAT}&longitude=${CONFIG.CITY_LON}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Asia%2FBishkek&forecast_days=7`;
    const res = await fetch(url, {signal});
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();
    const cur = data.current;
    const [icon,...words] = (WMO[cur.weather_code]||'🌡 Данные').split(' ');
    localStorage.setItem('weather_cache', JSON.stringify({cur,daily:data.daily,ts:Date.now()}));

    const el = document.getElementById('weatherContent');
    el.innerHTML = `
      <div class="weather-main">
        <div class="weather-info">
          <div class="weather-temp">${Math.round(cur.temperature_2m)}°</div>
          <div class="weather-desc">${words.join(' ')}</div>
          <div class="weather-city">${CONFIG.CITY} • Ощущ. как ${Math.round(cur.apparent_temperature)}°</div>
        </div>
        <div class="weather-icon-large">${icon}</div>
      </div>
      <div class="weather-meta">
        <div class="weather-pill"><span>💧 Влажность</span><strong>${cur.relative_humidity_2m}%</strong></div>
        <div class="weather-pill"><span>💨 Ветер</span><strong>${Math.round(cur.wind_speed_10m)} км/ч</strong></div>
      </div>`;
    animateIn(el);
    updateWeatherChart(data.daily);
    return true;
  }catch(e){
    if (e.name === 'AbortError') return false;
    const cache = localStorage.getItem('weather_cache');
    const c = cache ? JSON.parse(cache) : null;
    document.getElementById('weatherContent').innerHTML = c
      ? `<div class="widget-error">⚠ Кэш (API недоступен)</div>
         <div class="weather-temp">${Math.round(c.cur.temperature_2m)}°</div>`
      : `<div class="widget-error">⚠ Нет данных</div>`;
    return false;
  }
}

async function changeCity(city){
  const s = window.__abortSignal;
  try{
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=3&language=ru&format=json`, {signal: s});
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    if (!data.results || data.results.length === 0) { alert('Город не найден'); return; }
    let r;
    if (data.results.length === 1) {
      r = data.results[0];
    } else {
      const names = data.results.map((r,i) => `${i+1}. ${r.name}${r.admin1 ? ', ' + r.admin1 : ''}${r.country ? ', ' + r.country : ''}`);
      const choice = prompt(`Найдено несколько:\n${names.join('\n')}\n\nВведи номер (1-${data.results.length}):`);
      if (!choice) return;
      r = data.results[parseInt(choice)-1];
    }
    CONFIG.CITY = r.name;
    CONFIG.CITY_LAT = r.latitude;
    CONFIG.CITY_LON = r.longitude;
    localStorage.setItem('infodash_city', JSON.stringify({name: r.name, lat: r.latitude, lon: r.longitude}));
    document.querySelector('.widget--weather .widget-label').innerHTML =
      `🌤 погода · ${r.name.toLowerCase()} <span class="spin"></span>`;
    await loadWeather();
  }catch(e){
    if (e.name !== 'AbortError') alert('Ошибка поиска города');
  }
}

function restoreCity(){
  const saved = localStorage.getItem('infodash_city');
  if (saved) {
    const c = JSON.parse(saved);
    CONFIG.CITY = c.name;
    CONFIG.CITY_LAT = c.lat;
    CONFIG.CITY_LON = c.lon;
    document.querySelector('.widget--weather .widget-label').innerHTML =
      `🌤 погода · ${c.name.toLowerCase()} <span class="spin"></span>`;
  }
}
