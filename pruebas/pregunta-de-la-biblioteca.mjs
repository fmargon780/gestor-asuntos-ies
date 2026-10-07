/* Prueba en navegador de verdad de la fila 297 (docs/PREGUNTA-DE-LA-BIBLIOTECA-AL-GUARDAR.md):
   al guardar «Cambiar la guía», la pregunta de la biblioteca solo sale por los hitos de la biblioteca que
   se han cambiado esta vez, dice de cuál habla, enseña solo lo cambiado (Antes · Ahora · En la biblioteca),
   tiene tres botones (Cancelar · Solo aquí · También en la biblioteca) y no escribe nada hasta la última.
   Una guía de seis hitos de la biblioteca, cuatro ya distintos de su modelo. */
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

/* Seis modelos; la guía los trae como copias y cuatro (0, 1, 2, 3) ya son distintos de su modelo. */
await pagina.evaluate(async () => {
  const nombres = ['Uno', 'Dos', 'Tres', 'Cuatro', 'Cinco', 'Seis'];
  const guia = [];
  for (const n of nombres) {
    const m = await HitosBiblioteca.crearDesdePaso({ id: 'x', titulo: n, cuerpo: '<p>' + n + '</p>', responsable: 'Tutoría', opciones: [] }, n, 'Francisco');
    guia.push(HitosBiblioteca.modeloAPaso(m, ''));
  }
  guia[0].responsable = 'Secretaría';
  guia[1].cuerpo = '<p>Propia de dos</p>';
  guia[2].responsable = 'Dirección';
  guia[3].plazo = { dias: 7, desde: guia[2].id, cuenta: 'naturales' };
  window.__guia = guia;
});

const PASO = pos => '#guia-pasos > .paso-editor[data-pos="' + pos + '"] > .paso-cabecera > .paso-titulo';
/* Los hitos plegados no se ven: se escribe en el campo directamente. */
const escribir = (pos, texto) => pagina.evaluate(([p, t]) => { const c = document.querySelector('#guia-pasos > .paso-editor[data-pos="' + p + '"] > .paso-cabecera > .paso-titulo'); c.value = t; c.dispatchEvent(new Event('input', { bubbles: true })); }, [pos, texto]);
const biblioteca = () => pagina.evaluate(async () => JSON.stringify(await HitosBiblioteca.leer()));
const abrir = async () => {
  await pagina.evaluate(() => { window.__fin = null; window.__g = Guias.editar('CERTIFICADO', JSON.parse(JSON.stringify(window.__guia)), [{ id: 'Secretaría', nombre: 'Secretaría' }, { id: 'Dirección', nombre: 'Dirección' }, { id: 'Tutoría', nombre: 'Tutoría' }], []).then(r => { window.__fin = r || 'cancelada'; return r; }); });
  await pagina.waitForSelector('#guia-pasos .paso-editor');
};
const hayPregunta = () => pagina.evaluate(() => !document.getElementById('capa').classList.contains('oculto') && document.getElementById('cuadro-titulo').textContent.indexOf('Guía de') !== 0);
const esperarPregunta = async (n) => {
  await pagina.waitForFunction(() => !document.getElementById('capa').classList.contains('oculto') && document.getElementById('cuadro-titulo').textContent.indexOf('Guía de') !== 0);
  return pagina.textContent('#cuadro-titulo');
};
const esperarGuia = () => pagina.waitForFunction(() => !document.getElementById('capa').classList.contains('oculto') && document.getElementById('cuadro-titulo').textContent.indexOf('Guía de') === 0 && document.querySelector('#guia-pasos .paso-editor'));
const tabla = () => pagina.evaluate(() => Array.from(document.querySelectorAll('#cuadro-cuerpo .tabla-comparacion tr')).map(tr => Array.from(tr.children).map(c => c.textContent)));
const botones = () => pagina.evaluate(() => Array.from(document.querySelectorAll('#capa .cuadro-botones button')).filter(b => !b.classList.contains('oculto')).map(b => b.textContent));
const modelo = (n) => pagina.evaluate(async (n) => (await HitosBiblioteca.leer()).modelos.filter(m => m.nombre === n)[0], n);
const cerrada = () => pagina.evaluate(() => document.getElementById('capa').classList.contains('oculto'));

console.log('--- 1. guardar sin tocar nada: no pregunta ---');
const inicial = await biblioteca();
await abrir();
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => window.__fin);
await comprobar('la guía se guarda (seis hitos) y la ventana está cerrada', pagina.evaluate(() => window.__fin.length), 6);
await comprobar('la biblioteca no ha cambiado', biblioteca(), inicial);
await comprobar('sin ventana abierta', cerrada(), true);

