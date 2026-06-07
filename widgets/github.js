const GITHUB_CACHE_KEY = 'github_cache';

async function loadGitHub(){
  const w = document.querySelector('.widget--github');
  if (!w) return false;
  flashWidget(w);
  const signal = window.__abortSignal;
  try{
    const [repoRes, commitsRes] = await Promise.all([
      fetch('https://api.github.com/repos/urmat26/infoDash', {signal}),
      fetch('https://api.github.com/repos/urmat26/infoDash/commits?per_page=1', {signal})
    ]);
    if (!repoRes.ok) throw new Error(repoRes.status);
    if (!commitsRes.ok) throw new Error(commitsRes.status);

    const data = await repoRes.json();
    const link = commitsRes.headers.get('Link');
    const commitCount = link ? (parseInt(link.match(/page=(\d+)>; rel="last"/)?.[1]) || 1) : 1;

    const cacheData = {data, commitCount, ts: Date.now()};
    localStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify(cacheData));

    renderGitHub(data, commitCount, false);
    return true;
  }catch(e){
    if (e.name === 'AbortError') return false;
    const cache = localStorage.getItem(GITHUB_CACHE_KEY);
    if (cache) {
      const {data, commitCount} = JSON.parse(cache);
      renderGitHub(data, commitCount, true);
    } else {
      document.getElementById('githubContent').innerHTML = '<div class="widget-error">⚠ Нет данных</div>';
    }
    return false;
  }
}

function renderGitHub(data, commitCount, stale){
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
      <div class="github-stat">
        <div class="github-num">${commitCount}</div>
        <div class="github-label">📝 коммитов</div>
      </div>
    </div>
    <div class="github-meta"${stale ? ' style="color:var(--red)"' : ''}>
      <a href="${data.html_url}" target="_blank">${data.full_name}</a>
      ${data.description ? '· ' + data.description : ''}
      ${stale ? '⚠ Кэш' : ''}
    </div>`;
  if (!stale) animateIn(document.getElementById('githubContent'));
}
