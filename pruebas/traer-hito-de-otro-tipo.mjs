/* Prueba en navegador de verdad de la fila 417 (docs/HITOS-UN-SOLO-SITIO.md, parte B):

   1. «+ Traer un hito de otro tipo» abre un buscador con los hitos de las guías de los demás
      tipos, agrupados por tipo, y «Sin tipo» (modelos que ninguna guía usa) con su «Quitar».
   2. Escribir en la caja filtra por el título. Elegir uno lo mete como copia suelta (con sus
      tareas, sin etiqueta de origen) y avisa si su plazo contaba desde un hito de la otra guía.
   3. Escribir un título parecido ofrece «En «<tipo>» hay "…" · Usarlo».
   4. Ya no hay etiqueta de origen ni «Guardar en la biblioteca», y Guardar no pregunta nada.

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
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* Dos guías de otros tipos, y un modelo que ninguna guía usa. */
await pagina.evaluate(async () => {
  await GuiasDelCentro._guardarTipo('Elecc. Consejo Escolar', [
    { id: 'e1', titulo: 'Registrar de salida en Séneca', cuerpo: '', opciones: [], plazo: { dias: 5, desde: 'e0', cuenta: 'habiles' },
      guion: [{ id: 'g1', texto: 'Anotar el número de registro' }] },
    { id: 'e2', titulo: '¿Cómo ha llegado?', opciones: [{ id: 'o1', titulo: 'En mano', pasos: [{ id: 'e3', titulo: 'Dentro de la rama', opciones: [] }] }] }
  ]);
  await GuiasDelCentro._guardarTipo('Matrícula', [{ id: 'm1', titulo: 'Abrir el expediente', opciones: [] }]);
  await HitosBiblioteca.crearDesdePaso({ id: 'x1', titulo: 'Hito suelto de la biblioteca', opciones: [], cuerpo: '' }, 'Hito suelto de la biblioteca', 'Francisco');
});

const GUIA = [{ id: 'c1', titulo: 'Entregar el certificado', opciones: [] }];
await pagina.evaluate(([GUIA]) => { window.__guardada = Guias.editar('Certificado', GUIA, [], []); }, [GUIA]);
await pagina.waitForSelector('#guia-pasos .paso-editor');

console.log('--- 1. el buscador ---');
await comprobar('el botón se llama «+ Traer un hito de otro tipo»', pagina.textContent('#guia-traer-biblioteca'), '+ Traer un hito de otro tipo');
await pagina.click('#guia-traer-biblioteca');
await pagina.waitForSelector('#biblioteca-panel-lista .biblioteca-panel-item');
await comprobar('encabezados: un grupo por tipo y «Sin tipo» al final',
  pagina.$$eval('#biblioteca-panel-lista .biblioteca-panel-grupo', (e) => e.map((x) => x.textContent)),
  ['Elecc. Consejo Escolar', 'Matrícula', 'Sin tipo']);
await comprobar('solo los hitos de arriba, sin preguntas ni los de dentro de una rama',
  pagina.$$eval('#biblioteca-panel-lista .biblioteca-panel-item .nombre-tipo', (e) => e.map((x) => x.textContent)),
  ['Registrar de salida en Séneca', 'Abrir el expediente', 'Hito suelto de la biblioteca']);
await comprobar('solo los «Sin tipo» llevan «Quitar»', pagina.$$eval('#biblioteca-panel-lista .biblioteca-quitar', (e) => e.length), 1);

await pagina.fill('#biblioteca-buscar', 'registrar de salida');
await comprobar('escribir filtra por el título',
  pagina.$$eval('#biblioteca-panel-lista .biblioteca-panel-item .nombre-tipo', (e) => e.map((x) => x.textContent)),
  ['Registrar de salida en Séneca']);

console.log('--- 2. elegir uno: copia suelta ---');
await pagina.click('#biblioteca-panel-lista .biblioteca-panel-item');
await pagina.waitForSelector('#guia-pasos > .paso-editor[data-pos="1"]');
await comprobar('entra como hito nuevo, con su título',
  pagina.inputValue('#guia-pasos > .paso-editor[data-pos="1"] > .paso-cabecera > .paso-titulo'), 'Registrar de salida en Séneca');
