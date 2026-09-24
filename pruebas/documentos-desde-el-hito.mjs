/* Prueba de la fila 102 (docs/DOCUMENTOS-DESDE-EL-HITO.md): generar
   documentos desde el hito. Con la aplicación entera cargada en el
   navegador (para tener a la vez Guias, Hitos, Plantillas y los dos
   ficheros nuevos), pero probando sobre todo funciones sueltas:

   1. `plantillasDocumento` se normaliza (lista buena, basura, repetidos)
      y un paso-pregunta lo descarta, a cualquier nivel.
   2. HitosBiblioteca.diferencias detecta el cambio de plantillas.
   3. Agrupar «De este paso» / «Otras de este tipo», sin repetir e
      ignorando los id borrados.
   4. Los huecos nuevos: con hito, rellenos; sin hito, vacíos y fuera de
      «faltan»; {hecho:X} con un hito hecho, uno sin hacer y uno que no
      existe. Marcar un hito hecho le apunta la fecha.
   5. El botón «Generar documento» sale en el hito cuyo paso tiene una
      plantilla, y no en uno sin ninguna; generar desde él deja el
      documento apuntado a ese hito y una nota en su historial.

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
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* La guía y las plantillas, antes de entrar (la guía se lee al entrar). */
const GUIA = {
  MATRICULA: [
    { id: 'p1', titulo: 'Recoger la solicitud', plantillasDocumento: ['pd-a'] },
    { id: 'p2', titulo: 'Comprobar', opciones: [] },
    { id: 'p3', titulo: 'Firmar la resolución' }
  ]
};
const PLANTILLAS = {
  documentos: [
    { id: 'pd-a', tipo: 'BECA', categoria: 'ALUMNADO', nombre: 'Acuse de recibo', fichero: 'acuse.docx', tipoDocumento: 'ACUSE', texto: '' },
    { id: 'pd-b', tipo: 'MATRICULA', categoria: 'ALUMNADO', nombre: 'Certificado', fichero: 'cert.docx', tipoDocumento: 'CERTIFICADO', texto: '' }
  ]
};
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.evaluate(async ([GUIA, PLANTILLAS]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  for (const [n, d] of [['guias.json', GUIA], ['plantillas.json', PLANTILLAS]]) {
    const h = await g.getFileHandle(n, { create: true });
    const w = await h.createWritable(); await w.write(JSON.stringify(d)); await w.close();
  }
  const pl = await g.getDirectoryHandle('PLANTILLAS', { create: true });
  for (const f of ['acuse.docx', 'cert.docx']) pl._hijos.set(f, window.__disco.fich(f, 'PK'));
}, [GUIA, PLANTILLAS]);
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ---------- 1. normalizar ---------- */
console.log('--- 1. normalizar plantillasDocumento ---');
await comprobar('lista buena, sin repetir, sin basura',
  pagina.evaluate(() => Guias.normalizar([{ titulo: 'x', plantillasDocumento: ['a', 'b', 'a', '', null, 7] }])[0].plantillasDocumento),
  ['a', 'b', '7']);
await comprobar('si no es lista, vacía',
  pagina.evaluate(() => Guias.normalizar([{ titulo: 'x', plantillasDocumento: 'a' }])[0].plantillasDocumento), []);
await comprobar('un paso-pregunta la descarta, también dentro de una opción',
  pagina.evaluate(() => {
    const n = Guias.normalizar([{ titulo: 'q', plantillasDocumento: ['a'], opciones: [
      { titulo: 'sí', pasos: [{ titulo: 'q2', plantillasDocumento: ['b'], opciones: [{ titulo: 'x', pasos: [{ titulo: 'hoja', plantillasDocumento: ['c'] }] }] }] }
    ] }]);
    const q2 = n[0].opciones[0].pasos[0];
    return [n[0].plantillasDocumento, q2.plantillasDocumento, q2.opciones[0].pasos[0].plantillasDocumento];
  }), [[], [], ['c']]);

/* ---------- 2. la biblioteca ---------- */
console.log('--- 2. la biblioteca ---');
await comprobar('HitosBiblioteca.diferencias ve el cambio de plantillas, con sus nombres',
  pagina.evaluate(async () => {
    await Plantillas.cargar(App.E.gestor);
    const modelo = HitosBiblioteca._normalizarModelo({ titulo: 'Recoger', plantillasDocumento: ['pd-a'] });
    const paso = HitosBiblioteca.modeloAPaso(modelo);
    const iguales = HitosBiblioteca.diferencias(paso, modelo).length;
    paso.plantillasDocumento = ['pd-a', 'pd-b', 'pd-borrada'];
    const d = HitosBiblioteca.diferencias(paso, modelo).filter(x => x.campo === 'plantillasDocumento')[0];
    return [iguales, d && d.etiqueta, d && d.antes];
  }), [0, 'Documentos', 'Acuse de recibo, Certificado, (plantilla borrada)']);

/* ---------- 3. agrupar ---------- */
console.log('--- 3. agrupar ---');
await comprobar('«De este paso» primero, sin repetir en «Otras», ignorando los borrados',
  pagina.evaluate(() => {
    const cat = [{ id: 'a', nombre: 'A' }, { id: 'b', nombre: 'B' }, { id: 'c', nombre: 'C' }];
    const g = HitosGenerar.agrupar(['b', 'borrada', 'b'], [{ id: 'b', nombre: 'B' }, { id: 'c', nombre: 'C' }], cat);
    return [g.delPaso.map(x => x.id), g.delTipo.map(x => x.id)];
  }), [['b'], ['c']]);

