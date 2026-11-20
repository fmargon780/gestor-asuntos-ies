/* Fila 686 (docs/686-ANADIR-DOCUMENTO-MAS-SENCILLO.md): «Añadir documento» abre la ventana de Windows sin carpeta de inicio y sin
   aviso naranja; un fichero soltado en el cuadro de Documentos, encima de cualquier tarea o en la zona de trabajo del hito entra
   sin hito ni tarea y sin marcar nada; con un documento a medias avisa; un directivo no guarda. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const p = await (await navegador.newContext({ viewport: { width: 1500, height: 1100 } })).newPage();
const errores = [];
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await p.goto(DIRECCION);
await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await p.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await p.waitForFunction(() => window.Demo && !Demo.montando && window.SoltarDocumento, null, { timeout: 60000 });
await p.waitForTimeout(2500);
await p.click('button.pestana[data-pantalla="abiertos"]');
await p.locator('#inicio-tabla-cuerpo tr[data-asunto*="SANCION Fuentes Calvo"] .tarjeta-nombre').first().click();
await p.waitForSelector('.hito-en-mesa .guion-paso', { timeout: 15000 });
await p.waitForTimeout(1000);

/* Suelta un fichero encima del elemento que dice el selector (el n-ésimo). */
const soltar = (sel, n, nombre) => p.evaluate(([sel, n, nombre]) => {
  const el = document.querySelectorAll(sel)[n || 0];
  const dt = new DataTransfer();
  dt.items.add(new File(['contenido de prueba'], nombre || 'prueba 686.pdf', { type: 'application/pdf', lastModified: 1700000000000 }));
  el.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, [sel, n, nombre]);
const avisos = () => p.$$eval('#mensajes .mensaje', (e) => e.map((x) => x.textContent));
const cerrar = async () => { await p.evaluate(() => { const c = document.getElementById('cuadro-aceptar'); if (c) c.click(); }); await p.waitForTimeout(500); };
const marcadas = () => p.$$eval('.hito-en-mesa .guion-casilla:checked', (l) => l.length);
const contexto = () => p.evaluate(() => { const n = Documentos._interno; return [n.hitoActual, n.tareaActual, n.preguntarTarea]; });
const pasos = await p.$$eval('.hito-en-mesa .guion-paso:not(.guion-pregunta)', (l) => l.length);
const antes = await marcadas();

/* (a) «Añadir documento» llama a la ventana sin carpeta de inicio y sin aviso */
await p.evaluate(() => {
  window.__llamadas = [];
  window.showOpenFilePicker = async (o) => { window.__llamadas.push(!!(o && o.startIn)); return [{ kind: 'file', name: 'ventana.pdf', getFile: async () => new File(['x'], 'ventana.pdf', { type: 'application/pdf' }) }]; };
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('SANCION Fuentes Calvo') !== -1)[0];
  Documentos.abrir(a);
});
await p.waitForSelector('#doc-anadir');
await p.click('#doc-anadir');
await p.waitForSelector('#doc-guardar', { timeout: 15000 });
comprobar('a. «Añadir documento» pide la ventana una vez, sin carpeta de inicio', await p.evaluate(() => window.__llamadas), [false]);
comprobar('a. y no sale ningún aviso naranja', (await avisos()).filter((t) => /carpeta del asunto/.test(t)), []);
await cerrar();

