#!/usr/bin/env node

// 실시간 미리보기용 개발 서버.
//
// 하는 일:
//   1. src/ 원본을 dist/ 로 한 번 빌드한다.
//   2. src/ 를 감시하다가 파일을 저장하면 dist/ 를 자동으로 다시 빌드한다.
//   3. dist/ 를 배포와 동일한 예쁜 URL(/course-free/ 등)로 서빙한다.
//   4. 열려 있는 브라우저 탭에 자동 새로고침 신호를 보낸다.
//
// 사용법 (VS Code 터미널에서):
//   node tools/dev-server.mjs
//   node tools/dev-server.mjs 3000   ← 포트를 바꾸고 싶을 때
//
// 그 뒤 브라우저에서 http://127.0.0.1:8766/ 를 연다.
// (같은 와이파이의 휴대폰에서는 http://컴퓨터IP:8766/ 로도 확인 가능)

import { spawn } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, statSync, watch } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = join(projectRoot, 'src');
const root = join(projectRoot, 'dist');
const buildScript = join(projectRoot, 'tools', 'build-cloudflare-pages.mjs');
const port = Number(process.argv[2] || 8766);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4'
};

// 브라우저에 주입해 자동 새로고침을 담당하는 스크립트.
const LIVE_RELOAD_SNIPPET = `\n<script data-dev-live-reload>
(function () {
  function connect() {
    var es = new EventSource('/__livereload');
    es.onmessage = function (e) { if (e.data === 'reload') location.reload(); };
    es.onerror = function () { es.close(); setTimeout(connect, 1000); };
  }
  connect();
})();
</script>\n`;

const clients = new Set();

function resolveTarget(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const safe = normalize(decoded).replace(/^[/\\]+/, '').replace(/^(\.\.[/\\])+/, '');
  let target = resolve(join(root, safe));
  if (!target.startsWith(root)) target = join(root, 'index.html');
  if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
  if ((!existsSync(target) || !statSync(target).isFile()) && /^\/course\/[^/]+\/?$/.test(decoded)) {
    target = join(root, 'course', 'index.html');
  }
  return target;
}

const server = createServer((req, res) => {
  const url = req.url || '/';

  if (url.startsWith('/__livereload')) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });
    res.write('retry: 1000\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  const target = resolveTarget(url);
  if (!existsSync(target) || !statSync(target).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const ext = extname(target).toLowerCase();
  const contentType = types[ext] || 'application/octet-stream';

  // HTML 이면 자동 새로고침 스크립트를 끼워 넣고, 그 외 파일은 그대로 스트리밍.
  if (ext === '.html') {
    let html = readFileSync(target, 'utf8');
    html = html.includes('</body>')
      ? html.replace('</body>', LIVE_RELOAD_SNIPPET + '</body>')
      : html + LIVE_RELOAD_SNIPPET;
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
    res.end(html);
    return;
  }

  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  createReadStream(target).pipe(res);
});

let building = false;
let rebuildQueued = false;
let debounceTimer = null;

function runBuild() {
  return new Promise((done) => {
    const child = spawn(process.execPath, [buildScript], { cwd: projectRoot });
    let errOut = '';
    child.stderr.on('data', (d) => { errOut += d; });
    child.on('close', (code) => {
      if (code === 0) {
        console.log('[dev] 빌드 완료 — 브라우저 새로고침');
      } else {
        console.error('[dev] 빌드 실패 (코드 ' + code + ')');
        if (errOut.trim()) console.error(errOut.trim());
      }
      done(code === 0);
    });
  });
}

async function rebuild() {
  if (building) { rebuildQueued = true; return; }
  building = true;
  const ok = await runBuild();
  building = false;
  if (ok) {
    for (const res of clients) res.write('data: reload\n\n');
  }
  if (rebuildQueued) { rebuildQueued = false; rebuild(); }
}

function scheduleRebuild() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(rebuild, 200);
}

async function start() {
  console.log('[dev] 첫 빌드 중...');
  await runBuild();

  try {
    watch(sourceDir, { recursive: true }, () => scheduleRebuild());
  } catch (err) {
    console.error('[dev] src 폴더 감시를 시작할 수 없습니다:', err.message);
  }

  server.listen(port, '0.0.0.0', () => {
    console.log('');
    console.log('  실시간 미리보기 서버가 켜졌습니다.');
    console.log('  브라우저에서 열기:  http://127.0.0.1:' + port + '/');
    console.log('  src/ 안의 파일을 저장하면 화면이 자동으로 새로고침됩니다.');
    console.log('  종료하려면 이 터미널에서 Ctrl + C');
    console.log('');
  });
}

start();