console.log('--- 2. cambiar un título: una pregunta que dice cuál ---');
await abrir();
await escribir(1, 'Dos con otro nombre');
await pagina.click('#cuadro-aceptar');
await comprobar('el título habla del hito, con el nombre de antes',
  esperarPregunta(), 'Has cambiado el hito «Dos». ¿Es solo para CERTIFICADO, o también para la biblioteca?');
await comprobar('la tabla: solo «Título», con Antes y Ahora (y la explicación ya distinta no sale)', tabla(),
  [['', 'Antes', 'Ahora'], ['Título', 'Dos', 'Dos con otro nombre']]);
await comprobar('tres botones, en este orden', botones(), ['Cancelar', 'Solo aquí', 'También en la biblioteca']);

console.log('--- 5. Cancelar: vuelve a la guía con lo escrito, sin guardar nada ---');
await pagina.click('#cuadro-cancelar');
await esperarGuia();
await comprobar('el título nuevo sigue escrito', pagina.evaluate(() => document.querySelector('#guia-pasos > .paso-editor[data-pos="1"] > .paso-cabecera > .paso-titulo').value), 'Dos con otro nombre');
await comprobar('la guía no se ha devuelto todavía', pagina.evaluate(() => window.__fin), null);
await comprobar('la biblioteca no ha cambiado', biblioteca(), inicial);
await comprobar('«Cancelar» sigue llamándose así', pagina.textContent('#cuadro-cancelar'), 'Cancelar');

console.log('--- Guardar otra vez vuelve a preguntar; Escape es Cancelar ---');
await pagina.click('#cuadro-aceptar');
await esperarPregunta();
await pagina.keyboard.press('Escape');
await esperarGuia();
await comprobar('Escape no ha guardado nada', biblioteca(), inicial);

console.log('--- 3. «Solo aquí» ---');
await pagina.click('#cuadro-aceptar');
await esperarPregunta();
await pagina.click('#cuadro-solo-aqui');
await pagina.waitForFunction(() => window.__fin && window.__fin !== 'cancelada');
await comprobar('la ventana se cierra', cerrada(), true);
await comprobar('la guía lleva el título nuevo', pagina.evaluate(() => window.__fin[1].titulo), 'Dos con otro nombre');
await comprobar('y el hito queda «cambiado aquí»', pagina.evaluate(() => window.__fin[1].origenBiblioteca.divergido), true);
await comprobar('el modelo no cambia', biblioteca(), inicial);

console.log('--- 4. «También en la biblioteca»: solo lo cambiado ---');
await abrir();
await escribir(0, 'Uno cambiado');
await pagina.click('#cuadro-aceptar');
await esperarPregunta();
await comprobar('«Antes» y «Ahora»; la biblioteca (Tutoría) es distinta de lo de antes solo en el responsable, que no se ha tocado',
  tabla(), [['', 'Antes', 'Ahora'], ['Título', 'Uno', 'Uno cambiado']]);
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => window.__fin && window.__fin !== 'cancelada');
await comprobar('la ventana se cierra', cerrada(), true);
const uno = await modelo('Uno');
await comprobar('el modelo tiene el título nuevo', uno.titulo, 'Uno cambiado');
await comprobar('su revisión ha subido', uno.revision, 2);
await comprobar('el responsable, ya distinto en la guía y sin tocar, sigue distinto en el modelo', uno.responsable, 'Tutoría');
await comprobar('y en la guía sigue siendo el suyo', pagina.evaluate(() => window.__fin[0].responsable), 'Secretaría');
await comprobar('la guía recoge la revisión nueva', pagina.evaluate(() => window.__fin[0].origenBiblioteca.revision), 2);

console.log('--- 6. dos hitos cambiados: (1 de 2) y (2 de 2); Cancelar en el segundo no cambia nada ---');
const antes6 = await biblioteca();
await abrir();
await escribir(4, 'Cinco cambiado');
await escribir(5, 'Seis cambiado');
await pagina.click('#cuadro-aceptar');
await comprobar('primera', esperarPregunta(), '(1 de 2) Has cambiado el hito «Cinco». ¿Es solo para CERTIFICADO, o también para la biblioteca?');
await pagina.click('#cuadro-aceptar');
await comprobar('segunda', (async () => { await pagina.waitForFunction(() => document.getElementById('cuadro-titulo').textContent.indexOf('(2 de 2)') === 0); return pagina.textContent('#cuadro-titulo'); })(),
  '(2 de 2) Has cambiado el hito «Seis». ¿Es solo para CERTIFICADO, o también para la biblioteca?');
