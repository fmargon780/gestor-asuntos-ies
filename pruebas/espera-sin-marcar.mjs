/* Fila 414 (22-oct-2026, docs/ESPERA-SIN-MARCAR-Y-VARIOS-DOCUMENTOS.md). Con Chromium real y los datos de la copia de
   pruebas (?demo=1&auto=1):
   1. En un asunto en espera («Otero Campos, Marta», BAJA MEDICA), la casilla «Es lo que se esperaba…» sale SIN marcar;
      guardar sin tocarla no cierra el hito; marcarla y guardar sí lo cierra.
   2. En «Elecc. Consejo Escolar» (hito «Recepción de candidaturas» con «Recibe varios documentos»), la casilla no sale,
      el documento queda unido al hito y el hito sigue abierto, también con un segundo documento.
   3. El editor de la guía enseña la opción y la guarda; llega a los hitos ya existentes (retocarMarcas) y no entra en la
      biblioteca de hitos. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await pagina.waitForTimeout(3000);

const hito = (frag, i) => pagina.evaluate(async ([frag, i]) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[i];
  return { estado: h.estado, documentos: h.documentos, varios: !!h.variosDocumentos };
}, [frag, i]);
async function entra(frag, nombre) {
  await pagina.evaluate(([frag, nombre]) => {
    const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
    window.__abierto = Documentos.abrir(a, { ficheroSoltado: new File(['contenido de prueba'], nombre, { type: 'application/pdf' }) });
  }, [frag, nombre]);
  await pagina.waitForSelector('#doc-guardar', { timeout: 15000 });
  await pagina.waitForTimeout(500);
}
async function cerrarCuadro() {
  await pagina.evaluate(() => { const c = document.getElementById('cuadro-aceptar'); if (c) c.click(); });
  await pagina.waitForTimeout(500);
}
const casilla = () => pagina.locator('#doc-termina-espera').count();

console.log('--- 1. la casilla sale sin marcar ---');
await entra('Otero Campos, Marta', 'parte de alta A.pdf');
await comprobar('1. la casilla sale sin marcar', pagina.evaluate(() => document.getElementById('doc-termina-espera').checked), false);
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(2500);
await comprobar('1. guardar sin tocarla: el hito sigue sin hacer', hito('Otero Campos, Marta', 1).then((h) => h.estado !== 'hecho'), true);
await cerrarCuadro();
await entra('Otero Campos, Marta', 'parte de alta B.pdf');
await pagina.check('#doc-termina-espera');
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(3000);
await comprobar('1. marcarla y guardar: el hito se cierra', hito('Otero Campos, Marta', 1).then((h) => h.estado), 'hecho');
await cerrarCuadro();

console.log('--- 2. hito que recibe varios documentos ---');
await comprobar('2. el hito de candidaturas lleva la opción',
  hito('Vidal Cano, Ramón', 1).then((h) => [h.varios, h.estado !== 'hecho']), [true, true]);
for (const nombre of ['candidatura A.pdf', 'candidatura B.pdf']) {
  await entra('Vidal Cano, Ramón', nombre);
  await comprobar('2. ' + nombre + ': no sale la casilla', casilla(), 0);
  if (await pagina.locator('#cand-no').count()) await pagina.check('#cand-no');
  await pagina.click('#doc-guardar');
  await pagina.waitForTimeout(2500);
  await cerrarCuadro();
}
await comprobar('2. los dos documentos quedan unidos al hito y sigue abierto',
  hito('Vidal Cano, Ramón', 1).then((h) => [h.documentos.length, h.estado !== 'hecho']), [2, true]);

console.log('--- 3. la guía ---');
await comprobar('3. la guía del tipo lleva la opción en el hito de candidaturas',
  pagina.evaluate(() => GuiasDelCentro.pasosDe('Elecc. Consejo Escolar').map((p) => !!p.variosDocumentos)), [false, true, false]);
await comprobar('3. llega a un hito ya existente y se quita (retocarMarcas)',
  pagina.evaluate(() => {
    const pasos = JSON.parse(JSON.stringify(GuiasDelCentro.pasosDe('Elecc. Consejo Escolar')));
    const hs = pasos.map((p) => Hitos.pasoAHito(p));
    pasos[0].variosDocumentos = true; pasos[1].variosDocumentos = false;
    const r = Hitos.pasosQueFaltan(hs, pasos, []);
    return [hs.map((h) => !!h.variosDocumentos), r.hitos.map((h) => !!h.variosDocumentos)];
  }), [[false, true, false], [true, false, false]]);
await comprobar('3. «Solo en este asunto» se queda y la guía no lo pisa',
  pagina.evaluate(() => {
    const pasos = JSON.parse(JSON.stringify(GuiasDelCentro.pasosDe('Elecc. Consejo Escolar')));
    const hs = pasos.map((p) => Hitos.pasoAHito(p));
    hs[1].variosDocumentos = false; hs[1].variosPropio = true;
    const r = Hitos.pasosQueFaltan(hs.map((h) => Hitos.normalizarHito(h)), pasos, []);
    return [!!r.hitos[1].variosDocumentos, !!r.hitos[1].variosPropio];
  }), [false, true]);
await comprobar('3. la biblioteca de hitos no se lleva la opción',
  pagina.evaluate(() => {
    const p = JSON.parse(JSON.stringify(GuiasDelCentro.pasosDe('Elecc. Consejo Escolar')[1]));
    const m = HitosBiblioteca._normalizarModelo(HitosBiblioteca._pasoAModelo(p, 'x', 1, ''));
    return [m.variosDocumentos === undefined, HitosBiblioteca.modeloAPaso(m, '').variosDocumentos === undefined];
  }), [true, true]);

await navegador.close();
if (errores.length) { console.log('Errores de la consola:\n' + errores.join('\n')); fallos++; }
console.log(fallos ? 'HAY ' + fallos + ' FALLOS' : 'TODO BIEN');
process.exit(fallos ? 1 : 0);
