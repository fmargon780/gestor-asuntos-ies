/* Prueba en navegador de verdad de "un mismo correo en dos buzones"
   (17-sep-2026, fila 18 de la cola, docs/CORREO-EN-DOS-BUZONES.md).

   La matrícula (el Message-ID) es la que permite reconocer, desde el
   buzón del compañero, que un correo ya lo metió el otro en un
   asunto, aunque el identificador de hilo sea de otro buzón y no
   coincida con nada. Reutiliza el disco de mentira de
   pruebas/navegador.mjs, con el mismo truco de pruebas/conflictos.mjs
   para simular "lo que ya hizo el otro ordenador": escribir
   directamente en asuntos.json, sin dos pestañas ni dos navegadores. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const A = '260901 MATRICULA 26-27 Alguien Uno 1140001';
const VIEJO = '260902 MATRICULA 26-27 Alguien Dos 1140002';
const C = '260903 MATRICULA 26-27 Alguien Tres 1140003';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
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

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Ana');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

/* ASUNTO_A: lo metió Juan (desde su buzón), con matriculas apuntadas.
   ASUNTO_VIEJO: una huella de antes del 17-sep-2026, sin matriculas ni
   metidoPor: tiene que seguir funcionando, sin roturas.
   ASUNTO_C: para comprobar que el identificador de hilo manda sobre la
   matrícula aunque las dos encajen con asuntos distintos. */
await pagina.evaluate(async ([a, viejo, c]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: {
      [a]: {
        tercero: 'Alguien Uno 1140001', categoria: 'ALUMNADO',
        hilos: [{ id: 'hilo-a', asunto: 'de antes', visto: 1,
                  matriculas: ['msg-1@x', 'msg-2@x'], metidoPor: 'Juan', metidoEl: '2026-09-10T09:14:00.000Z' }]
      },
      [viejo]: {
        tercero: 'Alguien Dos 1140002', categoria: 'ALUMNADO',
        hilos: [{ id: 'hilo-viejo', asunto: 'legacy', visto: 1 }]
      },
      [c]: {
        tercero: 'Alguien Tres 1140003', categoria: 'ALUMNADO',
        hilos: [{ id: 'hilo-c', asunto: 'de antes tambien', visto: 1,
                  matriculas: ['msg-c@x'], metidoPor: 'Juan', metidoEl: '2026-09-11T09:00:00.000Z' }]
      }
    }
  })));
  for (const n of [a, viejo, c]) await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
}, [A, VIEJO, C]);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

await pagina.evaluate(async () => {
  window.__bandeja = await window.__disco.archivo.getDirectoryHandle('GESTOR-BANDEJA', { create: true });
  const antes = window.showDirectoryPicker;
  window.showDirectoryPicker = async function (opciones) {
    if (opciones && opciones.id === 'gestor-bandeja') return window.__bandeja;
    return antes(opciones);
  };
});

function correoDeMentira(id, cambios) {
  return Object.assign({
    id: id,
    asunto: 'Papeleo suelto',
    fecha: '2026-09-17T09:00:00.000Z',
    fechaUltimo: '2026-09-17T09:00:00.000Z',
    mensajes: 1,
    de: { nombre: 'Alguien', correo: 'alguien@fuera.es' },
    correos: ['alguien@fuera.es'],
    enlace: 'https://mail.google.com/mail/u/0/#search/rfc822msgid:' + id,
    matriculas: [],
    pdfMensaje: id + ' - correo.pdf'
  }, cambios || {});
}

async function dejarElCorreo(datos) {
  await pagina.evaluate((d) => {
    const b = window.__bandeja;
    b._hijos.set(d.id + '.json', window.__disco.fich(d.id + '.json', JSON.stringify(d)));
    if (d.pdf) b._hijos.set(d.pdf, window.__disco.fich(d.pdf, 'el hilo en pdf'));
    if (d.pdfMensaje) b._hijos.set(d.pdfMensaje, window.__disco.fich(d.pdfMensaje, 'el correo'));
  }, datos);
}

async function limpiarBandejaDeCorreos() {
  await pagina.evaluate(async () => {
    const b = window.__bandeja;
    const fuera = [];
    for await (const [nombre] of b.entries()) {
      if (nombre === 'seguidos.json') continue;
      fuera.push(nombre);
    }
    fuera.forEach(n => b._hijos.delete(n));
  });
}

async function mirarLaBandeja() {
  await pagina.evaluate(() => App.ir('ajustes'));
  await pagina.waitForSelector('#bloque-bandeja');
  await pagina.evaluate(() => { document.getElementById('bloque-bandeja').open = true; });
  await pagina.click('#botones-bandeja .boton');
  await pagina.waitForTimeout(600);
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(700);
}

async function fichaDelAsunto(nombre) {
  return pagina.evaluate(async (n) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('asuntos.json');
    return JSON.parse(await (await f.getFile()).text()).asuntos[n] || {};
  }, nombre);
}

/* ============================================================
   1 y 3. Matrícula compartida, hilo distinto: encaja y saca línea gris
   ============================================================ */
console.log('--- 1 y 3: matrícula compartida, hilo distinto ---');
await dejarElCorreo(correoDeMentira('hilo-nuevo1', { matriculas: ['msg-2@x', 'msg-3@x'] }));
await mirarLaBandeja();

await comprobar('1. no sale como tarjeta normal (el hilo no es el suyo)',
  pagina.locator('#bandeja-correos .tarjeta-correo').count(), 0);
await comprobar('3. sale como línea gris, con el nombre del asunto',
  pagina.locator('.linea-ya-guardado').filter({ hasText: A }).count(), 1);
