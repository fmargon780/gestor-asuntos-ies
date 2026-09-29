/* Prueba de la fila 225 (docs/AVISO-ESPERANDO-PERMISO.md), sin navegador:
   scripts/aviso-esperando.sh deja una marca en la rama "avisos" de GitHub
   cuando Claude Code se para a pedir un permiso o a preguntar, para que el
   Centro de mando no la dé por parada a los 30/90 minutos.

   Se monta un repositorio de mentira (un "origin" bare local) y una copia
   de trabajo aparte, y se ejecuta el script de verdad contra los dos,
   nunca contra este repositorio real.

   1. "esperando" deja en la rama avisos un ESPERANDO.json con
      estado":"esperando" y la fila EN CURSO de un docs/COLA.md de ejemplo.
   2. "libre" sin marca no hace nada; con marca, deja estado":"libre" y
      borra la marca.
   3. La rama de trabajo y la copia de trabajo quedan intactas (git status
      limpio, mismo HEAD).
   4. Con origin inalcanzable, sale con 0 (y rápido: no se queda colgado). */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const RAIZ = new URL('../', import.meta.url).pathname;
const SCRIPT = path.join(RAIZ, 'scripts/aviso-esperando.sh');

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

function git(args, cwd) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error('git ' + args.join(' ') + ' falló: ' + r.stderr);
  return r.stdout.trim();
}

function ejecutarScript(modo, { repo, tmpdir, mensaje = '', proyecto = repo } = {}) {
  const r = spawnSync('bash', [SCRIPT, modo], {
    cwd: repo,
    input: mensaje === null ? '' : JSON.stringify({ message: mensaje }),
    encoding: 'utf8',
    env: { ...process.env, TMPDIR: tmpdir, CLAUDE_PROJECT_DIR: proyecto },
  });
  return r;
}

function leerAvisos(bare) {
  const r = spawnSync('git', ['show', 'avisos:ESPERANDO.json'], { cwd: bare, encoding: 'utf8' });
  if (r.status !== 0) return null;
  try { return JSON.parse(r.stdout); } catch (e) { return null; }
}

/* --- Montaje: origin (bare) + copia de trabajo, con un docs/COLA.md
   de mentira que tiene una fila EN CURSO --- */
const raizTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aviso-esperando-'));
const bare = path.join(raizTmp, 'origin.git');
const repo = path.join(raizTmp, 'repo');
const flagDir = path.join(raizTmp, 'flagdir');
fs.mkdirSync(flagDir);

git(['init', '--bare', '-q', bare], raizTmp);
git(['init', '-q', repo], raizTmp);
git(['config', 'user.email', 'prueba@example.com'], repo);
git(['config', 'user.name', 'Prueba'], repo);
fs.mkdirSync(path.join(repo, 'docs'));
fs.writeFileSync(path.join(repo, 'docs/COLA.md'), [
  '| Nº | Instrucción | Estado |',
  '|---|---|---|',
  '| 225 | `docs/AVISO-ESPERANDO-PERMISO.md` (algo) | EN CURSO (28-sep-2026 22:17) · conversación: sin enlace |',
  '| 203 | otra fila | PENDIENTE (27-sep-2026) |',
  '',
].join('\n'));
fs.writeFileSync(path.join(repo, 'vercel.json'), JSON.stringify({ git: { deploymentEnabled: { avisos: false } } }));
fs.mkdirSync(path.join(repo, 'scripts'));
fs.writeFileSync(path.join(repo, 'scripts/vercel-ignore-build.sh'), '#!/bin/bash\nexit 0\n');
git(['add', 'docs/COLA.md', 'vercel.json', 'scripts/vercel-ignore-build.sh'], repo);
git(['commit', '-q', '-m', 'inicial'], repo);
git(['remote', 'add', 'origin', bare], repo);
const ramaInicial = git(['rev-parse', '--abbrev-ref', 'HEAD'], repo);
git(['push', '-q', 'origin', 'HEAD:' + ramaInicial], repo);
const headInicial = git(['rev-parse', 'HEAD'], repo);

/* 1. "esperando" escribe en avisos, con la fila EN CURSO y el motivo */
const r1 = ejecutarScript('esperando', { repo, tmpdir: flagDir, mensaje: 'Claude needs your permission to use the Bash tool' });
const flag = path.join(flagDir, 'aviso-esperando.flag');
const aviso1 = leerAvisos(bare);
comprobar('1. el script sale con 0', r1.status, 0);
comprobar('1. no imprime nada en la salida estándar', r1.stdout, '');
comprobar('1. deja la marca local', fs.existsSync(flag), true);
comprobar('1. ESPERANDO.json en avisos: estado esperando', aviso1 && aviso1.estado, 'esperando');
comprobar('1. ESPERANDO.json: la fila EN CURSO del docs/COLA.md de mentira', aviso1 && aviso1.fila, '225');
comprobar('1. ESPERANDO.json: motivo permiso (el mensaje habla de "permission")', aviso1 && aviso1.motivo, 'permiso');
comprobar('1. ESPERANDO.json: mensaje recortado', aviso1 && aviso1.mensaje, 'Claude needs your permission to use the Bash tool');
comprobar('1. ESPERANDO.json: desde, en ISO y UTC', typeof (aviso1 && aviso1.desde) === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(aviso1.desde), true);

/* 1d. el árbol de avisos lleva también vercel.json y el script del
   ignoreCommand (sin ellos, Vercel no tiene con qué decidir que esa
   rama no debe publicar: comprobado publicando de verdad) */
