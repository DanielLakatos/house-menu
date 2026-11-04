import { validateMenu, encodeText, decodeText } from './model.js';
export class GitHubMenu {
  constructor(config, token, request = globalThis.fetch.bind(globalThis)) { this.config = config; this.token = token; this.request = request; this.sha = null; }
  get url() { const c = this.config; return `https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/data/menu.json`; }
  async api(url, options = {}) {
    const response = await this.request(url, { ...options, headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${this.token}`, 'X-GitHub-Api-Version': '2022-11-28', ...options.headers } });
    if (!response.ok) {
      if ([409,422].includes(response.status)) throw new Error('The live menu changed or GitHub rejected the update. Your draft is safe. Export a backup, then reconnect to load the latest menu before trying again.');
      if ([401,403].includes(response.status)) throw new Error('GitHub could not authorize this action. Check the token, its expiry, and Contents read/write access to this repository.');
      throw new Error(`GitHub returned ${response.status}. Your draft is safe. Please try again later.`);
    }
    return response;
  }
  async load() {
    const response = await this.api(`${this.url}?ref=${encodeURIComponent(this.config.branch)}&t=${Date.now()}`); const file = await response.json();
    let text;
    if (file.content) text = decodeText(file.content);
    else { const raw = await this.api(`${this.url}?ref=${encodeURIComponent(this.config.branch)}&t=${Date.now()}`, { headers: { Accept: 'application/vnd.github.raw+json' } }); text = await raw.text(); }
    const menu = validateMenu(JSON.parse(text)); this.sha = file.sha; return menu;
  }
  async save(menu) {
    validateMenu(menu); if (!this.sha) throw new Error('Connect and load the live menu before publishing.');
    const content = JSON.stringify(menu, null, 2) + '\n';
    if (new TextEncoder().encode(content).length > 20 * 1024 * 1024) throw new Error('The menu exceeds 20 MB. Use smaller images or HTTPS image URLs before publishing.');
    const result = await this.api(this.url, { method: 'PUT', body: JSON.stringify({ message: 'Update house cocktail menu', content: encodeText(content), sha: this.sha, branch: this.config.branch }) });
    const saved = await result.json(); this.sha = saved.content.sha; return saved;
  }
  disconnect() { this.token = ''; this.sha = null; }
}
