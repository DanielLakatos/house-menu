import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.svg':'image/svg+xml' };
createServer(async (request,response) => {
  try { const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); let path = resolve(root, '.' + pathname); if (path !== root && !path.startsWith(root + sep)) throw Error(); if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html'); response.writeHead(200,{'Content-Type':mime[extname(path)] || 'application/octet-stream','Cache-Control':'no-store'}); response.end(await readFile(path)); }
  catch { response.writeHead(404); response.end('Not found'); }
}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
