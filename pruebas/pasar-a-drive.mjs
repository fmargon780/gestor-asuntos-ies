/* Prueba en navegador de verdad del botón «Pasar a Drive».

   Fila 458 de docs/COLA.md (docs/PASAR-A-DRIVE.md, apartado «Fila 458»). Chromium real con la copia de
   pruebas (?demo=1&auto=1), que trae un segundo disco de mentira, el de Google Drive («Mi unidad»).

     A. el botón sale en Ajustes → Mantenimiento; con otra persona dentro avisa y deja «Seguir de todas formas»;
     B. señalar una carpeta que no es «Mi unidad» no sigue; antes de empezar dice cuántos documentos y dónde mirar el espacio;
     C. traslado entero: «Copiados N documentos. No falta ninguno», las carpetas de Drive tienen lo mismo (tamaños y
        _GESTOR byte a byte), las fechas originales se conservan, la app sigue en Drive, el asunto de las Elecciones se abre
        con sus documentos, «NO USAR – pasado a Drive el …» existe, los sueltos siguen en «Por clasificar», el cerrojo
        no está en Drive y «Ya las he arrastrado» avisa de lo que queda y, con todo arrastrado, termina;
     D. cortado a la mitad: «Hay un traslado a medias», «Seguir» termina con «No falta ninguno»;
     E. un cerrojo de otro ordenador deja la app en solo consulta y no deja escribir. */
import { chromium } from 'playwright';

const BASE = process.env.DIRECCION || 'http://localhost:8123/index.html';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];

async function abrir(extra) {
  const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  await pagina.goto(BASE + '?demo=1&auto=1' + (extra || ''));
  await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
  /* la demostración sigue montando datos un rato: se espera a que estén los de las Elecciones al Consejo Escolar */
  await pagina.waitForFunction(async () => {
    for await (const [n, h] of Demo.disco().abiertos.entries()) {
      if (h.kind === 'directory' && n.indexOf('ELECC') !== -1) { for await (const [m] of h.entries()) if (m === 'Versiones previas') return true; }
    }
    return false;
  }, null, { timeout: 60000 });
  await pagina.waitForFunction(() => window.Problemas && Problemas.ids().includes('conflictos'), null, { timeout: 60000 });
  /* y a que deje de escribir (asuntos.json, hitos.json y los PDF de la demostración): la misma huella dos veces seguidas */
  let huella = '', iguales = 0;
  for (let i = 0; i < 40 && iguales < 3; i++) {
    const h = await pagina.evaluate(async () => {
      let t = 0;
      async function ir(d) { for await (const [, x] of d.entries()) { if (x.kind === 'directory') await ir(x); else t += (await x.getFile()).size; } }
      await ir(Demo.disco().abiertos);
      return t;
    });
    iguales = String(h) === huella ? iguales + 1 : 0;
    huella = String(h);
    await pagina.waitForTimeout(700);
  }
  return pagina;
}

async function irAMantenimiento(p) {
  await p.evaluate(() => { App.ir('ajustes'); setTimeout(() => App.irASeccionDeAjustes(document.getElementById('pasar-a-drive-ajustes')), 300); });
  await p.waitForSelector('#traslado-zona button', { state: 'visible', timeout: 15000 });
  await p.waitForTimeout(300);
}

/* El árbol (ruta → tamaño) de una carpeta del disco de mentira. */
const arbol = (p, que) => p.evaluate(async (que) => {
  async function ir(d, pre, sal) {
    for await (const [n, h] of d.entries()) {
      if (h.kind === 'directory') { sal[pre + n + '/'] = -1; await ir(h, pre + n + '/', sal); }
      else sal[pre + n] = (await h.getFile()).size;
    }
    return sal;
  }
  const disco = Demo.disco();
  const raiz = que === 'dropbox' ? disco.abiertos : que === 'archivo' ? disco.archivo : (await disco.drive.getDirectoryHandle(que));
  return ir(raiz, '', {});
}, que);