await comprobar('y con quién lo metió',
  pagina.locator('.linea-ya-guardado').filter({ hasText: A }).textContent()
    .then(t => t.indexOf('lo metió Juan') !== -1), true);

await limpiarBandejaDeCorreos();

/* ============================================================
   2. El correo cuyo propio hilo SÍ está en las huellas: es suyo
   ============================================================ */
console.log('--- 2: el hilo es directamente el conocido ---');
await dejarElCorreo(correoDeMentira('hilo-a', { asunto: 'Re: cualquier cosa', matriculas: ['msg-9@x'] }));
await mirarLaBandeja();

await comprobar('2. sale como tarjeta normal',
  pagina.locator('#bandeja-correos .tarjeta-correo').count(), 1);
await comprobar('sin ninguna línea gris',
  pagina.locator('.linea-ya-guardado').count(), 0);
await comprobar('y dice que es respuesta del asunto de verdad',
  pagina.locator('#bandeja-correos .propuesta-correo').textContent(), 'Respuesta de' + A);

await limpiarBandejaDeCorreos();

/* ============================================================
   4. Una huella antigua, sin matriculas ni metidoPor, no rompe nada
   ============================================================ */
console.log('--- 4: huella de antes de la fila 18 ---');
await dejarElCorreo(correoDeMentira('hilo-nuevo2', { matriculas: ['msg-sin-relacion@x'] }));
await mirarLaBandeja();

await comprobar('4. no revienta: sale como tarjeta normal (sin reconocer)',
  pagina.locator('#bandeja-correos .tarjeta-correo').count(), 1);
await comprobar('no sale ninguna línea gris',
  pagina.locator('.linea-ya-guardado').count(), 0);

await limpiarBandejaDeCorreos();

/* ============================================================
   6. El orden: la huella por hilo manda sobre la de matrícula
   ============================================================ */
console.log('--- 6: el hilo manda sobre la matrícula ---');
/* Mismo hilo que el asunto A, pero con una matrícula que encajaría con
   el asunto C si se mirase antes que el identificador de hilo. */
await dejarElCorreo(correoDeMentira('hilo-a', { asunto: 'Re: otra cosa', matriculas: ['msg-c@x'] }));
await mirarLaBandeja();

await comprobar('6. manda el identificador de hilo: respuesta del asunto A, no del C',
  pagina.locator('#bandeja-correos .propuesta-correo').textContent(), 'Respuesta de' + A);
await comprobar('ninguna línea gris para este correo',
  pagina.locator('.linea-ya-guardado').count(), 0);

await limpiarBandejaDeCorreos();

/* ============================================================
   5. escribirSeguidos junta las matrículas sin repetirlas
   ============================================================ */
console.log('--- 5: escribirSeguidos une las matrículas ---');
/* Dos asuntos con una huella del MISMO identificador de hilo (un caso
   raro, pero la unión tiene que ser defensiva) y matrículas parcialmente
   repetidas: el resultado no puede duplicar ninguna. */
await pagina.evaluate(async () => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
  const f = await g.getFileHandle('asuntos.json');
  const datos = JSON.parse(await (await f.getFile()).text());
  datos.asuntos['260909 OTRO 26-27 Repetido 1149999'] = {
    tercero: 'Repetido', categoria: 'ALUMNADO',
    hilos: [{ id: 'hilo-a', asunto: 'de antes', visto: 3, matriculas: ['msg-2@x', 'msg-4@x'] }]
  };
  const w = await (await g.getFileHandle('asuntos.json', { create: true })).createWritable();
  await w.write(JSON.stringify(datos));
  await w.close();
  await App.cargarRegistro();   /* escribirSeguidos lee App.E.registro, no el disco */
  await window.Bandeja.escribirSeguidos();
});

const seguidos = await pagina.evaluate(async () => {
  const f = await window.__bandeja.getFileHandle('seguidos.json');
  return JSON.parse(await (await f.getFile()).text());
});
const deHiloA = (seguidos.hilos || []).find(h => h.id === 'hilo-a');
await comprobar('las matrículas de las dos huellas del mismo hilo se juntan, sin repetir',
  deHiloA && deHiloA.matriculas.slice().sort(), ['msg-1@x', 'msg-2@x', 'msg-4@x']);

/* ============================================================
   Los botones de la línea gris: abrir el asunto, y quitar de la bandeja
   ============================================================ */
console.log('--- los botones de la línea gris ---');
await dejarElCorreo(correoDeMentira('hilo-nuevo3', { matriculas: ['msg-1@x'] }));
await mirarLaBandeja();
await comprobar('sale la línea gris', pagina.locator('.linea-ya-guardado').count(), 1);

await pagina.locator('.linea-ya-guardado').getByRole('button', { name: 'Abrir el asunto' }).click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('abre la ficha del asunto de verdad',
  pagina.locator('.ficha-nombre').textContent(), A);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(300);

await pagina.locator('.linea-ya-guardado').getByRole('button', { name: 'Quitar de mi bandeja' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(300);
await comprobar('la línea gris desaparece', pagina.locator('.linea-ya-guardado').count(), 0);
await comprobar('el .json ya no está en la bandeja de verdad', pagina.evaluate(async () => {
  try { await window.__bandeja.getFileHandle('hilo-nuevo3.json'); return true; }
  catch (e) { return false; }
}), false);
await comprobar('el asunto sigue exactamente igual (no se le ha tocado nada)',
  fichaDelAsunto(A).then(f => f.hilos[0].id), 'hilo-a');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
