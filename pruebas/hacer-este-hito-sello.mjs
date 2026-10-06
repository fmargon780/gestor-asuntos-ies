/* Fila 285 (6-oct-2026, docs/HACER-ESTE-HITO.md), sin navegador: lo que decide la cadena de «Hacer este hito» con
   piezas de mentira.

   1. El PDF sellado: se asocia solo cuando no hay dudas; con dudas (dos sellados, dos hitos esperando, un sello anterior
      al día en que se generó, el documento ya no está, el nombre ya existe) no decide y devuelve lo detectado.
   2. Al asociar: se marca la tarea de registrar y, si la siguiente es comunicar, el hito queda «listo para enviar»; si no,
      sin apunte.
   3. Al terminar la cadena con tareas de marcar a mano: el hito no se da por hecho y el aviso dice cuántas quedan.
   4. Una pregunta sin responder antes de las tareas: se para antes, con el aviso ámbar. */
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const raiz = new URL('../js/', import.meta.url).pathname;
const dom = new JSDOM('<!doctype html><body><div id="capa" class="oculto"></div></body>');
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const avisos = [], escrituras = [];
let hitoActual, carpeta, asociado, asociarDevuelve;
const contexto = { console, window: {}, document: dom.window.document, setTimeout, clearTimeout, Date };
vm.createContext(contexto);
contexto.App = contexto.window.App = { E: { usuario: 'Revisor' } };
contexto.U = contexto.window.U = {
  aviso: (t, c) => avisos.push([t, c]), accesorio: (t) => avisos.push(['ACCESORIO ' + t, '']), fallo: (t) => avisos.push(['FALLO ' + t, '']),
  escapar: (t) => t, ahora: () => '2026-10-06T10:00:00.000Z',
  aFecha: (t) => { const m = String(t).match(/^(\d{2})\/(\d{2})\/(\d{4})/); return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null; }
};
contexto.Gestor = contexto.window.Gestor = { carpetaGestor: () => ({}), alRefrescar: [], asuntos: () => [] };
contexto.Carpetas = contexto.window.Carpetas = { ficheros: async () => carpeta.map((n) => ({ nombre: n })) };
contexto.RegistroSellado = contexto.window.RegistroSellado = { asociar: async (a, pdf, doc, sello) => { asociado = [pdf, doc]; return asociarDevuelve; } };
contexto.Hitos = contexto.window.Hitos = {
  hitosDe: async () => [hitoActual], buscar: (l, id) => l.filter((h) => h.id === id)[0] || null,
  guionDe: (a, h) => h.__guion, cuentaGuion: (g) => ({ hechos: g.filter((x) => x.hecho).length, total: g.length }),
  guardarCampos: async (c, id, cambios) => { escrituras.push(['campos', cambios]); if (cambios.cadena) hitoActual.cadena = cambios.cadena; else delete hitoActual.cadena; },
  marcarGuion: async (c, id, idPaso, cambio) => { escrituras.push(['marcar', idPaso]); hitoActual.__guion.forEach((g) => { if (g.id === idPaso) g.hecho = true; }); },
  ultimosLeidos: () => null, leer: async () => ({ porAsunto: {} })
};
for (const f of ['hacer-este-hito.js', 'hacer-este-hito-sello.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
  Object.keys(contexto.window).forEach((k) => { if (!(k in contexto) || contexto[k] === undefined) contexto[k] = contexto.window[k]; });
}
const { HacerEsteHito, HacerEsteHitoSello } = contexto;

const a = { nombre: 'A', handle: {} };
const sello = { fecha: '06/10/2026', anio: '26', tipo: 'S', serie: 'M', numero: '0700' };
function montar(extra) {
  avisos.length = 0; escrituras.length = 0; asociado = null; asociarDevuelve = '261006 CERTIFICADO D26-00001.pdf';
  carpeta = ['doc.pdf', 'sellado.pdf'];
  hitoActual = Object.assign({ id: 'h1', titulo: 'Hito', estado: 'encurso', cadena: { estado: 'esperando-sello', tarea: 'reg', documento: 'doc.pdf', quien: 'x', cuando: '2026-10-06T08:00:00.000Z' },
    __guion: [{ id: 'gen', hecho: true, accion: 'generar' }, { id: 'reg', hecho: false, accion: 'registrar' }, { id: 'com', hecho: false, accion: 'comunicar' }] }, extra || {});
}
const detectado = [{ nombre: 'sellado.pdf', sello }];

console.log('--- 1. con dudas no decide ---');
montar();
comprobar('1. dos sellados: no decide', (await HacerEsteHitoSello.resolver(a, detectado.concat(detectado))).length, 2);
montar(); sello.fecha = '05/10/2026';
comprobar('1. un sello anterior al día en que se generó: no decide', [(await HacerEsteHitoSello.resolver(a, detectado)).length, asociado], [1, null]);
sello.fecha = '06/10/2026';
montar(); carpeta = ['sellado.pdf'];
comprobar('1. el documento ya no está: no decide', [(await HacerEsteHitoSello.resolver(a, detectado)).length, asociado], [1, null]);
montar({ cadena: { estado: 'esperando-sello', tarea: 'reg', documento: '', quien: 'x', cuando: '2026-10-06T08:00:00.000Z' } });
comprobar('1. sin documento apuntado: no decide', [(await HacerEsteHitoSello.resolver(a, detectado)).length, asociado], [1, null]);
montar(); asociarDevuelve = false;
comprobar('1. el nombre ya existe (asociar falla): devuelve lo detectado, sin tocar el hito',
  [(await HacerEsteHitoSello.resolver(a, detectado)).length, escrituras.length], [1, 0]);
montar();
contexto.Hitos.hitosDe = async () => [hitoActual, Object.assign({}, hitoActual, { id: 'h2' })];
comprobar('1. dos hitos esperando: no decide', [(await HacerEsteHitoSello.resolver(a, detectado)).length, asociado], [1, null]);
contexto.Hitos.hitosDe = async () => [hitoActual];

console.log('--- 2. sin dudas ---');
montar();
const resto = await HacerEsteHitoSello.resolver(a, detectado);
comprobar('2. asocia el sellado al documento del hito y no queda nada por resolver', [resto.length, asociado], [0, ['sellado.pdf', 'doc.pdf']]);
comprobar('2. marca la tarea de registrar', escrituras.filter((e) => e[0] === 'marcar'), [['marcar', 'reg']]);
comprobar('2. la siguiente es comunicar: listo para enviar, con el nombre del sellado',
  [hitoActual.cadena.estado, hitoActual.cadena.tarea, hitoActual.cadena.documento], ['listo-para-enviar', 'com', '261006 CERTIFICADO D26-00001.pdf']);
montar({ __guion: [{ id: 'gen', hecho: true, accion: 'generar' }, { id: 'reg', hecho: false, accion: 'registrar' }, { id: 'nota', hecho: false, accion: '' }] });
await HacerEsteHitoSello.resolver(a, detectado);
comprobar('2. sin comunicar después: sin apunte', hitoActual.cadena === undefined, true);
comprobar('2. el aviso de la coletilla sin datos leídos no escribe nada', HacerEsteHitoSello.coletillaHTML(a), '');

console.log('--- 3. tareas a mano ---');
montar({ cadena: undefined, __guion: [{ id: 'gen', hecho: true, accion: 'generar' }, { id: 'mano', hecho: false, accion: '' }, { id: 'otra', hecho: true, accion: '' }] });
await HacerEsteHito.ejecutar(a, hitoActual);
comprobar('3. aviso: «Quedan 1 tarea por marcar.» y el hito no se da por hecho', [avisos.filter((x) => /Quedan/.test(x[0])).map((x) => x[0]), hitoActual.estado],
  [['Hecho lo que podía hacer la aplicación. Quedan 1 tarea por marcar.'], 'encurso']);

console.log('--- 4. pregunta sin responder ---');
montar({ cadena: undefined, __guion: [{ id: 'q', texto: '¿Es mayor de edad?', pregunta: true, hecho: false, accion: '' }, { id: 'gen', hecho: false, accion: 'generar' }] });
await HacerEsteHito.ejecutar(a, hitoActual);
comprobar('4. se para antes, con el aviso ámbar', avisos, [['Antes hay que responder: «¿Es mayor de edad?».', 'ambar']]);

if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
