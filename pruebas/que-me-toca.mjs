/* Prueba en navegador de verdad de la pantalla "Qué me toca" (16-sep-2026,
   docs/QUE-ME-TOCA.md, sección 6). A 1905px, como pide el encargo. Nada
   de fechas escritas a mano: todo se cuenta desde hoy.

   No hace falta pasar por una guía ni por Hitos.marcar/crearDesdeGuia
   para levantar los datos: basta con crear las carpetas de los
   asuntos, apuntarlas en asuntos.json y escribir hitos.json a mano,
   con el mismo esquema que ya normaliza js/hitos.js. Así cada
   escenario controla exactamente qué estado, responsable, fecha y
   "desde" lleva cada hito.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, igual que
   pruebas/hitos.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1905, height: 1000 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

function isoDe(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function isoHaceDias(n) { const d = new Date(); d.setDate(d.getDate() - n); return isoDe(d); }
function isoDentroDeDias(n) { const d = new Date(); d.setDate(d.getDate() + n); return isoDe(d); }

/* ================= ENTRAR ================= */

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.click('#btn-barra');   /* la barra nace plegada: sin abrirla, las pestañas no se ven */

/* ================= LOS DATOS DE PRUEBA =================

   Tres asuntos, cinco hitos, todos `pendiente` o `encurso`:

   - "Asunto Tejado": h1 (yo, vencido ayer) y h2 (compañero, dentro de
     10 días). Los dos van a "En tu tejado"; h1 tiene que salir
     primero y en rojo.
   - "Asunto Otros": h3 (dirección, parado desde hace 2 días) y h4
     (dirección, parado desde hace 5 días). Los dos van a "Esperando a
     otros"; h4 tiene que salir primero (el más parado).
   - "Asunto SinFecha": h5 (yo, sin fecha límite). Va a "Sin fecha".

   El único vencido de los cinco es h1: la cuenta de la barra tiene
   que ser 1. */

const CLAVE_TEJADO = 'Asunto Tejado';
const CLAVE_OTROS = 'Asunto Otros';
const CLAVE_SINFECHA = 'Asunto SinFecha';

const FECHA_AYER = isoHaceDias(1);
const FECHA_MAS10 = isoDentroDeDias(10);
const DESDE_HACE2 = isoHaceDias(2);
const DESDE_HACE5 = isoHaceDias(5);