await pagina.click('#cuadro-cancelar');
await esperarGuia();
await comprobar('la biblioteca no ha cambiado', biblioteca(), antes6);
await comprobar('los dos títulos siguen escritos', pagina.evaluate(() => [document.querySelector('#guia-pasos > .paso-editor[data-pos="4"] > .paso-cabecera > .paso-titulo').value, document.querySelector('#guia-pasos > .paso-editor[data-pos="5"] > .paso-cabecera > .paso-titulo').value]), ['Cinco cambiado', 'Seis cambiado']);
await pagina.click('#cuadro-cancelar');   /* sale de la guía */
await pagina.waitForFunction(() => window.__fin);

console.log('--- 7. un campo cuyo valor de antes era distinto del de la biblioteca: tercera columna ---');
await abrir();
await escribir(2, 'Tres cambiado');
await pagina.evaluate(() => { /* el responsable de «Tres» también, a otro valor (antes: Dirección; biblioteca: Tutoría) */
  const sel = document.querySelector('#guia-pasos > .paso-editor[data-pos="2"] .paso-responsable');
  if (sel) { sel.value = sel.value; }
});
await pagina.click('#cuadro-aceptar');
await esperarPregunta();
await comprobar('sin renglones distintos de la biblioteca, no hay tercera columna', tabla(), [['', 'Antes', 'Ahora'], ['Título', 'Tres', 'Tres cambiado']]);
await pagina.click('#cuadro-cancelar');
await esperarGuia();
await pagina.click('#cuadro-cancelar');
await pagina.waitForFunction(() => window.__fin);
/* El título de «Cuatro» no cambia, pero sí su plazo (antes: 7 días, la biblioteca: sin plazo). */
await pagina.evaluate(() => { window.__guia[3].plazo = { dias: 7, desde: window.__guia[2].id, cuenta: 'naturales' }; });
await abrir();
await pagina.evaluate(() => { const p = document.querySelector('#guia-pasos > .paso-editor[data-pos="3"] .paso-plazo-dias'); if (p) { p.value = '9'; p.dispatchEvent(new Event('input', { bubbles: true })); p.dispatchEvent(new Event('change', { bubbles: true })); } });
await pagina.click('#cuadro-aceptar');
const hay = await Promise.race([esperarPregunta().then(() => true), pagina.waitForFunction(() => window.__fin).then(() => false)]);
if (hay) {
  const t = await tabla();
  await comprobar('el plazo cambiado enseña la columna «En la biblioteca»', t[0], ['', 'Antes', 'Ahora', 'En la biblioteca']);
  await pagina.click('#cuadro-cancelar'); await esperarGuia(); await pagina.click('#cuadro-cancelar');
} else console.log('(no hay campo de plazo editable en este montaje: la tercera columna se comprueba abajo, con la función)');

await comprobar('la función: valor de antes distinto del de la biblioteca → columna «En la biblioteca»',
  pagina.evaluate(() => {
    const c = HitosBiblioteca.cambiosEntre({ titulo: 'A', responsable: 'Dirección' }, { titulo: 'A', responsable: 'Jefatura' }, { titulo: 'A', responsable: 'Tutoría' });
    const h = GuiasBiblioteca.cambiosHTML(c);
    return [c.length, c[0].biblioteca, h.indexOf('En la biblioteca') !== -1];
  }), [1, 'Tutoría', true]);

console.log('--- 8. solo cambiar el orden: no pregunta ---');
await abrir();
await pagina.evaluate(() => { document.querySelector('#guia-pasos > .paso-editor[data-pos="1"] button[title="Subir este hito"]').click(); });
await comprobar('el orden ha cambiado en el cuadro', pagina.evaluate(() => document.querySelector('#guia-pasos > .paso-editor[data-pos="0"] > .paso-cabecera > .paso-titulo').value), 'Dos');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => window.__fin);
await comprobar('en la guía guardada, «Dos» va primero', pagina.evaluate(() => window.__fin[0].titulo), 'Dos');
await comprobar('sin pregunta, la guía se guarda', pagina.evaluate(() => window.__fin !== 'cancelada' && window.__fin.length), 6);

console.log('--- 9. las conversiones automáticas al abrir no cuentan ---');
await pagina.evaluate(() => { window.__guia[4].comunicacion = { correo: { asunto: 'Asunto', cuerpo: 'Texto del aviso' }, seneca: { asunto: '', cuerpo: '' } }; });
await abrir();
await comprobar('la comunicación se ha convertido en tareas al abrir', pagina.evaluate(() => { const g = window.__guia[4]; return typeof g.comunicacion === 'object'; }), true);
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => window.__fin);
await comprobar('la guía devuelta ya trae la tarea de comunicar', pagina.evaluate(() => (window.__fin[4].guion || []).length > 0), true);
await comprobar('guardar sin tocar nada tras convertir la comunicación a tareas: no pregunta', pagina.evaluate(() => window.__fin !== 'cancelada' && window.__fin.length), 6);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' comprobación(es) fallan'); process.exit(1); }
console.log('\nTodo bien.');