/* (c) soltar en el cuadro de Documentos vacío abre el cuadro del nombre, sin «¿De qué tarea es?» */
await p.evaluate(() => { Documentos.abrir(Gestor.asuntos().filter((x) => x.nombre.indexOf('SANCION Fuentes Calvo') !== -1)[0]); });
await p.waitForSelector('#doc-anadir');
await soltar('#doc-cuerpo');
await p.waitForSelector('#doc-guardar', { timeout: 15000 });
comprobar('c. soltar en Documentos abre el cuadro del nombre, sin hito ni tarea', await contexto(), [null, null, false]);
await p.waitForTimeout(600);
comprobar('c. y no sale el aviso «Termina antes con este documento.» (una suelta, una llamada)', (await avisos()).filter((t) => /Termina antes con este documento/.test(t)), []);
/* (c2) la misma suelta llegada otra vez, aunque sea tarde y con otro objeto File, no avisa ni cambia nada */
await p.evaluate(() => {
  const el = document.getElementById('doc-cuerpo');
  const hacer = () => { const dt = new DataTransfer(); dt.items.add(new File(['contenido de prueba'], 'prueba 686.pdf', { type: 'application/pdf', lastModified: 1700000000000 })); el.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true })); };
  hacer(); window.__otraVez = () => hacer();
});
await p.waitForTimeout(800);
await p.evaluate(() => window.__otraVez());
await p.waitForTimeout(600);
comprobar('c2. la misma suelta repetida no avisa', (await avisos()).filter((t) => /Termina antes con este documento/.test(t)), []);
comprobar('c2. y el cuadro sigue siendo el mismo', await p.locator('#capa:not(.oculto) #doc-guardar').count(), 1);
/* (d) con el cuadro a medias, soltar OTRO fichero avisa y no cambia nada */
await soltar('#doc-cuerpo', 0, 'otro 686.pdf');
await p.waitForTimeout(500);
comprobar('d. con un documento a medias, soltar otro avisa', (await avisos()).filter((t) => /Termina antes con este documento/.test(t)).length > 0, true);
comprobar('d. y el cuadro sigue siendo el mismo', await p.locator('#capa:not(.oculto) #doc-guardar').count(), 1);
await cerrar();

/* (b) soltar sobre una tarea que no es la siguiente: cuadro del nombre y «sin tarea» */
const n = pasos > 1 ? pasos - 1 : 0;
await soltar('.hito-en-mesa .guion-paso:not(.guion-pregunta)', n);
await p.waitForSelector('#doc-guardar', { timeout: 15000 });
comprobar('b. soltar sobre otra tarea abre el cuadro del nombre, sin hito ni tarea', await contexto(), [null, null, false]);
await cerrar();
comprobar('b. y no se marca ninguna tarea', await marcadas(), antes);

/* (f) soltar sobre la zona de trabajo del hito no marca «Añadir documento» */
await soltar('#trabajo-columnas');
await p.waitForSelector('#doc-guardar', { timeout: 15000 });
comprobar('f. soltar en la zona del hito: sin hito ni tarea', await contexto(), [null, null, false]);
await cerrar();
comprobar('f. y no se marca ninguna tarea', await marcadas(), antes);

/* (g) devuelta por Francisco: el cuadro se abrió desde una tarea (con su hito y su tarea); soltar un fichero ahí no marca nada */
await p.evaluate(async () => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('SANCION Fuentes Calvo') !== -1)[0];
  const hs = await Hitos.hitosDe(a.nombre);
  const h = hs.filter((x) => x.estado !== 'hecho')[0] || hs[0];
  Documentos.abrir(a, { hito: h, tarea: Hitos.guionDe(a, h)[0].id });
});
await p.waitForSelector('#doc-anadir');
await soltar('#doc-cuerpo');
await p.waitForSelector('#doc-guardar', { timeout: 15000 });
comprobar('g. soltar en un cuadro abierto desde una tarea: sin hito ni tarea', await contexto(), [null, null, false]);
await p.click('#doc-guardar');
await p.waitForTimeout(2500);
comprobar('g. al guardar no se marca ninguna tarea', await marcadas(), antes);
await cerrar();

/* (h) devuelta por el revisor: en un asunto sin hito abierto (SEGURO ESCOLAR A26-0006) soltar también entra en la zona del asunto */
await p.evaluate(() => { const a = Gestor.asuntos().filter((x) => /SEGURO ESCOLAR/.test(x.nombre))[0]; window.__sh = a.nombre; });
await p.click('button.pestana[data-pantalla="abiertos"]');
await p.locator('#inicio-tabla-cuerpo tr[data-asunto*="A26-0006"] .nombre-pulsable').first().click();
await p.waitForSelector('#trabajo-columnas', { timeout: 15000 });
await p.waitForTimeout(1500);
await soltar('#trabajo-columnas');
await p.waitForSelector('#doc-guardar', { timeout: 15000 });
comprobar('h. sin hito abierto: soltar en la zona abre el cuadro del nombre', await contexto(), [null, null, false]);
await cerrar();

