/* Prueba en navegador de verdad de escribir la guía de un tipo desde
   la ficha de un asunto, y de cómo eso crea solos sus hitos
   (docs/HITOS-SON-LA-GUIA.md, fila 26, 17-sep-2026): los pasos de la
   guía SON los hitos, ya no hay guía con casillas aparte dentro de la
   ficha.

   Lo que tiene que pasar:
     - en un asunto abierto cuyo tipo no tiene guía ni hitos, #ficha-guia
       ofrece "+ Añadir el primer hito" y ya no manda a Ajustes,
     - la nota del final sigue ofreciendo "Escribir la guía de X",
     - al escribirla desde ahí se guarda en _GESTOR/guias.json,
     - la ficha se repinta sola, y en el sitio de la guía aparecen los
       hitos creados solos a partir de sus pasos,
     - marcar un hito hecho se guarda en hitos.json, no en asuntos.json,
     - y entonces la nota pasa a decir "Cambiar la guía".

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
/* Fila 107 (docs/FICHA-EN-TARJETAS.md): la ficha va en tarjetas. Esta
   prueba trabaja dentro de una: se entra con ella ya abierta en grande
   (`window.__tarjeta`; se cambia con FichaTarjetas.abrir). */
await pagina.addInitScript(() => {
  window.__tarjeta = 'hitos';
  window.addEventListener('DOMContentLoaded', () => {
    if (!window.FichaTarjetas) return;
    const alEntrar = FichaTarjetas.alEntrar;
    FichaTarjetas.alEntrar = function () {
      if (window.__tarjeta) FichaTarjetas.abrirAlEntrar(window.__tarjeta);
      return alEntrar();
    };
  });
});

/* Fila 105 (docs/AJUSTES-PLEGADO.md): Ajustes nace plegado; esta prueba
   trabaja con las secciones de la pantalla de un tipo ya desplegadas. */
await pagina.addInitScript(() => {
  try {
    const abiertas = {};
    ['datos', 'campos', 'pasos', 'correo', 'word', 'plazo', 'palabras', 'repite']
      .forEach((s) => { abiertas['tipo:' + s] = true; });
    window.localStorage.setItem('gestor-ajustes-plegado', JSON.stringify(abiertas));
  } catch (e) { /* sin localStorage, se queda plegado */ }
});
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
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async () => {
  await window.__disco.abiertos.getDirectoryHandle('260901 MATRICULA 26-27 Pérez, Ana 1234', { create: true });
});
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(800);

/* Abre la ficha del asunto y espera a que el bloque de hitos se
   asiente (deje de decir "Leyendo…" y, si toca, termine de crearlos). */
const abrirLaFicha = async () => {
  await pagina.evaluate(() => {
    const a = App.E.listaAbiertos.filter(x => x.nombre.indexOf('MATRICULA') !== -1)[0];
    App.abrirFicha(a, 'abierto');
  });
  await pagina.waitForFunction(() => {
    const c = document.getElementById('ficha-guia');
    return c && c.textContent.indexOf('Leyendo') === -1;
  });
  await pagina.waitForTimeout(300);
};

const textoGuia = () => pagina.locator('#ficha-guia').textContent();

console.log('--- un tipo sin guía ni hitos todavía ---');
await abrirLaFicha();

await comprobar('dice que el tipo no tiene guía',
  textoGuia().then(t => t.indexOf('no tiene guía') !== -1), true);
await comprobar('y ya NO manda a Ajustes',
  textoGuia().then(t => t.indexOf('Ajustes') !== -1), false);
await comprobar('ofrece añadir el primer hito a mano',
  pagina.locator('#ficha-guia button', { hasText: 'Añadir el primer hito' }).count(), 1);
await comprobar('la nota ofrece escribir la guía del tipo',
  pagina.locator('#ficha-guia-nota button').textContent(),
  'Escribir la guía de MATRICULA');
await comprobar('y avisa de que vale para todos',
  pagina.locator('#ficha-guia-nota').textContent().then(t => t.indexOf('todos los asuntos MATRICULA') !== -1), true);

console.log('--- escribiéndola desde aquí ---');
await pagina.locator('#ficha-guia-nota button').click();
await pagina.waitForSelector('#guia-anadir');
await comprobar('el cuadro es el de escribir la guía de ese tipo',
  pagina.locator('#cuadro-titulo').textContent(), 'Guía de MATRICULA');

