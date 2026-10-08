/* Prueba de lógica (jsdom) de la fila 305, docs/CONTACTO-DEL-ENCARGO-DONDE-HACE-FALTA.md:
   la marca de contacto de la cabecera, el botón de copiar, la frase del cuadro de Correo
   y los tres huecos nuevos de las plantillas. Nombres inventados. */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../js/', import.meta.url));
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const dom = new JSDOM('<!doctype html><html><body><div id="caja"></div></body></html>', { runScripts: 'outside-only' });
const win = dom.window;
win.App = { E: { usuario: 'Francisco' } };
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'nombres.js', 'lo-pide.js', 'contacto-a-la-vista.js', 'plantillas.js', 'plantillas-valores.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { ContactoALaVista, Plantillas } = win;
const lp = { nombre: 'María López', relacion: 'Madre', correo: 'maria@fichero.es', telefono: '611222333' };
function texto(a) { const d = new JSDOM('<div>' + ContactoALaVista.html(a) + '</div>').window.document; return d.body.textContent.replace(/\s+/g, ' ').trim(); }

comprobar('la marca de teléfono', texto({ ficha: { loPide: lp, via: 'TELEFONO', viaDato: '600 111 222' } }), 'Lo pide: María López (madre) · Tel. 600 111 222⧉');
comprobar('la marca de correo, sin Tel.', texto({ ficha: { loPide: lp, via: 'CORREO', viaDato: 'otra@ejemplo.es' } }), 'Lo pide: María López (madre) · otra@ejemplo.es⧉');
comprobar('aclaración sin dato', texto({ ficha: { loPide: lp, via: 'PRESENCIAL', viaDato: 'llamar por las tardes' } }), 'Lo pide: María López (madre) · llamar por las tardes⧉');
comprobar('sin «quién lo pide»: Contacto', texto({ ficha: { via: 'CORREO', viaDato: 'a@b.es' } }), 'Contacto: a@b.es⧉');
comprobar('en persona y nada escrito: como hoy', texto({ ficha: { loPide: lp, via: 'PRESENCIAL' } }), 'Lo pide: María López (madre)');
comprobar('sin nada apuntado: sin marca', ContactoALaVista.html({ ficha: { tipo: 'X' } }), '');

/* Copiar: lo copiado es el teléfono sin «Tel.». */
let copiado = null;
win.navigator.clipboard = { writeText: (t) => { copiado = t; return Promise.resolve(); } };
win.document.getElementById('caja').innerHTML = ContactoALaVista.html({ ficha: { loPide: lp, via: 'TELEFONO', viaDato: '600 111 222' } });
win.document.querySelector('.contacto-copiar').click();
await new Promise((r) => setTimeout(r, 20));
comprobar('el botón copia solo el teléfono', copiado, '600 111 222');

/* Los tres huecos. */
const v = await Plantillas.valoresDeAsunto({
  ficha: { tercero: 'Pérez López, Ana 1234567', categoria: 'ALUMNADO', tipo: 'CERTIFICADO', loPide: lp, via: 'TELEFONO', viaDato: '600 111 222' },
  leido: { tipo: 'CERTIFICADO', categoria: 'ALUMNADO', resto: 'Pérez López, Ana 1234567' }
});
comprobar('{quienlopidecontacto}', v.quienlopidecontacto, '600 111 222');
comprobar('{quienlopidetelefono}', v.quienlopidetelefono, '600 111 222');
comprobar('{quienlopidecorreo}', v.quienlopidecorreo, 'maria@fichero.es');
const vacio = await Plantillas.valoresDeAsunto({
  ficha: { tercero: 'Suministros SL', categoria: 'EMPRESAS', tipo: 'COMPRA' },
  leido: { tipo: 'COMPRA', categoria: 'EMPRESAS', resto: 'Suministros SL' }
});
comprobar('vacíos sin dato', [vacio.quienlopidecontacto, vacio.quienlopidetelefono, vacio.quienlopidecorreo], ['', '', '']);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