/* (h2) asunto sin hitos y sin guía (PEDIDO Imprenta Sol, su tipo no está en la lista): soltar en la zona de trabajo y sobre una tarea también entra */
for (const donde of ['#trabajo-columnas']) {
  await p.click('button.pestana[data-pantalla="abiertos"]');
  const numPedido = await p.evaluate(() => { const a = Gestor.asuntos().filter((x) => /PEDIDO Imprenta Sol/.test(x.nombre))[0]; return (a.nombre.match(/A\d\d-\d{4}/) || [a.nombre])[0]; });
  await p.locator('#inicio-tabla-cuerpo tr[data-asunto*="' + numPedido + '"] .nombre-pulsable').first().click();
  await p.waitForSelector('#trabajo-columnas', { timeout: 15000 });
  await p.waitForTimeout(1500);
  await soltar(donde);
  await p.waitForSelector('#doc-guardar', { timeout: 15000 });
  comprobar('h2. asunto sin hitos: soltar sobre ' + donde + ' abre el cuadro del nombre', await contexto(), [null, null, false]);
  await cerrar();
}

/* (i) devuelta por el revisor: se suelta en todo el cuadro de Documentos (título y fondo), no solo en su cuerpo */
for (const sel of ['#capa .cuadro', '#capa .cuadro > :first-child']) {
  await p.evaluate(() => { Documentos.abrir(Gestor.asuntos().filter((x) => x.nombre.indexOf('SANCION Fuentes Calvo') !== -1)[0]); });
  await p.waitForSelector('#doc-anadir');
  await soltar(sel);
  await p.waitForSelector('#doc-guardar', { timeout: 15000 });
  comprobar('i. soltar sobre ' + sel + ' abre el cuadro del nombre', await contexto(), [null, null, false]);
  await cerrar();
}

/* (j) cuarto arreglo (20-nov-2026): sin ningún cuadro abierto antes, una suelta sobre la zona de trabajo no deja ningún aviso,
   ni siquiera si el mismo suceso llega dos veces con objetos File distintos (otra «última modificación») */
await p.click('button.pestana[data-pantalla="abiertos"]');
await p.locator('#inicio-tabla-cuerpo tr[data-asunto*="SANCION Fuentes Calvo"] .tarjeta-nombre').first().click();
await p.waitForSelector('#trabajo-columnas', { timeout: 15000 });
await p.waitForTimeout(1500);
await p.evaluate(() => { document.getElementById('mensajes').innerHTML = ''; });
comprobar('j. antes de soltar no hay ningún cuadro abierto', await p.locator('#capa:not(.oculto) #doc-cuerpo').count(), 0);
const sueltaJ = (i) => p.evaluate((i) => {
  const dt = new DataTransfer();
  dt.items.add(new File(['contenido de prueba'], 'prueba 686 j.pdf', { type: 'application/pdf', lastModified: 1700000000000 + i }));
  document.getElementById('trabajo-columnas').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
}, i);
await sueltaJ(0);
await p.waitForSelector('#doc-guardar', { timeout: 15000 });
await sueltaJ(1);   /* el mismo suceso llegado otra vez, con otro objeto File */
await p.waitForSelector('#doc-guardar', { timeout: 15000 });
await p.waitForTimeout(800);
comprobar('j. soltar sobre la zona sin cuadro previo no deja ningún aviso', await avisos(), []);
comprobar('j. y hay un solo cuadro del nombre', await p.locator('#capa:not(.oculto) #doc-guardar').count(), 1);
await cerrar();

/* (e) un directivo no guarda */
await p.evaluate(() => { window.__esDirectivo = Perfil.esDirectivo; Perfil.esDirectivo = () => true; });
await soltar('#trabajo-columnas');
await p.waitForTimeout(800);
comprobar('e. un directivo suelta y no pasa nada', await p.locator('#capa:not(.oculto) #doc-guardar').count(), 0);
await p.evaluate(() => { Perfil.esDirectivo = window.__esDirectivo; });

if (errores.length) { fallos++; console.log('ERRORES:\n' + errores.join('\n')); }
await navegador.close();
if (fallos) { console.log(fallos + ' fallos'); process.exit(1); }
console.log('todo bien');