await pagina.evaluate(async ({ CLAVE_TEJADO, CLAVE_OTROS, CLAVE_SINFECHA,
                                FECHA_AYER, FECHA_MAS10, DESDE_HACE2, DESDE_HACE5 }) => {
  const abiertos = window.__disco.abiertos;
  await abiertos.getDirectoryHandle(CLAVE_TEJADO, { create: true });
  await abiertos.getDirectoryHandle(CLAVE_OTROS, { create: true });
  await abiertos.getDirectoryHandle(CLAVE_SINFECHA, { create: true });

  const g = await abiertos.getDirectoryHandle('_GESTOR', { create: true });

  const fAsuntos = await g.getFileHandle('asuntos.json', { create: true });
  const jAsuntos = JSON.parse(await (await fAsuntos.getFile()).text() || '{"asuntos":{}}');
  const ficha = (tercero) => ({
    estado: 'abierto', tipo: 'PRUEBA', categoria: 'ALUMNADO', tercero, abiertoPor: 'Francisco'
  });
  jAsuntos.asuntos[CLAVE_TEJADO] = ficha('Tercero Uno');
  jAsuntos.asuntos[CLAVE_OTROS] = ficha('Tercero Dos');
  jAsuntos.asuntos[CLAVE_SINFECHA] = ficha('Tercero Tres');
  const w1 = await fAsuntos.createWritable();
  await w1.write(JSON.stringify(jAsuntos));
  await w1.close();

  const fHitos = await g.getFileHandle('hitos.json', { create: true });
  const jHitos = {
    ajustes: {
      responsables: [
        { id: 'yo', nombre: 'Yo', clase: 'centro' },
        { id: 'companero', nombre: 'Mi compañero', clase: 'centro' },
        { id: 'direccion', nombre: 'Dirección', clase: 'centro' }
      ],
      noLectivos: []
    },
    porAsunto: {
      [CLAVE_TEJADO]: {
        creados: '2026-09-01', hitos: [
          { id: 'h1', titulo: 'Hito vencido', estado: 'pendiente', responsable: 'yo', fecha: FECHA_AYER },
          { id: 'h2', titulo: 'Hito futuro', estado: 'encurso', responsable: 'companero', fecha: FECHA_MAS10 }
        ]
      },
      [CLAVE_OTROS]: {
        creados: '2026-09-01', hitos: [
          { id: 'h3', titulo: 'Hito poco parado', estado: 'encurso', responsable: 'direccion', desde: DESDE_HACE2 },
          { id: 'h4', titulo: 'Hito muy parado', estado: 'pendiente', responsable: 'direccion', desde: DESDE_HACE5 }
        ]
      },
      [CLAVE_SINFECHA]: {
        creados: '2026-09-01', hitos: [
          { id: 'h5', titulo: 'Hito sin fecha', estado: 'pendiente', responsable: 'yo' }
        ]
      }
    }
  };
  const w2 = await fHitos.createWritable();
  await w2.write(JSON.stringify(jHitos));
  await w2.close();

  /* Como con cualquier fichero compartido: sin releer el registro,
     App.E.registro se quedaría con la copia vieja (sin estos tres
     asuntos), igual que en pruebas/hitos.mjs, escenario 2. */
  await App.cargarRegistro();
}, { CLAVE_TEJADO, CLAVE_OTROS, CLAVE_SINFECHA, FECHA_AYER, FECHA_MAS10, DESDE_HACE2, DESDE_HACE5 });

await pagina.click('#btn-recargar');
await pagina.waitForTimeout(400);

/* ================= ENTRAR EN "QUÉ ME TOCA" ================= */

await pagina.click('.pestana[data-pantalla="que-me-toca"]');
await pagina.waitForSelector('#pantalla-que-me-toca:not(.oculto)');
await pagina.waitForFunction(() => document.querySelectorAll('#qmt-cuerpo .qmt-fila').length >= 5);

/* ================= ESCENARIO 1: repartidos en los tres bloques ================= */

console.log('--- escenario 1: los cinco hitos salen repartidos en los tres bloques ---');
await comprobar('en tu tejado: h1 y h2',
  pagina.locator('.qmt-bloque-tejado .qmt-fila').evaluateAll(els => els.map(e => e.dataset.hito)),
  ['h1', 'h2']);
await comprobar('esperando a otros: h3 y h4',
  pagina.locator('.qmt-bloque-otros .qmt-fila').evaluateAll(els => els.map(e => e.dataset.hito).sort()),
  ['h3', 'h4']);
await comprobar('sin fecha: h5',
  pagina.locator('.qmt-sinfecha .qmt-fila').evaluateAll(els => els.map(e => e.dataset.hito)),
  ['h5']);

/* ================= ESCENARIO 2: el vencido, arriba y en rojo ================= */

console.log('--- escenario 2: el hito vencido sale arriba, en "en tu tejado" y en rojo ---');
await comprobar('h1 es la primera fila de "en tu tejado"',
  pagina.locator('.qmt-bloque-tejado .qmt-fila').first().getAttribute('data-hito'), 'h1');
await comprobar('h1 lleva la clase roja de vencido',
  pagina.locator('.qmt-bloque-tejado .qmt-fila[data-hito="h1"]').getAttribute('class')
    .then(c => c.indexOf('plazo-vencido') !== -1), true);
await comprobar('h2 (dentro de 10 días) no es vencido',
  pagina.locator('.qmt-bloque-tejado .qmt-fila[data-hito="h2"]').getAttribute('class')
    .then(c => c.indexOf('plazo-vencido') !== -1), false);

/* ================= ESCENARIO 3: esperando a otros, días parados ================= */