/* ---------- A y B. el botón, la presencia y la carpeta equivocada ---------- */
{
  const p = await abrir();
  await irAMantenimiento(p);
  await comprobar('A. en Ajustes aparece «Pasar a Drive»', p.locator('#traslado-pasar').innerText(), 'Pasar a Drive');

  /* otra persona dentro: una señal vigente de otro usuario */
  await p.evaluate(async () => {
    const c = await Carpetas.crear(App.E.gestor, 'presencia');
    await Carpetas.escribirTexto(c, 'diego.json', JSON.stringify({ usuario: 'Diego', asuntos: { 'algo': { ultima: new Date().toISOString() } } }));
  });
  await p.click('#traslado-pasar');
  await p.waitForSelector('#traslado-presencia');
  await comprobar('A. con otra persona dentro no empieza y lo dice', p.locator('#traslado-presencia').innerText(), 'Diego está dentro de la app. Pídele que la cierre y vuelve a pulsar.');
  await comprobar('A. sale «Seguir de todas formas»', p.locator('#traslado-seguir-igual').count(), 1);
  await p.click('#traslado-seguir-igual');
  await p.waitForSelector('#traslado-senalar');

  /* la carpeta equivocada */
  await p.evaluate(() => { const d = Demo.disco(); const bueno = d.drive; d.drive = Demo.carpetaDeMentira('Otra cosa'); window.__driveBueno = bueno; });
  await p.click('#traslado-senalar');
  await p.waitForSelector('.traslado-error');
  await comprobar('B. una carpeta que no es «Mi unidad» no sigue', (await p.locator('.traslado-error').innerText()).indexOf('Mi unidad') !== -1, true);
  await p.evaluate(() => { Demo.disco().drive = window.__driveBueno; });
  await p.click('text=Señalar otra vez');
  await p.waitForSelector('#traslado-cuenta');
  const cuenta = await p.locator('#traslado-cuenta').innerText();
  await comprobar('B. dice cuántos documentos va a copiar y cuánto ocupan', /^Vas a copiar \d+ documentos \(\d+[,.]\d+ GB\)/.test(cuenta), true);
  await comprobar('B. dice que la cuenta tiene 50 GB y dónde mirar el espacio', cuenta.indexOf('50 GB') !== -1 && cuenta.indexOf('https://drive.google.com/settings/storage') !== -1, true);
  await comprobar('B. el cerrojo está puesto en Dropbox', p.evaluate(async () => !!(await Carpetas.leerJson(App.E.gestor, 'traslado-en-marcha.json'))), true);
  await p.click('#traslado-cancelar');
  await p.waitForTimeout(400);
  await comprobar('B. cancelar quita el cerrojo', p.evaluate(async () => (await Carpetas.leerJson(App.E.gestor, 'traslado-en-marcha.json')) === null), true);
  await comprobar('B. y vuelve el botón', p.locator('#traslado-pasar').count(), 1);
  await p.close();
}

