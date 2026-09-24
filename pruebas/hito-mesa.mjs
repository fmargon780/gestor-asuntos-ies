/* Prueba en navegador de verdad de la mesa del hito (24-sep-2026, fila
   109 de docs/COLA.md, docs/EL-HITO-A-PANTALLA-COMPLETA.md).

   A 1905×1000 y a 1280×800:
     1. Pulsar un hito en la lista abre su mesa con las tres columnas
        (a 1905 px, una al lado de otra y sin desplazarse).
     2. Cambiar el responsable y el plazo desde sus etiquetas; se guarda.
     3. Generar un documento desde la mesa marca solo el paso de guion
        `generar`, y el documento sale en la tabla; un PDF con su .docx
        del mismo nombre enseña el gemelo colgando.
     4. Seleccionar dos documentos y "Enviar por correo": el cuadro sale
        con los dos premarcados.
     5. Un hito-pregunta enseña las opciones; elegir otra actualiza la tira.
     6. Con un documento abierto a la derecha, la mesa sigue abierta.
     7. Escape vuelve a la lista; desde "Qué me toca" se entra directo en
        la mesa.
     8. "Traer los guiones del instituto" no pisa un guion ya escrito.

   Con FOTOS=<carpeta>, deja una foto de la mesa a 1905 px. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260905 MATRICULA 26-27 Pérez Ruiz, Ana 1234';
const GUIAS = {
  MATRICULA: [
    { id: 'm1', titulo: 'Recoger la solicitud', cuerpo: '', opciones: [], plantillasDocumento: ['pd-b'],
      guion: [
        { id: 'g1', texto: 'Comprobar que la solicitud está firmada', explicacion: '', accion: '' },
        { id: 'g2', texto: 'Generar el recibí', explicacion: '', accion: 'generar', normativa: { cita: 'Decreto 21/2020, art. 5' } },
        { id: 'g3', texto: 'Comunicar a la familia', explicacion: '', accion: 'comunicar' }
      ] },
    { id: 'm2', titulo: '¿Qué supuesto es?', opciones: [
      { id: 'o1', titulo: 'Ordinario', pasos: [{ id: 'm2a', titulo: 'Grabar en Séneca', cuerpo: '' }] },
      { id: 'o2', titulo: 'Extraordinario', pasos: [{ id: 'm2b', titulo: 'Pedir informe a la Delegación', cuerpo: '' }] }
    ] },
    { id: 'm3', titulo: 'Archivar el expediente', cuerpo: '', opciones: [] }
  ]
};
const PLANTILLAS = { documentos: [
  { id: 'pd-b', tipo: 'MATRICULA', categoria: 'ALUMNADO', nombre: 'Recibí', fichero: 'recibi.docx', tipoDocumento: 'RECIBI', texto: '' }
] };
const DOCS = ['260901 SOLICITUD.pdf', '260901 SOLICITUD.docx', '260902 26EM0617 JUSTIFICANTE.pdf'];

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

async function preparar(ancho, alto) {
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto } });
  const errores = [];
  pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript(preparacion);
  await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
  await pagina.click('#btn-abiertos');
  await pagina.click('#btn-archivo');
  await pagina.fill('#campo-usuario', 'Francisco');
  await pagina.waitForSelector('#btn-entrar:not([disabled])');
  await pagina.evaluate(async ([guias, plantillas, docs, asunto]) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
    for (const [n, d] of [['guias.json', guias], ['plantillas.json', plantillas]]) {
      const h = await g.getFileHandle(n, { create: true });
      const w = await h.createWritable(); await w.write(JSON.stringify(d)); await w.close();
    }
    const pl = await g.getDirectoryHandle('PLANTILLAS', { create: true });
    pl._hijos.set('recibi.docx', window.__disco.fich('recibi.docx', 'PK'));
    const c = await window.__disco.abiertos.getDirectoryHandle(asunto, { create: true });
    docs.forEach((d) => c._hijos.set(d, window.__disco.fich(d, '%PDF-1.4')));
  }, [GUIAS, PLANTILLAS, DOCS, ASUNTO]);
  await pagina.click('#btn-entrar');
  await pagina.waitForSelector('#aplicacion:not(.oculto)');
  await pagina.evaluate(async ([asunto, docs]) => {
    await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'MATRICULA', categoria: 'ALUMNADO',
      tercero: 'Pérez Ruiz, Ana 1234', curso: '26-27', grupo: '', descripcion: '', campos: {} });
    await Hitos.anadirDocumento(asunto, 'm1', docs[0]);
    await Hitos.anadirDocumento(asunto, 'm1', docs[2]);
    await Plantillas.cargar(App.E.gestor);
    /* Sin Word de verdad: el rellenado se sustituye (como en pruebas/documentos-desde-el-hito.mjs). */
    window.Docx.rellenar = async () => ({ blob: new Blob(['doc']), faltan: [] });
    await App.verAbiertos();
  }, [ASUNTO, DOCS]);
  await pagina.locator('.tarjeta-nombre', { hasText: ASUNTO }).first().click();
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
  await pagina.waitForTimeout(400);
  return { pagina, errores };
}

