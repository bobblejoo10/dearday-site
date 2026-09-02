#!/usr/bin/env node

//
// 디어데이클래스 · 보안 규격 검사
//
// ai-leaders-site 의 같은 이름 파일에서 "어느 저장소에나 통하는 부분"만 가져왔습니다.
// 거기 있던 관리자 흔적 검사·광고 태그 검사·특정 페이지 검사는 그 저장소에만 있는 것이라 뺐습니다.
// 디어데이 쪽 페이지가 붙는 3단계 이후에 필요한 검사를 여기에 더합니다.
//
// 보는 것
//   1. _headers 에 CSP 와 프레임 차단이 있는지
//   2. CSP 에 아무 데나 열어주는 값(* · https: · unsafe-eval · unsafe-inline)이 없는지
//   3. src/pages 의 HTML 이 CSP 에 없는 바깥 주소를 부르지 않는지
//   4. 공용 데이터 접근 파일이 민감한 기록을 되돌려주지 않는지
//

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];

async function text(path) {
  return (await readFile(resolve(projectRoot, path), 'utf8')).replace(/\r\n/g, '\n');
}

async function textOrNull(path) {
  try { return await text(path); } catch (error) { return null; }
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

function parseCspDirectives(line) {
  const directives = new Map();
  const policy = line.replace(/^\s*Content-Security-Policy:\s*/i, '');
  for (const part of policy.split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    directives.set(tokens[0], new Set(tokens.slice(1)));
  }
  return directives;
}

function cspSourceAllowsUrl(sources, value) {
  let url;
  try { url = new URL(value); } catch (error) { return false; }
  for (const source of sources || []) {
    if (source === "'self'" || source === 'data:' || source === 'blob:') continue;
    if (source.startsWith('https://*.')) {
      const wildcardHost = source.slice('https://*.'.length);
      if (url.protocol === 'https:' && url.hostname.endsWith(`.${wildcardHost}`)) return true;
      continue;
    }
    try {
      if (new URL(source).origin === url.origin) return true;
    } catch (error) {}
  }
  return false;
}

async function collectHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectHtmlFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

function externalResources(html) {
  const resources = [];
  const tags = /<(script|link|img|iframe|source)\b[^>]*>/gi;
  for (const match of html.matchAll(tags)) {
    const tagName = match[1].toLowerCase();
    const tag = match[0];
    const urlMatch = tag.match(/\b(?:src|href)=["'](https:\/\/[^"']+)["']/i);
    if (!urlMatch) continue;
    if (tagName === 'link' && !/\brel=["'][^"']*stylesheet/i.test(tag)) continue;
    const directive = {
      script: 'script-src',
      link: 'style-src',
      img: 'img-src',
      iframe: 'frame-src',
      source: 'media-src'
    }[tagName];
    resources.push({ directive, url: urlMatch[1] });
  }
  return resources;
}

// 1 · 2 — 응답 머리말
const headers = await text('src/static/_headers');
expect(headers.includes('Content-Security-Policy:'), '_headers 에 CSP 가 없습니다');
expect(headers.includes('X-Frame-Options: DENY'), '_headers 가 다른 사이트에 끼워 넣는 것을 막지 않습니다');
expect(headers.includes('X-Content-Type-Options: nosniff'), '_headers 에 nosniff 가 없습니다');

const cspLine = headers.split(/\r?\n/).find((line) => line.includes('Content-Security-Policy:')) || '';
expect(cspLine.length < 2000, 'CSP 한 줄이 너무 깁니다 (2000자 제한)');

const cspDirectives = parseCspDirectives(cspLine);
const allSources = Array.from(cspDirectives.values());
expect(!allSources.some((sources) => sources.has('*') || sources.has('https:') || sources.has('http:')),
  'CSP 에 아무 주소나 허용하는 값이 있습니다');
expect(!allSources.some((sources) => sources.has("'unsafe-eval'")), 'CSP 가 unsafe-eval 을 허용합니다');
expect(!(cspDirectives.get('script-src')?.has("'unsafe-inline'")), 'CSP 가 인라인 스크립트를 허용합니다');

// 3 — 페이지가 CSP 밖의 주소를 부르는지
const htmlFiles = await collectHtmlFiles(resolve(projectRoot, 'src/pages'));
for (const file of htmlFiles) {
  const page = await readFile(file, 'utf8');
  for (const resource of externalResources(page)) {
    expect(cspSourceAllowsUrl(cspDirectives.get(resource.directive), resource.url),
      `${relative(projectRoot, file)} : ${resource.directive} 가 ${resource.url} 을 허용하지 않습니다`);
  }
}

// 4 — 공용 데이터 접근 (아직 안 붙였으면 건너뜁니다)
const commonStore = await textOrNull('src/assets/supabase-store-common.js');
if (commonStore) {
  expect(commonStore.includes("Prefer: SENSITIVE_INSERT_TABLES[table] ? 'return=minimal'"),
    '신청 같은 민감한 기록을 넣을 때 그 내용이 되돌아옵니다');
  expect(commonStore.includes('activeSession.access_token'),
    '직원 권한 요청이 로그인 토큰을 쓰지 않습니다');
}

if (failures.length) {
  for (const failure of failures) console.error(`[보안검사] ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`[보안검사] 통과 — 페이지 ${htmlFiles.length}장`);
}
