const CRYPTO_IDS = {
  bitcoin: {label: 'BTC', icon: '₿'},
  ethereum: {label: 'ETH', icon: '⟠'},
  tether: {label: 'USDT', icon: '₮'},
};

const CRYPTO_CACHE_KEY = 'crypto_cache';

async function loadCrypto(){
  const w = document.querySelector('.widget--crypto');
  if (!w) return false;
  flashWidget(w);
  const signal = window.__abortSignal;
  try{
    const ids = Object.keys(CRYPTO_IDS).join(',');
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
      {signal}
    );
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    localStorage.setItem(CRYPTO_CACHE_KEY, JSON.stringify({data, ts: Date.now()}));

    let html = '';
    for (const [id, meta] of Object.entries(CRYPTO_IDS)){
      const coin = data[id];
      if (!coin) continue;
      const change = coin.usd_24h_change || 0;
      const cls = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
      const sym = cls === 'up' ? '▲' : cls === 'down' ? '▼' : '—';
      html += `<div class="crypto-item">
        <div class="crypto-top">
          <span class="crypto-icon">${meta.icon}</span>
          <span class="crypto-code">${meta.label}</span>
        </div>
        <div class="crypto-price">$${coin.usd.toLocaleString('ru', {minimumFractionDigits: 2})}</div>
        <div class="crypto-change ${cls}">${sym} ${Math.abs(change).toFixed(2)}%</div>
      </div>`;
    }

    document.getElementById('cryptoContent').innerHTML = html ||
      '<div class="widget-error">⚠ Нет данных</div>';
    animateIn(document.getElementById('cryptoContent'));
    return true;
  }catch(e){
    if (e.name === 'AbortError') return false;
    const cache = localStorage.getItem(CRYPTO_CACHE_KEY);
    if (cache) {
      const {data} = JSON.parse(cache);
      document.getElementById('cryptoContent').innerHTML = Object.entries(CRYPTO_IDS).map(([id, meta]) => {
        const coin = data[id];
        if (!coin) return '';
        return `<div class="crypto-item"><div class="crypto-top"><span class="crypto-icon">${meta.icon}</span><span class="crypto-code">${meta.label}</span></div><div class="crypto-price">$${coin.usd.toLocaleString('ru', {minimumFractionDigits: 2})}</div><div class="crypto-change flat">кэш</div></div>`;
      }).join('') || '<div class="widget-error">⚠ Нет данных</div>';
    } else {
      document.getElementById('cryptoContent').innerHTML = '<div class="widget-error">⚠ Нет данных</div>';
    }
    return false;
  }
}