await pagina.click('#guia-anadir');
await pagina.waitForSelector('#guia-pasos .paso-titulo');
await pagina.fill('#guia-pasos .paso-titulo', 'Pedir el sobre de matrícula');
await pagina.click('#guia-anadir');
await pagina.waitForTimeout(200);
await pagina.locator('#guia-pasos .paso-titulo').nth(1).fill('Comprobar el pago de la Seguridad Escolar');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(800);

await comprobar('se ha guardado en guias.json',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('guias.json');
    const t = await (await f.getFile()).text();
    const j = JSON.parse(t);
    return (j.MATRICULA || []).map(p => p.titulo);
  }),
  ['Pedir el sobre de matrícula', 'Comprobar el pago de la Seguridad Escolar']);

console.log('--- los pasos de la guía se vuelven hitos, solos ---');
await pagina.waitForTimeout(600);
await comprobar('salen los dos, sin marcar',
  textoGuia().then(t => t.indexOf('0 de 2 hitos hechos') !== -1), true);
await comprobar('con el título del primer paso',
  pagina.locator('#ficha-guia .hito-titulo').first().textContent(),
  'Pedir el sobre de matrícula');
await comprobar('con el título del segundo',
  pagina.locator('#ficha-guia .hito-titulo').nth(1).textContent(),
  'Comprobar el pago de la Seguridad Escolar');
await comprobar('la nota ahora es la de cambiarla',
  pagina.locator('#ficha-guia-nota button').textContent(), 'Cambiar la guía');
await comprobar('se han creado en hitos.json',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('hitos.json');
    const j = JSON.parse(await (await f.getFile()).text());
    const clave = Object.keys(j.porAsunto).filter(k => k.indexOf('MATRICULA') !== -1)[0];
    return (j.porAsunto[clave].hitos || []).map(h => h.titulo);
  }),
  ['Pedir el sobre de matrícula', 'Comprobar el pago de la Seguridad Escolar']);

console.log('--- marcar un hito hecho se guarda en hitos.json ---');
await pagina.locator('#ficha-guia .hito-casilla').first().check();
await pagina.waitForTimeout(400);
await comprobar('se apunta en hitos.json',
  pagina.evaluate(async () => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('hitos.json');
    const j = JSON.parse(await (await f.getFile()).text());
    const clave = Object.keys(j.porAsunto).filter(k => k.indexOf('MATRICULA') !== -1)[0];
    return j.porAsunto[clave].hitos[0].estado;
  }), 'hecho');
await comprobar('y NO en asuntos.json (pasosHechos ya no se usa para esto)',
  pagina.evaluate(async () => {
    try {
      const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
      const f = await g.getFileHandle('asuntos.json');
      const j = JSON.parse(await (await f.getFile()).text());
      const clave = Object.keys(j.asuntos || {}).filter(k => k.indexOf('MATRICULA') !== -1)[0];
      return ((clave && j.asuntos[clave].pasosHechos) || []).length;
    } catch (e) {
      return 0;   /* ni siquiera hace falta que exista la ficha del asunto */
    }
  }), 0);
await comprobar('y la cuenta sube',
  textoGuia().then(t => t.indexOf('1 de 2 hitos hechos') !== -1), true);

console.log('--- en Ajustes se ve lo mismo ---');
/* Desde el 17-sep-2026 (fila 39, docs/AJUSTES-POR-TIPO.md) ya no hay
   una tabla de guías aparte en Ajustes: los pasos se ven en la
   sección "Pasos del trámite" de la pantalla propia del tipo. */
await pagina.evaluate(() => App.ir('ajustes'));
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');
await pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: 'MATRICULA' })
  .locator('.tarjeta-tipo-nombre').click();
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await pagina.waitForTimeout(600);
await comprobar('la sección "Pasos del trámite" dice "Cambiar la guía" (ya hay 2 pasos)',
  pagina.locator('.tipo-asunto-seccion').filter({ hasText: 'Pasos del trámite' })
    .getByRole('button', { name: 'Cambiar la guía' }).count(), 1);
await comprobar('y enseña los títulos de los dos pasos',
  pagina.locator('.tipo-asunto-seccion').filter({ hasText: 'Pasos del trámite' }).textContent()
    .then(t => t.indexOf('Pedir el sobre de matrícula') !== -1 &&
               t.indexOf('Comprobar el pago de la Seguridad Escolar') !== -1), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
