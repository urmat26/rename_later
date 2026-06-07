const GITHUB_CACHE_KEY = 'github_cache';

async function loadGitHub(){
  const w = document.querySelector('.widget--github');
  if (!w) return false;
  flashWidget(w);
  const signal = window.__abortSignal;
  try{
    const res = await fetch('https://api.github.com/repos/urmat26/rename_later', {signal});
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    localStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify({data, ts: Date.now()}));

    document.getElementById('githubContent').innerHTML = `
      <div class="github-stats">
        <div class="github-stat">
          <div class="github-num">${data.stargazers_count}</div>
          <div class="github-label">⭐ звёзд</div>
        </div>
        <div class="github-stat">
          <div class="github-num">${data.forks_count}</div>
          <div class="github-label">🍴 форков</div>
        </div>
        <div class="github-stat">
          <div class="github-num">${data.open_issues_count}</div>
          <div class="github-label">❗ issues</div>
        </div>
      </div>
      <div class="github-meta">
        <a href="${data.html_url}" target="_blank">${data.full_name}</a>
        ${data.description ? '· ' + data.description : ''}
      </div>`;
    animateIn(document.getElementById('githubContent'));
    return true;
  }catch(e){
    if (e.name === 'AbortError') return false;
    const cache = localStorage.getItem(GITHUB_CACHE_KEY);
    if (cache) {
      const {data} = JSON.parse(cache);
      document.getElementById('githubContent').innerHTML = `
        <div class="github-stats">
          <div class="github-stat"><div class="github-num">${data.stargazers_count}</div><div class="github-label">⭐ звёзд</div></div>
          <div class="github-stat"><div class="github-num">${data.forks_count}</div><div class="github-label">🍴 форков</div></div>
          <div class="github-stat"><div class="github-num">${data.open_issues_count}</div><div class="github-label">❗ issues</div></div>
        </div>
        <div class="github-meta" style="color:var(--red)">⚠ Кэшированные данные</div>`;
    } else {
      document.getElementById('githubContent').innerHTML = '<div class="widget-error">⚠ Нет данных</div>';
    }
    return false;
  }
}
