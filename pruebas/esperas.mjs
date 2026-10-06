/* Fila 286 (6-oct-2026, docs/ESPERAS-QUE-SE-CIERRAN.md): las esperas se cierran al llegar el documento. Con Chromium real y
   los datos de la copia de pruebas (?demo=1&auto=1): «Otero Campos, Marta» (BAJA MEDICA) está esperando su parte de alta,
   con un papel suelto suyo en «Ver todo»; «Reyes Palma, Fernando» está en la misma espera con la fecha límite ya pasada.

   1. La casilla sale marcada en el cuadro de nombre de un documento que entra en un asunto en espera, con el título del hito;
      no sale en uno que le toca a Administración, ni al cambiar el nombre de uno que ya estaba, ni en el segundo de una tanda.
   2. Guardar con ella: documento apuntado al hito, hito hecho, aviso «Espera terminada…» con «Deshacer», sin abrir la mesa;
      «Deshacer» deja el hito sin hacer y el documento guardado.
   3. Con la casilla quitada, el asunto sigue en espera. Con algo obligatorio pendiente, no se cierra y avisa en ámbar.
   4. «No ha llegado nada»: solo con el plazo vencido; anota, marca «sin respuesta», abre el siguiente; «Deshacer» la quita.
   5. Solo consulta: el botón está apagado. */
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
async function paginaNueva(consulta) {
  const p = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); " +
    (consulta ? "if (!sessionStorage.getItem('yaPuesta')) { localStorage.setItem('gestor.soloConsulta', '1'); sessionStorage.setItem('yaPuesta', '1'); }" : '') + " } catch (e) {}");
  await p.goto(DIRECCION);
  await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
  await p.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
  if (consulta) await p.waitForSelector('#franja-solo-consulta', { timeout: 20000 });
  await p.waitForTimeout(consulta ? 5000 : 3000);
  return p;
}

let pagina = await paginaNueva(false);
const avisos = () => pagina.$$eval('#mensajes .mensaje', (e) => e.map((x) => x.textContent));
const hito2 = (frag) => pagina.evaluate(async (frag) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[1];
  return { estado: h.estado, documentos: h.documentos, sinRespuesta: !!h.sinRespuesta, notas: h.notas.map((n) => n.texto) };
}, frag);
const lado = (frag) => pagina.evaluate((frag) => App.ladoDe(Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0]).lado, frag);
/* Abre el cuadro de documentos de un asunto con un fichero soltado (entra un documento). */
async function entra(frag, nombre) {
  await pagina.evaluate(([frag, nombre]) => {
    const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
    window.__abierto = Documentos.abrir(a, { ficheroSoltado: new File(['contenido de prueba'], nombre, { type: 'application/pdf' }) });
  }, [frag, nombre]);
  await pagina.waitForSelector('#doc-guardar', { timeout: 15000 });
  await pagina.waitForTimeout(500);
}
const casilla = () => pagina.locator('#doc-termina-espera').count();
async function cerrarCuadro() {
  await pagina.evaluate(() => { const c = document.getElementById('cuadro-aceptar'); if (c) c.click(); });
  await pagina.waitForTimeout(500);
}

/* ===== 1. La casilla ===== */
console.log('--- 1. la casilla ---');
await comprobar('1. Marta espera (le toca a otro)', lado('Otero Campos, Marta'), 'terceros');
await entra('Otero Campos, Marta', 'parte de alta A.pdf');
await comprobar('1. la casilla sale marcada, con el título del hito',
  pagina.evaluate(() => { const c = document.getElementById('doc-termina-espera'); return c ? [c.checked, c.parentNode.textContent] : null; }),
  [true, 'Es lo que se esperaba. Termina la espera de «Esperar el parte de alta».']);
await cerrarCuadro();
await entra('Aguilar Ponce, Marina', 'justificante A.pdf');
await comprobar('1. en un asunto que le toca a Administración, no sale', casilla(), 0);
await cerrarCuadro();
await pagina.evaluate(async () => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Otero Campos, Marta') !== -1 && /BAJA/.test(x.nombre))[0];
  window.__a = a;
  window.__abierto = Documentos.abrir(a, {});
});
await pagina.waitForTimeout(800);
await pagina.evaluate(() => { const N = Documentos._interno; N.pintarFormulario({ modo: 'renombrar', nombreActual: 'cualquiera.pdf' }); });
await pagina.waitForTimeout(500);
await comprobar('1. al cambiar el nombre de uno que ya estaba, no sale', casilla(), 0);
await cerrarCuadro();

/* ===== 2. Guardar con ella ===== */
console.log('--- 2. guardar con la casilla ---');
await entra('Otero Campos, Marta', 'parte de alta A.pdf');
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(3500);
await comprobar('2. aviso verde «Espera terminada…» con «Deshacer»', avisos().then((m) => m.filter((t) => /^Espera terminada: «Esperar el parte de alta»\. Ahora toca: «Archivar el parte de alta»\./.test(t)).length), 1);
await comprobar('2. el hito está hecho y el documento apuntado', hito2('Otero Campos, Marta').then((h) => [h.estado, h.documentos.length]), ['hecho', 1]);
await comprobar('2. ya no está esperando (le toca a Administración)', lado('Otero Campos, Marta'), 'administracion');
await comprobar('2. no se ha abierto ninguna mesa', pagina.locator('#ficha-guia.con-mesa').count(), 0);
await cerrarCuadro();
await pagina.locator('#mensajes .mensaje-boton', { hasText: 'Deshacer' }).first().click();
await pagina.waitForTimeout(2500);
await comprobar('2. «Deshacer»: el hito vuelve a estar sin hacer y el documento sigue', hito2('Otero Campos, Marta').then((h) => [h.estado === 'hecho', h.documentos.length]), [false, 1]);
await comprobar('2. el asunto vuelve a esperar', lado('Otero Campos, Marta'), 'terceros');