/* ---------- C. el traslado entero ---------- */
{
  const p = await abrir();
  const antes = await p.evaluate(async () => {
    const abiertos = Demo.disco().abiertos;
    await Carpetas.escribirBytes(abiertos, 'Oficio suelto.pdf', 'oficio suelto', 'application/pdf');
    const archivo = Demo.disco().archivo;
    const cat = await Carpetas.crear(archivo, 'PERSONAL');
    await Carpetas.escribirBytes(cat, 'Archivado 1.pdf', 'archivado', 'application/pdf');
    const nombres = [];
    for await (const [n, h] of abiertos.entries()) if (h.kind === 'directory' && n.indexOf('ELECC') !== -1) nombres.push(n);
    return { elecciones: nombres[0] || '' };
  });
  const dropboxAntes = await arbol(p, 'dropbox');
  const archivoAntes = await arbol(p, 'archivo');
  const fechaAntes = await p.evaluate(async () => {
    /* una fecha de modificación vieja en un documento de las Elecciones */
    let carpeta = null;
    for await (const [n, h] of Demo.disco().abiertos.entries()) if (h.kind === 'directory' && n.indexOf('ELECC') !== -1) carpeta = h;
    const f = await carpeta.getFileHandle('Candidatura 03.pdf');
    f._modificado = Date.UTC(2026, 2, 5, 10, 0, 0);
    return (await f.getFile()).lastModified;
  });
  await comprobar('C. (preparación) el documento tiene una fecha vieja', fechaAntes, Date.UTC(2026, 2, 5, 10, 0, 0));

  await irAMantenimiento(p);
  await p.click('#traslado-pasar');
  await p.click('#traslado-senalar');
  await p.waitForSelector('#traslado-empezar');
  await p.click('#traslado-empezar');
  await p.waitForSelector('#traslado-resultado, #traslado-faltan', { timeout: 60000 });
  const resultado = await p.locator('#traslado-resultado').innerText();
  await comprobar('C. «Copiados N documentos. No falta ninguno.»', /^Copiados \d+ documentos\. No falta ninguno\.$/.test(resultado), true);

  const dr = await arbol(p, 'ASUNTOS ABIERTOS');
  const todoEsta = Object.keys(dropboxAntes).filter((k) => k.indexOf('presencia') !== 0 && k.indexOf('_GESTOR/presencia') !== 0).every((k) => {
    if (k.charAt(k.length - 1) !== '/' && k.indexOf('/') === -1) return true;   /* los sueltos de la raíz se quedan en Dropbox */
    if (k.indexOf('_GESTOR/traslado-') === 0 || k.indexOf('_GESTOR/PASADO') === 0) return true;
    return dr[k] === dropboxAntes[k];
  });
  if (!todoEsta) console.log('   distintos:', JSON.stringify(Object.keys(dropboxAntes).filter((k) => k.charAt(k.length - 1) !== '/' && k.indexOf('/') !== -1 && k.indexOf('presencia') === -1 && dr[k] !== dropboxAntes[k])));
  await comprobar('C. en Drive está todo lo de las carpetas de asunto y de _GESTOR, con los mismos tamaños', todoEsta, true);
  await comprobar('C. los sueltos de la raíz no se han copiado a Drive', Object.keys(dr).filter((k) => k.indexOf('/') === -1 && k.charAt(k.length - 1) !== '/' ).sort(), []);
  const arch = await arbol(p, 'ARCHIVO');
  await comprobar('C. el ARCHIVO está en Drive', arch['PERSONAL/Archivado 1.pdf'], archivoAntes['PERSONAL/Archivado 1.pdf']);
  await comprobar('C. el cerrojo no se ha copiado a Drive', dr['_GESTOR/traslado-en-marcha.json'], undefined);
  await comprobar('C. sí están el avance, las fechas y la marca en el _GESTOR de Drive', ['_GESTOR/traslado-avance.json', '_GESTOR/fechas-de-dropbox.json', '_GESTOR/PASADO-A-DRIVE.json'].map((k) => typeof dr[k]), ['number', 'number', 'number']);
  const estado = await p.evaluate(async () => {
    const rutas = await Carpetas.leerJson(App.E.gestor, 'rutas.json');
    return { abiertos: (await Almacen.leer('abiertos')).name, archivo: (await Almacen.leer('archivo')).name, entrada: (await Almacen.leer('entrada')).name,
      nube: rutas.nube, sesion: App.E.abiertos.name, entradaEstado: Entrada.estado() };
  });
  await comprobar('C. abiertos y archivo recordados pasan a Drive; la entrada se queda en Dropbox; rutas.json dice drive',
    [estado.abiertos, estado.archivo, estado.entrada, estado.nube, estado.entradaEstado], ['ASUNTOS ABIERTOS', 'ARCHIVO', 'ASUNTOS ABIERTOS', 'drive', 'propia']);
  const marcaDropbox = await p.evaluate(async () => { const m = await Carpetas.leerJson(Demo.disco().abiertos, 'PASADO-A-DRIVE.json'); const g = await Carpetas.leerJson(App.E.gestor, 'PASADO-A-DRIVE.json'); return [!!m && m.id === g.id, m.noUsar]; });
  await comprobar('C. la marca de Dropbox y la de Drive llevan el mismo identificador', marcaDropbox[0], true);
  const noUsar = marcaDropbox[1];
  await comprobar('C. existe «NO USAR – pasado a Drive el <fecha>» en Dropbox', /^NO USAR – pasado a Drive el \d\d-\d\d-\d{4}$/.test(noUsar) && (await arbol(p, 'dropbox'))[noUsar + '/'] === -1, true);

  /* la sesión sigue en Drive: el asunto de las Elecciones se abre con sus documentos y su fecha vieja */
  const abierto = await p.evaluate(async (nombre) => {
    await App.verAbiertos();
    const a = App.E.listaAbiertos.find((x) => x.nombre === nombre);
    if (!a) return { error: 'no está en la lista' };
    const docs = [];
    for await (const [n, h] of a.handle.entries()) if (h.kind === 'file') docs.push(n);
    const previas = await a.handle.getDirectoryHandle('Versiones previas');
    const pv = []; for await (const [n] of previas.entries()) pv.push(n);
    const f = await (await a.handle.getFileHandle('Candidatura 03.pdf')).getFile();
    return { docs: docs.length, previas: pv.length, modificado: f.lastModified };
  }, antes.elecciones);
  await comprobar('C. las Elecciones se abren con sus 10 documentos y 2 versiones previas', [abierto.docs, abierto.previas], [10, 2]);
  await comprobar('C. y conservan la fecha original de modificación', abierto.modificado, Date.UTC(2026, 2, 5, 10, 0, 0));
  await comprobar('C. los documentos sueltos siguen saliendo en «Por clasificar»', p.evaluate(() => App.E.sueltos.map((s) => s.nombre).includes('Oficio suelto.pdf')), true);
  await comprobar('C. la marca no sale como documento suelto', p.evaluate(() => App.E.sueltos.map((s) => s.nombre).includes('PASADO-A-DRIVE.json')), false);

  /* arrastrar */
  const lista = await p.locator('#traslado-arrastrar li').allInnerTexts();
  await comprobar('C. enseña qué arrastrar: carpetas de asunto, _GESTOR, ARCHIVO y la copia', [lista.includes('_GESTOR'), lista.some((t) => t.indexOf('el ARCHIVO viejo') !== -1), lista.some((t) => t.indexOf(antes.elecciones) !== -1)], [true, true, true]);
  await p.click('#traslado-arrastradas');
  await p.waitForFunction(() => document.getElementById('traslado-quedan').textContent.length > 0);
  const quedan = await p.locator('#traslado-quedan').innerText();
  await comprobar('C. sin arrastrar nada, avisa de lo que queda fuera', quedan.indexOf('_GESTOR') !== -1 && quedan.indexOf(antes.elecciones) !== -1, true);
  await p.click('#traslado-demo-arrastrar');
  await p.waitForTimeout(300);
  await p.click('#traslado-arrastradas');
  await p.waitForSelector('#traslado-final');
  const final = await p.locator('#traslado-final').innerText();
  await comprobar('C. con todo arrastrado, termina con el aviso de esperar a Drive y borrar al mes', [final.indexOf('espera a que Google Drive termine') !== -1, final.indexOf('borradlas dentro de un mes') !== -1], [true, true]);
  await comprobar('C. nada se ha borrado: lo viejo está en «NO USAR»', p.evaluate(async (n) => { const d = await Demo.disco().abiertos.getDirectoryHandle(n); const hijos = []; for await (const [x] of d.entries()) hijos.push(x); return hijos.includes('_GESTOR'); }, noUsar), true);
  await p.close();
}