/* ---------- 4. los huecos ---------- */
console.log('--- 4. los huecos nuevos ---');
const A = '260920 MATRICULA Uno, Ana 1150001';
await pagina.evaluate(async (A) => {
  await window.__disco.abiertos.getDirectoryHandle(A, { create: true });
  await App.anotar(A, { tipo: 'MATRICULA', categoria: 'ALUMNADO', tercero: 'Uno, Ana 1150001', abiertoEl: U.ahora() });
  await App.verAbiertos();
  await Hitos.marcar(A, 'p1', 'hecho');
}, A);
await comprobar('marcar un hito hecho le apunta la fecha',
  pagina.evaluate(async (A) => (await Hitos.hitosDe(A)).filter(h => h.id === 'p1')[0].hechoEl === U.hoyIso(), A), true);
const r4 = await pagina.evaluate(async (A) => {
  const a = App.E.listaAbiertos.filter(x => x.nombre === A)[0];
  const hitos = await Hitos.hitosDe(A);
  const p2 = hitos.filter(h => h.id === 'p2')[0];
  p2.fecha = '2026-10-15';
  const texto = '[{{HITO}}] [{{PLAZO DEL HITO}}] [{hecho:recoger la SOLICITUD}] [{hecho:Firmar la resolución}] [{hecho:No existe}]';
  const conHito = Plantillas.rellenar(texto, await Plantillas.valoresDeAsunto(a, { hito: p2 }));
  const sinHito = Plantillas.rellenar(texto, await Plantillas.valoresDeAsunto(a));
  return { conHito, sinHito, hoy: U.fechaLegible(U.aAaMmDd(U.hoyIso())) };
}, A);
await comprobar('con hito: título, plazo y la fecha del hecho',
  Promise.resolve(r4.conHito.texto), '[Comprobar] [15/10/2026] [' + r4.hoy + '] [] []');
await comprobar('con hito: faltan el sin hacer y el que no existe',
  Promise.resolve(r4.conHito.faltan), ['hecho: Firmar la resolución', 'hecho: No existe']);
await comprobar('sin hito: todo vacío', Promise.resolve(r4.sinHito.texto), '[] [] [] [] []');
await comprobar('sin hito: nada cuenta como dato que falta', Promise.resolve(r4.sinHito.faltan), []);

/* ---------- 5. el botón y generar ---------- */
console.log('--- 5. el botón en el hito ---');
await pagina.evaluate((A) => App.abrirFicha(App.E.listaAbiertos.filter(x => x.nombre === A)[0], 'abierto'), A);
await pagina.waitForSelector('#ficha-guia .hito[data-id="p1"]');
await pagina.waitForTimeout(500);
await comprobar('sale en el hito cuyo paso tiene una plantilla (aunque sea de otro tipo)',
  pagina.locator('#ficha-guia .hito[data-id="p1"] .hito-generar').count(), 1);
await comprobar('y en uno sin plantilla propia, porque el tipo tiene una',
  pagina.locator('#ficha-guia .hito[data-id="p3"] .hito-generar').count(), 1);

const r5 = await pagina.evaluate(async (A) => {
  /* Sin Word de verdad: el rellenado se sustituye, lo que se prueba es
     lo que pasa alrededor. */
  window.Docx.rellenar = async () => ({ blob: new Blob(['doc']), faltan: [] });
  const a = App.E.listaAbiertos.filter(x => x.nombre === A)[0];
  const h = (await Hitos.hitosDe(A)).filter(x => x.id === 'p3')[0];
  await PlantillasDocumento.generar(a, PLANTILLAS_DOC_B(), 'abierto', { hito: h });
  function PLANTILLAS_DOC_B() { return Plantillas.documentoPorId('pd-b'); }
  const h2 = (await Hitos.hitosDe(A)).filter(x => x.id === 'p3')[0];
  const c = await window.__disco.abiertos.getDirectoryHandle(A);
  return { ficheros: Array.from(c._hijos.keys()), docs: h2.documentos, notas: h2.notas.map(n => n.texto) };
}, A);
const esperado = await pagina.evaluate(() => PlantillasDocumento.nombreDelDocumentoGenerado(Plantillas.documentoPorId('pd-b'), U.hoyIso()));
await comprobar('el documento está en la carpeta', Promise.resolve(r5.ficheros.indexOf(esperado) > -1), true);
await comprobar('apuntado a ese hito', Promise.resolve(r5.docs), [esperado]);
await comprobar('con su nota en el hito', Promise.resolve(r5.notas), ['Generado «' + esperado + '»']);

/* ---------- 6. el editor del paso ---------- */
console.log('--- 6. «Documentos de este paso» en el editor ---');
await pagina.evaluate(() => { App.volverALaLista(); });
await pagina.evaluate(() => {
  window.__editada = Guias.editar('MATRICULA', [{ id: 'e1', titulo: 'Paso', plantillasDocumento: ['pd-a', 'pd-borrada'] }], [], []);
});
await pagina.waitForSelector('#guia-pasos .paso-documentos');
await comprobar('sale la sección, con la del paso marcada y la borrada tachada',
  pagina.evaluate(() => {
    const d = document.querySelector('#guia-pasos .paso-documentos');
    return [d.querySelector('.guiadoc-casilla[data-id="pd-a"]').checked,
            d.querySelector('.guiadoc-casilla[data-id="pd-b"]').checked,
            d.textContent.indexOf('(plantilla borrada)') > -1];
  }), [true, false, true]);
await pagina.evaluate(() => { document.querySelector('.guiadoc-casilla[data-id="pd-b"]').click(); });
await pagina.click('#cuadro-aceptar');
await comprobar('al guardar: las marcadas, y la borrada se quita',
  pagina.evaluate(async () => (await window.__editada)[0].plantillasDocumento), ['pd-a', 'pd-b']);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
