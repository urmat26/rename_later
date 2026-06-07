let refreshTimer = null;
let refreshRemain = CONFIG.UPDATE_INTERVAL;
let fetchController = null;

function toggleTheme(){
  const h = document.documentElement;
  const next = h.dataset.theme==='dark'?'light':'dark';
  h.dataset.theme = next;
  localStorage.setItem('infodash_theme', next);
  if(weatherChart) updateChartTheme();
}

function restoreTheme(){
  const saved = localStorage.getItem('infodash_theme');
  if (saved === 'light' || saved === 'dark'){
    document.documentElement.dataset.theme = saved;
  }
}

function flashWidget(widget){
  widget.classList.add('updating');
  setTimeout(()=>widget.classList.remove('updating'), 800);
}

function flashAll(){
  document.querySelectorAll('.widget').forEach(w=>flashWidget(w));
}

function animateIn(el){
  el.classList.remove('flip');
  void el.offsetWidth;
  el.classList.add('flip');
}

function setStatus(state, text){
  const dot = document.getElementById('statusDot');
  const label = document.getElementById('statusText');
  dot.className = 'dot' + (state==='ok'?' pulsing':state==='loading'?' loading':' error');
  label.textContent = text;
}

function startRefreshBar(){
  clearInterval(refreshTimer);
  refreshRemain = CONFIG.UPDATE_INTERVAL;
  const fill = document.getElementById('refreshFill');
  fill.style.transition = 'none';
  fill.style.width = '100%';
  setTimeout(()=>{
    fill.style.transition = `width ${CONFIG.UPDATE_INTERVAL}s linear`;
    fill.style.width = '0%';
  }, 50);
  refreshTimer = setInterval(()=>{
    refreshRemain--;
    if(refreshRemain <= 0) clearInterval(refreshTimer);
    document.getElementById('statusText').textContent =
      refreshRemain > 0 ? `обн через ${refreshRemain}с` : 'обновление...';
  }, 1000);
}

const RU_FACTS = [
  'Осьминоги имеют три сердца и голубую кровь — в ней медь вместо железа.',
  'Мёд не портится. В египетских пирамидах находили мёд возрастом 3000 лет — съедобный.',
  'Банан — технически ягода, а клубника — нет. Авокадо тоже ягода.',
  'Человек — единственное животное, которое краснеет от смущения.',
  'Кошки не чувствуют сладкого вкуса — у них нет нужных рецепторов.',
  'Гусеница полностью растворяется внутри кокона, прежде чем стать бабочкой.',
  'Молния ударяет в Землю около 100 раз каждую секунду.',
  'Акулы старше деревьев: акулы — 400 млн лет, деревья — 350 млн.',
  'Мозг потребляет 20% энергии тела, хотя весит лишь 2%.',
  'Кальмары имеют самые большие глаза среди животных — до 30 см в диаметре.',
  'В теле человека больше бактерий, чем собственных клеток.',
  'Сердце кита бьётся около 2 раз в минуту во время погружения.',
  'Золото есть в крови человека — около 0.2 мг в теле взрослого.',
  'Слоны — единственные крупные животные, которые не умеют прыгать.',
  'Мурашки по коже — рудиментарный рефлекс: шерсть поднималась, чтобы казаться больше.',
  'Клетки тела обновляются примерно за 7–10 лет.',
  'Паук-павлин исполняет уникальный танец для каждой самки.',
  'Снежинки падают со скоростью около 5 км/ч.',
  'На Луне тише, чем в анэхоидной камере — там нет атмосферы для звука.',
  'Мёртвое море настолько солёное, что в нём невозможно утонуть.',
];

let lastFactIdx = -1;

function showFact(text){
  const el = document.getElementById('factText');
  el.style.opacity = '0';
  el.style.transform = 'translateY(6px)';
  setTimeout(()=>{
    el.textContent = `"${text}"`;
    el.style.transition = 'opacity 0.4s, transform 0.4s';
    el.style.opacity = '1';
    el.style.transform = 'none';
  }, 200);
}

async function loadFact(){
  const signal = window.__abortSignal;
  try{
    const res = await fetch(CONFIG.FACT_API, {signal});
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    const text = data.text || data.value || '—';
    localStorage.setItem('fact_cache', JSON.stringify({text, ts: Date.now()}));
    showFact(text);
    return true;
  }catch(e){
    if (e.name === 'AbortError') return false;
    const cache = localStorage.getItem('fact_cache');
    if (cache) {
      const {text} = JSON.parse(cache);
      showFact(text + ' ⚠');
    } else {
      let idx;
      do { idx = Math.floor(Math.random()*RU_FACTS.length); } while(idx===lastFactIdx);
      lastFactIdx = idx;
      showFact(RU_FACTS[idx]);
    }
    return false;
  }
}

async function updateAll(){
  if (fetchController) fetchController.abort();
  fetchController = new AbortController();
  window.__abortSignal = fetchController.signal;
  setStatus('loading','обновление...');
  flashAll();
  const results = await Promise.allSettled([
    loadWeather(), loadCurrency(), loadNews(), loadFact(), loadCrypto(), loadGitHub()
  ]);
  const ok = results.every(r=>r.status==='fulfilled'&&r.value!==false);
  setStatus(ok?'ok':'error', ok?'обн через...':'частичные ошибки');
  startRefreshBar();
}

function initDragDrop(){
  const grid = document.querySelector('.grid');
  let dragEl = null;

  document.querySelectorAll('.widget').forEach(w => {
    w.setAttribute('draggable', 'true');
    w.addEventListener('dragstart', () => { dragEl = w; w.style.opacity = '0.4'; });
    w.addEventListener('dragend', () => { w.style.opacity = '1'; });
    w.addEventListener('dragover', e => { e.preventDefault(); w.style.borderColor = 'var(--accent)'; });
    w.addEventListener('dragleave', () => { w.style.borderColor = ''; });
    w.addEventListener('drop', e => {
      e.preventDefault();
      w.style.borderColor = '';
      if (dragEl && dragEl !== w) {
        const items = [...grid.children];
        const from = items.indexOf(dragEl);
        const to = items.indexOf(w);
        if (from < to) grid.insertBefore(dragEl, w.nextSibling);
        else grid.insertBefore(dragEl, w);
        saveGridOrder();
      }
    });
  });
}

function saveGridOrder(){
  const ids = [...document.querySelectorAll('.widget')].map(w => w.className);
  localStorage.setItem('infodash_grid', JSON.stringify(ids));
}

function restoreGridOrder(){
  const saved = localStorage.getItem('infodash_grid');
  if (!saved) return;
  const ids = JSON.parse(saved);
  const grid = document.querySelector('.grid');
  const widgets = {};
  document.querySelectorAll('.widget').forEach(w => { widgets[w.className] = w; });
  ids.forEach(cls => {
    if (widgets[cls]) grid.appendChild(widgets[cls]);
  });
}

restoreTheme();
updateClock();
setInterval(updateClock, 1000);

window.addEventListener('load', async ()=>{
  restoreCity();
  restoreGridOrder();
  initDragDrop();
  await updateAll();
  setInterval(updateAll, CONFIG.UPDATE_INTERVAL * 1000);
});
