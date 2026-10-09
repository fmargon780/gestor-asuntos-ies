/* Fila 320 (docs/PANTALLA-DE-PLANTILLAS.md, punto 2): `PlantillasUso` dice qué hitos usan cada plantilla.
   Sin navegador: módulo puro cargado en un contexto de Node, como pruebas/archivar-fusion.mjs. */
import fs from 'node:fs';
import vm from 'node:vm';

const contexto = { console, window: {} };
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(new URL('../js/plantillas-uso.js', import.meta.url).pathname, 'utf8'), contexto, { filename: 'plantillas-uso.js' });
const { PlantillasUso } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const plantillas = {
  lista: [
    { id: 'pl-a', tipo: 'CERTIFICADO', categoria: 'ALUMNADO', nombre: 'Aviso a la familia', texto: 'x' },
    { id: 'pl-b', tipo: 'CERTIFICADO', categoria: 'ALUMNADO', nombre: 'Otro correo', texto: 'x' },
    { id: 'pl-c', tipo: '', categoria: '', nombre: 'Aviso de avance', texto: 'x' },
    { id: 'pl-d', tipo: '', categoria: '', nombre: 'Aviso de cierre', texto: 'x' },
    { id: 'pl-e', tipo: 'BECA', categoria: 'ALUMNADO', nombre: 'Del modelo', texto: 'x' },
    { id: 'pl-f', tipo: 'BECA', categoria: 'ALUMNADO', nombre: 'Del aviso del hito', texto: 'x' },
    { id: 'pl-g', tipo: 'BECA', categoria: 'ALUMNADO', nombre: 'La que no usa nadie', texto: 'x' }
  ],
  documentos: [
    { id: 'pd-1', tipo: 'CERTIFICADO', categoria: 'ALUMNADO', nombre: 'Certificado de notas', fichero: 'notas.docx' },
    { id: 'pd-2', tipo: 'CERTIFICADO', categoria: 'ALUMNADO', nombre: 'Dentro de una respuesta', fichero: 'a.docx' },
    { id: 'pd-3', tipo: 'BECA', categoria: 'ALUMNADO', nombre: 'Documentos del hito', fichero: 'b.docx' },
    { id: 'pd-4', tipo: 'BECA', categoria: 'ALUMNADO', nombre: 'Nadie', fichero: 'c.docx' }
  ]
};
const guias = {
  CERTIFICADO: [
    { id: 'h1', titulo: 'Recibir la solicitud', guion: [], opciones: [] },
    { id: 'h2', titulo: 'Notificar a la familia', opciones: [], guion: [
      { id: 't1', accion: 'generar', receta: { plantilla: 'pd-1' } },
      { id: 't2', accion: 'comunicar', receta: { plantilla: 'pl-a' } },
      { id: 't3', accion: 'registrar', receta: { plantilla: 'pl-b' } }   /* otra acción: no cuenta */
    ] },
    { id: 'h3', titulo: '¿Hay recurso?', guion: [], opciones: [
      { id: 'o1', titulo: 'Sí', pasos: [
        { id: 'h3a', titulo: 'Resolver el recurso', opciones: [], guion: [{ id: 't4', accion: 'generar', receta: { plantilla: 'pd-2' } }] }
      ] },
      { id: 'o2', titulo: 'No', pasos: [] }
    ] },
    { id: 'h4', titulo: 'Avisar de que está listo', guion: [], opciones: [], avisarLoPide: true, avisarLoPidePlantilla: 'pl-f' },
    { id: 'h5', titulo: 'Avisar con la de siempre', guion: [], opciones: [], avisarLoPide: true, avisarLoPidePlantilla: '' }
  ],
  BECA: [
    { id: 'b1', titulo: 'Documentos', guion: [], opciones: [], plantillasDocumento: ['pd-3'] }
  ]
};
const tipos = [
  { tipo: 'CERTIFICADO', categoria: 'ALUMNADO', avisarLoPideCierre: true, avisarLoPideCierrePlantilla: '' },
  { tipo: 'BECA', categoria: 'ALUMNADO', avisarLoPideCierre: false }
];
const modelos = [
  { id: 'm1', titulo: 'Notificar la resolución', guion: [{ id: 'mt', accion: 'comunicar', receta: { plantilla: 'pl-e' } }], plantillasDocumento: [] }
];

const uso = PlantillasUso.calcular({ plantillas, guias, tipos, modelos });
const et = (id) => (uso[id] || []).map((s) => s.etiqueta);

comprobar('una tarea de generar (Word) y su hito, con número', [et('pd-1'), uso['pd-1'][0].numero, uso['pd-1'][0].de, uso['pd-1'][0].tipo], [['Hito 2 · Notificar a la familia'], 2, 5, 'CERTIFICADO']);
comprobar('una tarea de comunicar (correo)', et('pl-a'), ['Hito 2 · Notificar a la familia']);
comprobar('una tarea con otra acción no cuenta', et('pl-b'), []);
comprobar('un hito dentro de una respuesta cuenta con el número del hito de primer nivel', [et('pd-2'), uso['pd-2'][0].numero], [['Hito 3 · Resolver el recurso'], 3]);
comprobar('el aviso «al terminar» con su plantilla', et('pl-f'), ['Hito 4 · Avisar de que está listo']);
comprobar('el aviso «al terminar» sin plantilla usa «Aviso de avance»', et('pl-c'), ['Hito 5 · Avisar con la de siempre']);
comprobar('el aviso «al cerrar» de un tipo (sin plantilla, «Aviso de cierre»)', [et('pl-d'), uso['pl-d'][0].forma, uso['pl-d'][0].tipo], [['Al cerrar el asunto'], 'aviso-al-cerrar', 'CERTIFICADO']);
comprobar('un modelo de la biblioteca', [et('pl-e'), uso['pl-e'][0].biblioteca], [['Biblioteca · Notificar la resolución'], true]);
comprobar('los documentos de un hito (plantillasDocumento)', et('pd-3'), ['Hito 1 · Documentos']);
comprobar('una plantilla que no usa nadie no sale', [uso['pl-g'], uso['pd-4']], [undefined, undefined]);
comprobar('un id que no existe no se anota', Object.keys(PlantillasUso.calcular({ plantillas: { lista: [], documentos: [] }, guias, tipos, modelos })), []);
comprobar('sin datos no falla', Object.keys(PlantillasUso.calcular()), []);

if (fallos) { console.log('\n' + fallos + ' fallos.'); process.exit(1); }
console.log('\nTodas las pruebas de «qué hitos usan cada plantilla» pasan.');
