let prevRates = {};

async function loadCurrency(){
  const w = document.querySelector('.widget--currency');
  flashWidget(w);
  const signal = window.__abortSignal;
  try{
    const res = await fetch('https://v6.exchangerate-api.com/v6/a50032bc9b3ca7b0e5f85291/latest/USD', {signal});
    if(!res.ok) throw new Error(res.status);
    const data = await res.json();
    const rates = data.conversion_rates;
    const kgsPerUsd = rates.KGS;
    const currencies = CONFIG.EXCHANGE_TARGETS.map(code => ({
      code,
      kgs: rates.KGS / rates[code]
    }));
    localStorage.setItem('currency_cache', JSON.stringify({currencies,ts:Date.now()}));

    let html = '';
    currencies.forEach(({code,kgs})=>{
      const prev = prevRates[code] || kgs;
      const diff = kgs - prev;
      const cls = diff>0.001?'up':diff<-0.001?'down':'flat';
      const sym = cls==='up'?'▲':cls==='down'?'▼':'—';
      const flashCls = cls==='up'?' flash-up':cls==='down'?' flash-down':'';
      html += `<div class="currency-item${flashCls}">
        <div class="currency-code">${code} / KGS</div>
        <div class="currency-rate countup" data-target="${kgs.toFixed(2)}">${kgs.toFixed(1)}</div>
        <div class="currency-change ${cls}">${sym} ${Math.abs(diff).toFixed(3)}</div>
      </div>`;
      prevRates[code] = kgs;
    });

    document.getElementById('currencyContent').innerHTML = html;
    document.getElementById('currMeta').textContent =
      `Обновлено: ${new Date().toLocaleTimeString('ru')} · База: USD`;
    return true;
  }catch(e){
    if (e.name === 'AbortError') return false;
    const cache = localStorage.getItem('currency_cache');
    if(cache){
      const {currencies} = JSON.parse(cache);
      document.getElementById('currencyContent').innerHTML = currencies.map(({code,kgs})=>`
        <div class="currency-item">
          <div class="currency-code">${code} / KGS</div>
          <div class="currency-rate">${kgs.toFixed(1)}</div>
          <div class="currency-change flat">кэш</div>
        </div>`).join('');
      document.getElementById('currMeta').innerHTML = '<span style="color:var(--red)">⚠ Кэшированные данные</span>';
    } else {
      document.getElementById('currencyContent').innerHTML = '<div class="widget-error">⚠ Нет данных</div>';
    }
    return false;
  }
}
