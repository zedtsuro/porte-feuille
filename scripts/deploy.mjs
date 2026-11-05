// Déploie le build sur la branche gh-pages (GitHub Pages).
// Usage : npm run deploy
import { execSync } from 'node:child_process';
import { copyFileSync, writeFileSync } from 'node:fs';

const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const remote = execSync('git remote get-url origin').toString().trim();
const repo = remote.replace(/\.git$/, '').split('/').pop();

run(`npx vite build --base=/${repo}/`);

// Fallback SPA : GitHub Pages sert 404.html pour les routes inconnues (/budgets, /transactions…)
copyFileSync('dist/index.html', 'dist/404.html');
writeFileSync('dist/.nojekyll', '');

const git = (cmd) => run(`git ${cmd}`, { cwd: 'dist' });
git('init -q -b gh-pages');
git('add -A');
git('-c user.name=deploy -c user.email=deploy@localhost commit -q -m "Déploiement"');
git(`push -f ${remote} gh-pages`);

console.log(`\nDéployé : https://${remote.split('/').at(-2)}.github.io/${repo}/`);