/* ===== 3. Sin casilla, y con algo obligatorio ===== */
console.log('--- 3. casilla quitada y obligatorio pendiente ---');
await entra('Otero Campos, Marta', 'parte de alta B.pdf');
await pagina.uncheck('#doc-termina-espera');
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(2500);
await comprobar('3. con la casilla quitada, el asunto sigue en espera', lado('Otero Campos, Marta'), 'terceros');
await comprobar('3. y el documento está guardado', hito2('Otero Campos, Marta').then((h) => h.documentos.length), 1);
await cerrarCuadro();
await entra('Otero Campos, Marta', 'parte de alta C.pdf');
await pagina.evaluate(() => { window.__fo = Hitos.faltanObligatorios; Hitos.faltanObligatorios = () => [{ texto: 'el parte original' }]; });
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(2500);
await comprobar('3. con algo obligatorio pendiente: aviso ámbar y el hito sin hacer',
  Promise.all([pagina.$$eval('#mensajes .mensaje.ambar', (e) => e.map((x) => x.textContent)), hito2('Otero Campos, Marta').then((h) => h.estado)]),
  [['Guardado. La espera no se ha terminado: falta «el parte original».'], 'pendiente']);
await pagina.evaluate(() => { Hitos.faltanObligatorios = window.__fo; });
await cerrarCuadro();

/* ===== 2b. Con varios documentos seguidos, solo el primero ===== */
console.log('--- 2b. una tanda ---');
await pagina.evaluate(async () => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Otero Campos, Marta') !== -1 && /BAJA/.test(x.nombre))[0];
  window.__a = a;
});
await entra('Otero Campos, Marta', 'parte de alta D.pdf');
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(3500);
await pagina.evaluate(() => { const N = Documentos._interno; N.pintarFormulario({ modo: 'anadir', nombreActual: 'parte de alta E.pdf', handle: { kind: 'file', name: 'parte de alta E.pdf', getFile: () => Promise.resolve(new File(['x'], 'parte de alta E.pdf')) } }); });
await pagina.waitForTimeout(500);
await comprobar('2b. el segundo documento de la tanda ya no lleva la casilla', casilla(), 0);
await cerrarCuadro();

/* ===== 4. «No ha llegado nada» ===== */
console.log('--- 4. «No ha llegado nada» ---');
async function abrirMesa(frag, indice) {
  await pagina.click('button.pestana[data-pantalla="abiertos"]');
  await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]');
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto*="' + frag + '"] .tarjeta-nombre').first().click();
  await pagina.waitForTimeout(1200);
  await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
  await pagina.evaluate(async ([frag, i]) => {
    const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
    const hs = await Hitos.hitosDe(a.nombre);
    HitoMesa.abrir(a, hs[i].id);
  }, [frag, indice]);
  await pagina.waitForSelector('#ficha-guia.con-mesa', { timeout: 10000 });
  await pagina.waitForTimeout(600);
}
await abrirMesa('Otero Campos, Marta', 1);
await comprobar('4. con el plazo sin vencer, no hay botón', pagina.locator('.hito-en-mesa .mesa-sin-respuesta').count(), 0);
await abrirMesa('Reyes Palma, Fernando', 1);
await comprobar('4. con el plazo vencido, el botón «No ha llegado nada»', pagina.locator('.hito-en-mesa .mesa-sin-respuesta').allTextContents(), ['No ha llegado nada']);
await pagina.click('.hito-en-mesa .mesa-sin-respuesta');
await pagina.waitForTimeout(3000);
await comprobar('4. aviso verde «Anotado: sin respuesta.» con «Deshacer»', avisos().then((m) => m.filter((t) => /^Anotado: sin respuesta\./.test(t)).length), 1);
await comprobar('4. el hito está hecho, con la marca y la línea en su registro',
  hito2('Reyes Palma, Fernando').then((h) => [h.estado, h.sinRespuesta, h.notas.some((n) => /^Venció el .+ sin respuesta\.$/.test(n))]), ['hecho', true, true]);
await comprobar('4. se abre la mesa del siguiente', pagina.locator('.mesa-titulo').allTextContents(), ['Archivar el parte de alta']);
await abrirMesa('Reyes Palma, Fernando', 1);
await comprobar('4. el hito se lee «Hecho · sin respuesta»', pagina.locator('.hito-en-mesa .mesa-etq-hecho').allTextContents(), ['Hecho · sin respuesta']);
await pagina.click('.hito-en-mesa .mesa-marcar-hecho');   // desmarcar
await pagina.waitForTimeout(2500);
await comprobar('4. desmarcar el hito borra la marca', hito2('Reyes Palma, Fernando').then((h) => [h.estado === 'hecho', h.sinRespuesta]), [false, false]);
await pagina.close();

/* ===== 5. Solo consulta ===== */
console.log('--- 5. solo consultar ---');
pagina = await paginaNueva(true);
await abrirMesa('Reyes Palma, Fernando', 1);
await comprobar('5. el botón está apagado', pagina.locator('.hito-en-mesa .mesa-sin-respuesta').isDisabled(), true);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