/* ---------- D. cortado a la mitad ---------- */
{
  const p = await abrir('&traslado=corta');
  await irAMantenimiento(p);
  await p.click('#traslado-pasar');
  await p.click('#traslado-senalar');
  await p.waitForSelector('#traslado-empezar');
  await p.click('#traslado-empezar');
  await p.waitForSelector('.traslado-error', { timeout: 60000 });
  await comprobar('D. al cortarse dice que hay un traslado a medias', (await p.locator('.traslado-error').innerText()).indexOf('Hay un traslado a medias') !== -1, true);
  const mitad = await p.evaluate(async () => {
    const t = PasarADrive.traslado();
    const a = await Carpetas.leerJson(t.dGestor, 'traslado-avance.json');
    return { hay: !!a, rutas: await Carpetas.leerJson(App.E.gestor, 'rutas.json').then((r) => (r && r.nube) || '') };
  });
  await comprobar('D. lo copiado queda apuntado y las carpetas siguen en Dropbox', [mitad.hay, mitad.rutas], [true, '']);
  await p.click('#traslado-seguir');
  await p.waitForSelector('#traslado-resultado, #traslado-faltan', { timeout: 60000 });
  await comprobar('D. «Seguir» termina con «No falta ninguno»', /No falta ninguno\.$/.test(await p.locator('#traslado-resultado').innerText()), true);
  await p.close();
}

/* ---------- E. el cerrojo de otro ordenador ---------- */
{
  const p = await abrir();
  const r = await p.evaluate(async () => {
    await Carpetas.guardarJson(App.E.gestor, 'traslado-en-marcha.json', { id: 'OTRO', quien: 'Diego', desde: new Date().toISOString(), ultima: new Date().toISOString(), fase: 'copia' });
    const hay = await PasarADrive.alEntrar(Demo.disco().abiertos);
    const protegida = SoloConsulta.proteger(Demo.disco().abiertos);
    let escribe = 'escribió';
    try { await Carpetas.escribirTexto(protegida, 'prueba.txt', 'x'); } catch (e) { escribe = e.name; }
    SoloConsulta.alEntrar();
    return { hay, escribe, franja: (document.getElementById('franja-solo-consulta') || {}).textContent || '' };
  });
  await comprobar('E. un cerrojo de otro ordenador se detecta', r.hay, true);
  await comprobar('E. con el cerrojo no se puede escribir', r.escribe, 'SoloConsulta');
  await comprobar('E. la franja dice que se están pasando las carpetas', r.franja, 'Se están pasando las carpetas a Google Drive. Espera a que termine.');
  await p.close();
}

await navegador.close();
if (errores.length) { console.log('ERRORES EN LA PÁGINA:\n' + errores.join('\n')); fallos++; }
console.log(fallos ? '\nFALLAN ' + fallos : '\ntodo bien');
process.exit(fallos ? 1 : 0);
