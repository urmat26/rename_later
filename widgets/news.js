const NEWS_CACHE_KEY = 'news_cache';
let activeNewsTab = 0;

const NEWS_RSS = {
  all: 'https://lenta.ru/rss/news',
  tech: 'https://habr.com/ru/rss/all',
  world: 'https://lenta.ru/rss/articles/world',
};

async function loadNews(){
  const w = document.querySelector('.widget--news');
  flashWidget(w);
  const signal = window.__abortSignal;
  try {
    const keys = Object.keys(NEWS_RSS);
    const results = await Promise.allSettled(
      keys.map(key => fetchFromRss(key, signal))
    );

    const allNews = {};
    keys.forEach((key, i) => {
      allNews[key] = results[i].status === 'fulfilled'
        ? results[i].value
        : [{title: '⚠ Не удалось загрузить новости', url: '#', src: 'ошибка', t: ''}];
    });

    localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify({data: allNews, ts: Date.now()}));
    renderNews(activeNewsTab, allNews);
    const label = document.querySelector('.widget--news .widget-label');
    label.innerHTML = label.innerHTML.replace(' ⚠', '');
    return true;
  } catch(e) {
    if (e.name === 'AbortError') return false;
    const cache = localStorage.getItem(NEWS_CACHE_KEY);
    if (cache) {
      const {data} = JSON.parse(cache);
      renderNews(activeNewsTab, data);
      const label = document.querySelector('.widget--news .widget-label');
      if (!label.innerHTML.includes('⚠')) label.innerHTML += ' ⚠';
    } else {
      document.getElementById('newsContent').innerHTML = '<div class="widget-error">⚠ Нет данных</div>';
    }
    return false;
  }
}

async function fetchFromRss(key, signal){
  const rssUrl = NEWS_RSS[key];
  const proxy = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
  const res = await fetch(proxy, {signal});
  if (!res.ok) throw new Error(res.status);
  const json = await res.json();
  if (json.status !== 'ok') throw new Error(json.message);
  return json.items.slice(0, 5).map(item => ({
    title: item.title,
    url: item.link,
    src: key === 'tech' ? 'Хабр' : 'Лента',
    t: item.pubDate ? new Date(item.pubDate).toLocaleDateString('ru') : '',
  }));
}

function renderNews(tabIdx, data){
  if (!data) {
    const cached = localStorage.getItem(NEWS_CACHE_KEY);
    data = cached ? JSON.parse(cached).data : {};
  }
  const keys = Object.keys(data);
  const key = keys[tabIdx] || keys[0];
  const items = data[key] || [];
  const html = `<div class="news-list">${items.map(n=>`
    <div class="news-item">
      <div class="news-title"><a href="${n.url}" target="_blank">${n.title}</a></div>
      <div class="news-meta">${n.src} · ${n.t}</div>
    </div>`).join('')}</div>`;
  document.getElementById('newsContent').innerHTML = html;
  animateIn(document.getElementById('newsContent'));
}

function switchNews(idx, btn){
  activeNewsTab = idx;
  document.querySelectorAll('.news-tab').forEach((t,i)=>t.classList.toggle('active',i===idx));
  loadNews();
}