console.log('--- escenario 3: "esperando a otros", con los días parados bien contados ---');
await comprobar('h4 (5 días parado) sale antes que h3 (2 días parado)',
  pagina.locator('.qmt-bloque-otros .qmt-fila').evaluateAll(els => els.map(e => e.dataset.hito)),
  ['h4', 'h3']);
await comprobar('h4 dice "Dirección" y 5 días parado',
  pagina.locator('.qmt-bloque-otros .qmt-fila[data-hito="h4"] .qmt-fila-espera').textContent()
    .then(t => t.indexOf('Dirección') !== -1 && t.indexOf('5 días') !== -1), true);
await comprobar('el dato de días parado de h4 es 5, y el de h3 es 2',
  pagina.locator('.qmt-bloque-otros .qmt-fila-espera').evaluateAll(els => els.map(e => e.dataset.dias)),
  ['5', '2']);

/* ================= ESCENARIO 4: sin fecha ================= */

console.log('--- escenario 4: el hito sin fecha sale en "Sin fecha", plegado ---');
await comprobar('"Sin fecha" es un <details>, plegado de partida',
  pagina.evaluate(() => {
    const d = document.querySelector('.qmt-sinfecha');
    return d ? (d.tagName === 'DETAILS' && !d.open) : null;
  }), true);
await comprobar('h5 está dentro, aunque esté plegado (tiene que salir)',
  pagina.locator('.qmt-sinfecha .qmt-fila[data-hito="h5"]').count(), 1);

/* ================= ESCENARIO 5: el filtro por responsable ================= */

console.log('--- escenario 5: el filtro por responsable deja solo lo de esa persona ---');
await pagina.selectOption('#qmt-responsable', 'yo');
await pagina.waitForFunction(() => document.querySelectorAll('#qmt-cuerpo .qmt-fila').length === 2);
await comprobar('con el filtro "Yo", solo quedan h1 (en tu tejado) y h5 (sin fecha)',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#qmt-cuerpo .qmt-fila')).map(e => e.dataset.hito).sort()),
  ['h1', 'h5']);
await comprobar('"Esperando a otros" desaparece del todo (0 con ese filtro)',
  pagina.locator('.qmt-bloque-otros').count(), 0);
await comprobar('el filtro se recuerda en localStorage',
  pagina.evaluate(() => window.localStorage.getItem('gestor-que-me-toca-responsable')), 'yo');

await pagina.selectOption('#qmt-responsable', '');
await pagina.waitForFunction(() => document.querySelectorAll('#qmt-cuerpo .qmt-fila').length === 5);

/* ================= ESCENARIO 6: pulsar una línea abre la ficha con el hito desplegado ================= */

console.log('--- escenario 6: pulsar una línea abre la ficha del asunto con el hito desplegado ---');
await pagina.click('.qmt-bloque-tejado .qmt-fila[data-hito="h1"]');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForFunction(() => document.querySelector('#ficha-guia .hito[data-id="h1"]'));
await pagina.waitForTimeout(300);
await comprobar('la ficha abierta es la del asunto de h1',
  pagina.locator('.ficha-nombre-texto').textContent(), CLAVE_TEJADO);
await comprobar('el cuerpo de h1 ya está desplegado, sin esperar a que se pulse',
  pagina.locator('#ficha-guia .hito[data-id="h1"] .hito-cuerpo').getAttribute('class')
    .then(c => c.indexOf('oculto') === -1), true);

await pagina.click('#ficha-volver');
/* Fila 119: «Volver» regresa a la pantalla de origen, «Qué me toca». */
await pagina.waitForSelector('#pantalla-que-me-toca:not(.oculto)');

/* ================= ESCENARIO 7: la cuenta de la barra coincide con los vencidos ================= */

console.log('--- escenario 7: la cuenta de la barra coincide con los vencidos ---');
await comprobar('la barra dice "1" (solo h1 está vencido)',
  pagina.locator('#cuenta-que-me-toca').textContent(), '1');
await comprobar('la cuenta se ve (no lleva "oculto")',
  pagina.locator('#cuenta-que-me-toca').getAttribute('class').then(c => c.indexOf('oculto') === -1), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