await comprobar('dice que el plazo contaba desde un hito de otro tipo',
  pagina.textContent('#guia-pasos > .paso-editor[data-pos="1"] > .paso-aviso-plazo'), 'El plazo contaba desde un hito de otro tipo: revísalo.');
await comprobar('no hay etiqueta de origen', pagina.$$eval('.chip-origen', (e) => e.length), 0);
await comprobar('no hay «Guardar en la biblioteca»', pagina.$$eval('.paso-guardar-biblioteca', (e) => e.length), 0);

console.log('--- 3. «Usarlo» al escribir un título parecido ---');
await pagina.click('#guia-anadir');
await pagina.waitForSelector('#guia-pasos > .paso-editor[data-pos="2"]');
await pagina.locator('#guia-pasos > .paso-editor[data-pos="2"] > .paso-cabecera > .paso-titulo').fill('Abrir el exped');
await pagina.waitForSelector('#guia-pasos > .paso-editor[data-pos="2"] .paso-titulo-usarlo');
await comprobar('dice en qué tipo está',
  pagina.textContent('#guia-pasos > .paso-editor[data-pos="2"] > .paso-cabecera > .paso-titulo-parecido'),
  'En «Matrícula» hay «Abrir el expediente» · Usarlo');
await pagina.click('#guia-pasos > .paso-editor[data-pos="2"] .paso-titulo-usarlo');
await comprobar('«Usarlo» trae el hito',
  pagina.inputValue('#guia-pasos > .paso-editor[data-pos="2"] > .paso-cabecera > .paso-titulo'), 'Abrir el expediente');

console.log('--- 4. Guardar no pregunta nada y la copia queda suelta ---');
await pagina.evaluate(() => { document.querySelector('#guia-pasos > .paso-editor[data-pos="1"] > .paso-cabecera > .paso-titulo').value = 'Registrar de salida (Certificado)'; });   /* el hito está plegado */
await pagina.click('#cuadro-aceptar');
const guardada = await pagina.evaluate(() => window.__guardada);
await comprobar('el cuadro se cierra sin ninguna pregunta de la biblioteca',
  pagina.evaluate(() => document.getElementById('capa').classList.contains('oculto')), true);
await comprobar('la guía guardada tiene los tres hitos y ninguno lleva origenBiblioteca',
  [guardada.length, guardada.some((p) => p.origenBiblioteca)], [3, false]);
await comprobar('la copia trae sus tareas y el título cambiado en Certificado',
  [guardada[1].titulo, (guardada[1].guion || []).map((g) => g.texto)], ['Registrar de salida (Certificado)', ['Anotar el número de registro']]);
await comprobar('el hito del otro tipo no ha cambiado',
  pagina.evaluate(() => GuiasDelCentro.pasosDe('Elecc. Consejo Escolar')[0].titulo), 'Registrar de salida en Séneca');

console.log('--- 5. «Quitar» un hito de «Sin tipo» ---');
await pagina.evaluate(([GUIA]) => { window.__guardada2 = Guias.editar('Certificado', GUIA, [], []); }, [GUIA]);
await pagina.waitForSelector('#guia-pasos .paso-editor');
await pagina.click('#guia-traer-biblioteca');
await pagina.waitForSelector('#biblioteca-panel-lista .biblioteca-quitar');
await pagina.click('#biblioteca-panel-lista .biblioteca-quitar');
await comprobar('el primer toque pide confirmar y no borra', pagina.textContent('#biblioteca-panel-lista .biblioteca-quitar'), '¿Seguro? Quitar');
await pagina.click('#biblioteca-panel-lista .biblioteca-quitar');
await pagina.waitForSelector('#biblioteca-panel-lista .biblioteca-quitar', { state: 'detached' });
await comprobar('el segundo lo quita de la biblioteca', pagina.evaluate(async () => (await HitosBiblioteca.leer()).modelos.length), 0);
await comprobar('y «Sin tipo» desaparece del buscador',
  pagina.$$eval('#biblioteca-panel-lista .biblioteca-panel-grupo', (e) => e.map((x) => x.textContent)), ['Elecc. Consejo Escolar', 'Matrícula']);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