const ficherosDeAvisos = git(['ls-tree', '-r', '--name-only', 'avisos'], bare).split('\n').sort();
comprobar('1d. el árbol de avisos lleva ESPERANDO.json, vercel.json y el script', ficherosDeAvisos,
  ['ESPERANDO.json', 'scripts/vercel-ignore-build.sh', 'vercel.json']);
comprobar('1d. el vercel.json de avisos es una copia fiel del de la copia de trabajo',
  git(['show', 'avisos:vercel.json'], bare), fs.readFileSync(path.join(repo, 'vercel.json'), 'utf8'));
comprobar('1d. y el script, también',
  git(['show', 'avisos:scripts/vercel-ignore-build.sh'], bare), fs.readFileSync(path.join(repo, 'scripts/vercel-ignore-build.sh'), 'utf8').trim());

/* motivo "pregunta" cuando el mensaje no habla de permiso */
const bare2 = path.join(raizTmp, 'origin2.git');
git(['clone', '--bare', '-q', bare, bare2], raizTmp);
const repo2 = path.join(raizTmp, 'repo2');
git(['clone', '-q', bare2, repo2], raizTmp);
git(['config', 'user.email', 'prueba@example.com'], repo2);
git(['config', 'user.name', 'Prueba'], repo2);
const flagDir2 = path.join(raizTmp, 'flagdir2');
fs.mkdirSync(flagDir2);
const r1b = ejecutarScript('esperando', { repo: repo2, tmpdir: flagDir2, mensaje: '¿Sigo con la fila 225 o con la 203?' });
const aviso1b = leerAvisos(bare2);
comprobar('1b. sin la palabra "permission", motivo pregunta', aviso1b && aviso1b.motivo, 'pregunta');
comprobar('1b. sale con 0', r1b.status, 0);

/* mensaje vacío o JSON roto no rompe nada */
const r1c = ejecutarScript('esperando', { repo: repo2, tmpdir: flagDir2, mensaje: null });
comprobar('1c. sin mensaje (JSON vacío) sale con 0', r1c.status, 0);

/* 2. "libre" sin marca no hace nada */
fs.rmSync(flagDir2, { recursive: true, force: true });
fs.mkdirSync(flagDir2);
const antesDeLibreSinMarca = git(['rev-parse', 'avisos'], bare2);
const r2a = ejecutarScript('libre', { repo: repo2, tmpdir: flagDir2 });
const despuesDeLibreSinMarca = git(['rev-parse', 'avisos'], bare2);
comprobar('2. "libre" sin marca sale con 0', r2a.status, 0);
comprobar('2. "libre" sin marca no toca la rama avisos', despuesDeLibreSinMarca, antesDeLibreSinMarca);

/* "libre" con marca deja estado libre y borra la marca */
ejecutarScript('esperando', { repo, tmpdir: flagDir, mensaje: 'esperando de nuevo' });
comprobar('2b. la marca existe antes de "libre"', fs.existsSync(flag), true);
const r2b = ejecutarScript('libre', { repo, tmpdir: flagDir });
const aviso2 = leerAvisos(bare);
comprobar('2b. "libre" con marca sale con 0', r2b.status, 0);
comprobar('2b. ESPERANDO.json pasa a estado libre', aviso2 && aviso2.estado, 'libre');
comprobar('2b. ESPERANDO.json: fila vacía en libre', aviso2 && aviso2.fila, '');
comprobar('2b. "libre" borra la marca local', fs.existsSync(flag), false);

/* 2c. el segundo aviso encadena con el primero (Vercel trata el primer
   envío de una rama nueva como "hay que publicar sí o sí", ignoreCommand
   incluido; con padre deja de parecer una rama nueva desde el segundo) */
const padreAntes = git(['rev-parse', 'avisos'], bare);
ejecutarScript('esperando', { repo, tmpdir: flagDir, mensaje: 'un aviso más, para comprobar el padre' });
const commitNuevo = git(['rev-parse', 'avisos'], bare);
const padreDelNuevo = git(['rev-parse', commitNuevo + '^'], bare);
comprobar('2c. el commit nuevo de avisos tiene un padre (no es huérfano)', typeof padreDelNuevo === 'string' && padreDelNuevo.length === 40, true);
comprobar('2c. y ese padre es el aviso anterior', padreDelNuevo, padreAntes);

/* 3. la copia de trabajo y su rama quedan intactas */
const statusFinal = git(['status', '--porcelain'], repo);
const headFinal = git(['rev-parse', 'HEAD'], repo);
const ramaFinal = git(['rev-parse', '--abbrev-ref', 'HEAD'], repo);
comprobar('3. git status limpio en la copia de trabajo', statusFinal, '');
comprobar('3. mismo HEAD que al principio', headFinal, headInicial);
comprobar('3. sigue en la misma rama (nunca cambia de rama)', ramaFinal, ramaInicial);

/* 4. con origin inalcanzable, sale con 0 y no se queda colgado */
const repoSinOrigen = path.join(raizTmp, 'repo-sin-origen');
git(['clone', '-q', repo, repoSinOrigen], raizTmp);
git(['remote', 'set-url', 'origin', path.join(raizTmp, 'esto-no-existe.git')], repoSinOrigen);
const flagDir3 = path.join(raizTmp, 'flagdir3');
fs.mkdirSync(flagDir3);
const empieza = Date.now();
const r4 = ejecutarScript('esperando', { repo: repoSinOrigen, tmpdir: flagDir3, mensaje: 'permission' });
const tardo = Date.now() - empieza;
comprobar('4. con origin inalcanzable, sale con 0', r4.status, 0);
comprobar('4. no se queda colgado (menos de 15 s)', tardo < 15000, true);

/* limpieza */
fs.rmSync(raizTmp, { recursive: true, force: true });

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
