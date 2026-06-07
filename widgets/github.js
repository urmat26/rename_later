const GITHUB_CACHE_KEY = 'github_cache';

async function loadGitHub(){
  const w = document.querySelector('.widget--github');
  if (!w) return false;
  flashWidget(w);
  const signal = window.__abortSignal;
  try{
    const [repoRes, commitsRes, contribRes] = await Promise.all([
      fetch('https://api.github.com/repos/urmat26/infoDash', {signal}),
      fetch('https://api.github.com/repos/urmat26/infoDash/commits?per_page=1', {signal}),
      fetch('https://api.github.com/repos/urmat26/infoDash/contributors?per_page=1&anon=true', {signal})
    ]);
    if (!repoRes.ok) throw new Error(repoRes.status);
    if (!commitsRes.ok) throw new Error(commitsRes.status);
    if (!contribRes.ok) throw new Error(contribRes.status);

    const data = await repoRes.json();
    const commitLink = commitsRes.headers.get('Link');
    const commitCount = commitLink ? (parseInt(commitLink.match(/page=(\d+)>; rel="last"/)?.[1]) || 1) : 1;
    const contribLink = contribRes.headers.get('Link');
    const contribCount = contribLink ? (parseInt(contribLink.match(/page=(\d+)>; rel="last"/)?.[1]) || 1) : 1;

    const cacheData = {data, commitCount, contribCount, ts: Date.now()};
    localStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify(cacheData));

    renderGitHub(data, commitCount, contribCount, false);
    return true;
  }catch(e){
    if (e.name === 'AbortError') return false;
    const cache = localStorage.getItem(GITHUB_CACHE_KEY);
    if (cache) {
      const cached = JSON.parse(cache);
      renderGitHub(cached.data, cached.commitCount || 0, cached.contribCount || 0, true);
    } else {
      document.getElementById('githubContent').innerHTML = '<div class="widget-error">⚠ Нет данных</div>';
    }
    return false;
  }
}

function renderGitHub(data, commitCount, contribCount, stale){
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
      <div class="github-stat">
        <div class="github-num">${contribCount}</div>
        <div class="github-label">👥 контрибьюторов</div>
      </div>
    </div>
    <div class="github-meta"${stale ? ' style="color:var(--red)"' : ''}>
      <a href="${data.html_url}" target="_blank">${data.full_name}</a>
      ${data.description ? '· ' + data.description : ''}
      ${stale ? '⚠ Кэш' : ''}
    </div>`;
  if (!stale) animateIn(document.getElementById('githubContent'));
}