function leerHito(pagina, id) {
  return pagina.evaluate(async ([asunto, id]) => {
    const d = await Hitos.leer();
    return Hitos.buscar(d.porAsunto[asunto].hitos, id);
  }, [ASUNTO, id]);
}

async function abrirMesa(pagina, id) {
  await pagina.locator('#ficha-guia .hito[data-id="' + id + '"] .hito-titulo').click();
  await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa[data-id="' + id + '"]');
  await pagina.waitForTimeout(300);
}

async function elegirDelMenu(pagina, disparador, texto) {
  await pagina.locator(disparador).click();
  await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: texto }).first().click();
  await pagina.waitForTimeout(500);
}

for (const [ancho, alto] of [[1905, 1000], [1280, 800]]) {
  console.log('--- a ' + ancho + '×' + alto + ' ---');
  const { pagina, errores } = await preparar(ancho, alto);

  /* 1. */
  await comprobar('1. la lista es compacta: ningún hito desplegado',
    pagina.locator('#ficha-guia .hito-cuerpo:visible').count(), 0);
  await abrirMesa(pagina, 'm1');
  await comprobar('1. la mesa se abre, con las tres columnas',
    pagina.locator('.hito-en-mesa .mesa-col:visible').count(), 3);
  await comprobar('1. los demás hitos no se ven', pagina.locator('#ficha-guia .hito[data-id="m3"]').isVisible(), false);
  await comprobar('1. el guion, con su cuenta', pagina.locator('.hito-en-mesa .mesa-guion-cuenta').textContent(), '0 de 3');
  if (ancho === 1905) {
    await comprobar('1. a 1905 px, las tres columnas una al lado de otra y a la vista, sin bajar',
      pagina.evaluate(() => {
        const c = Array.from(document.querySelectorAll('.hito-en-mesa .mesa-col')).map((e) => e.getBoundingClientRect());
        return c.length === 3 && c[0].right <= c[1].left && c[1].right <= c[2].left &&
          c.every((r) => Math.abs(r.top - c[0].top) < 2 && r.top < window.innerHeight - 100) && window.scrollY === 0;
      }), true);
    if (process.env.FOTOS) await pagina.screenshot({ path: process.env.FOTOS + '/mesa.png' });
  }

  /* 2. */
  await elegirDelMenu(pagina, '.hito-en-mesa .mesa-etq-resp', 'Yo');
  await comprobar('2. el responsable, cambiado desde su etiqueta y guardado', leerHito(pagina, 'm1').then((h) => h.responsable), 'yo');
  await pagina.locator('.hito-en-mesa .mesa-etq-plazo').click();
  await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Cambiar la fecha' }).first().click();
  await pagina.waitForSelector('#mesa-fecha-nueva');
  const dentroDe20 = await pagina.evaluate(() => Plazos.sumarDias ? Plazos.sumarDias(U.hoyIso(), 20) : '');
  await pagina.fill('#mesa-fecha-nueva', dentroDe20);
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForTimeout(600);
  await comprobar('2. el plazo, cambiado desde su etiqueta y guardado', leerHito(pagina, 'm1').then((h) => h.fecha), dentroDe20);
  await comprobar('2. la etiqueta del plazo cuenta días hábiles',
    pagina.locator('.hito-en-mesa .mesa-etq-plazo').textContent().then((t) => /días? hábil/.test(t)), true);
  await comprobar('2. la mesa sigue abierta tras guardar', pagina.locator('.hito-en-mesa[data-id="m1"]').isVisible(), true);

  /* 3. */
  await pagina.locator('.hito-en-mesa .mesa-plantilla-generar').first().click();
  await pagina.waitForTimeout(900);
  await comprobar('3. generar marca solo el paso «generar» del guion',
    leerHito(pagina, 'm1').then((h) => Object.keys(h.guionHecho || {}).filter((k) => h.guionHecho[k].hecho)), ['g2']);
  await comprobar('3. y la cuenta del guion lo dice', pagina.locator('.hito-en-mesa .mesa-guion-cuenta').textContent(), '1 de 3');
  const generado = await pagina.evaluate(() => PlantillasDocumento.nombreDelDocumentoGenerado(Plantillas.documentoPorId('pd-b'), U.hoyIso()));
  await comprobar('3. el documento generado sale en la tabla',
    pagina.locator('.hito-en-mesa .hito-documento[data-doc="' + generado + '"]').count(), 1);
  await comprobar('3. el PDF enseña su .docx gemelo colgando, sin fila propia',
    pagina.evaluate(() => {
      const fila = document.querySelector('.hito-en-mesa .hito-documento[data-doc="260901 SOLICITUD.pdf"]');
      return !!fila && !!fila.querySelector('.mesa-doc-gemelo') && fila.querySelector('.mesa-doc-gemelo').textContent;
    }), 'Borrador en Word');
  await comprobar('3. el registrado dice su código',
    pagina.locator('.hito-en-mesa .hito-documento[data-doc="' + DOCS[2] + '"] .mesa-doc-estado').textContent(), 'Registrado 26EM0617');

  /* 4. */
  await pagina.locator('.hito-en-mesa .hito-documento[data-doc="' + DOCS[0] + '"] .mesa-doc-marca').check();
  await pagina.locator('.hito-en-mesa .hito-documento[data-doc="' + DOCS[2] + '"] .mesa-doc-marca').check();
  await comprobar('4. sale la barra de la selección', pagina.locator('.hito-en-mesa .mesa-seleccion').textContent().then((t) => t.indexOf('2 marcados') !== -1), true);
  await pagina.locator('.hito-en-mesa .mesa-sel-enviar').click();
  await pagina.waitForSelector('#correo-caja input[type="checkbox"]', { timeout: 10000 }).catch(() => {});
  await pagina.waitForTimeout(800);
  await comprobar('4. el cuadro de correo sale con los dos premarcados',
    pagina.evaluate((docs) => {
      const marcados = Array.from(document.querySelectorAll('#correo-caja input[type="checkbox"]:checked'))
        .map((c) => (c.closest('label') || c.parentNode).textContent);
      return docs.every((d) => marcados.some((t) => t.indexOf(d) !== -1));
    }, [DOCS[0], DOCS[2]]), true);
  await pagina.keyboard.press('Escape');
  await pagina.waitForSelector('#capa', { state: 'hidden' });

  /* 5. */
  await pagina.evaluate(() => HitoMesa.cerrar());
  await pagina.locator('#ficha-guia .hito[data-id="m2"] .hito-opcion[data-opcion="o1"]').click();
  await pagina.waitForTimeout(700);
  await abrirMesa(pagina, 'm2');
  await comprobar('5. el hito-pregunta enseña sus opciones, la elegida en verde',
    pagina.locator('.hito-en-mesa .mesa-opcion.elegida').textContent().then((t) => t.indexOf('Ordinario') !== -1), true);
  await comprobar('5. la tira lleva el hito de la rama elegida',
    pagina.locator('.hito-en-mesa .mesa-tira-hito').allTextContents().then((t) => t.join('|').indexOf('Grabar en Séneca') !== -1), true);
  await pagina.locator('.hito-en-mesa .mesa-opcion[data-opcion="o2"]').click();
  await pagina.waitForTimeout(900);
  await comprobar('5. al elegir la otra, la tira se actualiza',
    pagina.locator('.hito-en-mesa .mesa-tira-hito').allTextContents().then((t) => t.join('|')).then((t) =>
      t.indexOf('Pedir informe a la Delegación') !== -1 && t.indexOf('Grabar en Séneca') === -1), true);

  /* 6. */
  await pagina.locator('.hito-en-mesa .mesa-tira-hito', { hasText: 'Recoger la solicitud' }).click();
  await pagina.waitForTimeout(300);
  await pagina.locator('.hito-en-mesa .hito-documento[data-doc="' + DOCS[2] + '"] .hito-doc-abrir').click();
  await pagina.waitForSelector('body.con-visor');
  await pagina.waitForTimeout(300);
  await comprobar('6. con el documento a la derecha, la mesa sigue abierta',
    pagina.locator('.hito-en-mesa[data-id="m1"] .mesa-guion').isVisible(), true);
  await pagina.keyboard.press('Escape');   /* cierra el documento */
  await pagina.waitForTimeout(200);

  /* 7. */
  await pagina.keyboard.press('Escape');
  await pagina.waitForTimeout(200);
  await comprobar('7. Escape vuelve a la lista de hitos',
    pagina.evaluate(() => !document.getElementById('ficha-guia').classList.contains('con-mesa')), true);
  await comprobar('7. con la tarjeta de Hitos todavía abierta',
    pagina.evaluate(() => FichaTarjetas.abierta()), 'hitos');
  await pagina.evaluate(() => document.querySelector('.pestana[data-pantalla="que-me-toca"]').click());
  await pagina.waitForSelector('#pantalla-que-me-toca:not(.oculto)');
  await pagina.waitForTimeout(300);
  await pagina.evaluate(() => document.querySelector('.qmt-fila[data-hito="m1"]').click());
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForTimeout(700);
  await comprobar('7. desde "Qué me toca", directo en la mesa del hito',
    pagina.locator('#ficha-guia.con-mesa .hito-en-mesa[data-id="m1"]').isVisible(), true);

  /* 8. */
  const r8 = await pagina.evaluate(async () => {
    const g = App.E.gestor;
    const guias = await Carpetas.leerJson(g, 'guias.json');
    /* Un paso sin guion que viene del modelo b1 de la biblioteca, y otro
       que también viene de él pero ya tiene guion escrito. */
    guias.MATRICULA.push({ id: 'x1', titulo: 'Sin guion', origenBiblioteca: { id: 'b1', revision: 1 } });
    guias.MATRICULA.push({ id: 'x2', titulo: 'Con guion', origenBiblioteca: { id: 'b1', revision: 1 },
      guion: [{ id: 'mio', texto: 'El mío, que no se toca', accion: '' }] });
    await Copias.guardar(g, 'guias.json', guias);
    const r = await CargarBiblioteca.traerGuiones();
    const despues = await Carpetas.leerJson(g, 'guias.json');
    const x1 = despues.MATRICULA.filter((p) => p.id === 'x1')[0];
    const x2 = despues.MATRICULA.filter((p) => p.id === 'x2')[0];
    return { traidos: r.pasos >= 1, x1: (x1.guion || []).length > 0, x2: x2.guion.map((p) => p.texto) };
  });
  await comprobar('8. trae el guion al paso que no tenía', Promise.resolve([r8.traidos, r8.x1]), [true, true]);
  await comprobar('8. y no pisa el que ya estaba escrito', Promise.resolve(r8.x2), ['El mío, que no se toca']);

  await comprobar('sin errores en la consola', errores, []);
  await pagina.close();
}

await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
