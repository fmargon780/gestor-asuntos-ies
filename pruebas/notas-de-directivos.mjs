/* Fila 290 (7-oct-2026, docs/NOTAS-DE-DIRECTIVOS.md): las notas de los directivos en un asunto. Con Chromium real y los datos de
   la copia de pruebas (?demo=1&auto=1; `&usuario=<nombre>` entra con ese nombre; `Demo.entrarComo(nombre)` cambia de nombre
   sin recargar, para que las notas pasen de unos a otros).

   1. La jefa de estudios: la caja de la tarjeta «Notas» (única cosa encendida de la ficha), sin texto no envía, con texto y un
      documento queda en `ficha.notas` con `deDirectivo` y el documento en su carpeta de espera, por `Perfil.escribir`; sale en
      la lista con su nombre y órgano; no se cambia ni se borra; en un asunto archivado no sale la caja.
   2. Administración: el aviso cuenta las sin ver y filtra la tabla; la fila lleva la marca; la nota sale resaltada y arriba, no
      lleva la caja de directivo; «Vista» con documentos sin guardar avisa; «Guardar en el asunto» pasa por el cuadro de nombre
      y borra la carpeta de espera; «Vista» la quita del aviso sin duplicar la nota; archivar con notas sin ver pregunta.
   3. Dos notas enviadas a la vez desde dos ordenadores quedan las dos. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const JEFA = 'Jefa de estudios de prueba';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
async function entrar(usuario) {
  const p = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
  await p.goto(DIRECCION + (usuario ? '&usuario=' + encodeURIComponent(usuario) : ''));
  await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
  await p.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
  await p.waitForTimeout(usuario ? 9000 : 4000);
  return p;
}
const abrirFicha = async (p, trozo) => {
  await p.evaluate((t) => { const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(t) !== -1)[0]; App.abrirFicha(a, 'abierto'); FichaTarjetas.abrir('notas'); }, trozo);
  await p.waitForSelector('#ficha-notas-lista', { timeout: 8000 });
  await p.waitForTimeout(600);
};
const notasDe = (p, trozo) => p.evaluate(async (t) => { const r = await Carpetas.leerJson(Gestor.carpetaGestor(), 'asuntos.json'); const n = Object.keys(r.asuntos).filter((k) => k.indexOf(t) !== -1 && r.asuntos[k].estado === 'abierto')[0]; return (r.asuntos[n].notas || []).filter((x) => x.deDirectivo); }, trozo);
const sinVer = (p) => p.evaluate(() => { const t = document.querySelector('#avisos-linea [data-aviso="notas-directivos"]'); return t ? t.textContent : null; });
const MARINA = 'Aguilar Ponce, Marina', PABLO = 'Aguilar Ponce, Pablo';

/* ===== 1. La jefa de estudios ===== */
console.log('--- 1. Jefa de estudios ---');
let pagina = await entrar(JEFA);
await abrirFicha(pagina, MARINA);
await comprobar('1. la tarjeta «Notas» lleva la caja, «Adjuntar documento» y «Enviar»',
  pagina.evaluate(() => [document.getElementById('nota-directivo-texto').placeholder, document.getElementById('nota-directivo-adjuntar').textContent, document.getElementById('nota-directivo-enviar').textContent, !!document.getElementById('ficha-nota-texto')]),
  ['Escribe una nota para Administración…', 'Adjuntar documento', 'Enviar', false]);
await comprobar('1. es lo único encendido de la ficha que cambia algo',
  pagina.evaluate(() => [...document.querySelectorAll('#ficha-asunto-cuerpo button, #ficha-asunto-cuerpo textarea, #ficha-asunto-cuerpo select, #ficha-asunto-cuerpo input')].filter((e) => !e.disabled && e.offsetParent && /^(Archivar|Reabrir|Guardar|Hecha|Anotar|Añadir|Cambiar|Borrar|Vista)/.test((e.textContent || '').trim())).length), 0);
await comprobar('1. su nota sin ver sale con su nombre y órgano, sin «Vista» ni nada que la cambie',
  pagina.evaluate(() => { const f = document.querySelector('.nota-directivo-sin-ver'); return f ? [f.querySelector('.nota-quien').textContent, f.querySelectorAll('[data-nd-vista], .registro-mas').length] : null; }), [JEFA + ' (Jefatura de Estudios)', 0]);
await pagina.evaluate(() => { window.__escribir = 0; const o = Perfil.escribir; Perfil.escribir = function (fn) { window.__escribir++; return o.call(Perfil, fn); }; });
const antes = (await notasDe(pagina, MARINA)).length;
await pagina.click('#nota-directivo-enviar');
await pagina.waitForTimeout(500);
await comprobar('1. «Enviar» sin texto: no envía y lo dice', Promise.all([pagina.locator('#nota-directivo-aviso').textContent(), notasDe(pagina, MARINA).then((l) => l.length)]), ['Escribe la nota antes de enviarla.', antes]);
await pagina.fill('#nota-directivo-texto', 'Adjunto el justificante de pago de la tasa.');
await pagina.setInputFiles('#nota-directivo-fichero', { name: 'Justificante de pago.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 prueba') });
await comprobar('1. el documento sale en la lista de la caja', pagina.$$eval('#nota-directivo-ficheros li span', (e) => e.map((x) => x.textContent)), ['Justificante de pago.pdf']);
await pagina.click('#nota-directivo-enviar');
await pagina.waitForTimeout(1500);
await comprobar('1. aviso verde «Nota enviada a Administración.»', pagina.$$eval('#mensajes .mensaje.bueno', (e) => e.map((x) => x.textContent)), ['Nota enviada a Administración.']);
const enviadas = await notasDe(pagina, MARINA);
const mia = enviadas.filter((n) => /justificante de pago/.test(n.texto))[0];
await comprobar('1. en disco: `deDirectivo`, su órgano, el documento y su carpeta', [enviadas.length, mia.deDirectivo, mia.quien, mia.organo, mia.documentos, /^\d{6}-\d{6}-jefa-de-estudios-de-prue$/.test(mia.carpeta), !!mia.vistaPor], [2, true, JEFA, 'Jefatura de Estudios', ['Justificante de pago.pdf'], true, false]);
await comprobar('1. el documento está en su carpeta de espera',
  pagina.evaluate(async (id) => { const c = await (await Gestor.carpetaGestor().getDirectoryHandle('notas-directivos')).getDirectoryHandle(id); return (await Carpetas.ficheros(c)).map((f) => f.nombre); }, mia.carpeta), ['Justificante de pago.pdf']);
await comprobar('1. la escritura pasó por Perfil.escribir', pagina.evaluate(() => window.__escribir > 0), true);
await comprobar('1. ninguna otra escritura del directivo pasa y la caja se vacía',
  pagina.evaluate(async () => { let r; try { await Carpetas.guardarJson(App.E.gestor, 'asuntos.json', { asuntos: {} }); r = 'escrito'; } catch (e) { r = e.name; } return [r, document.getElementById('nota-directivo-texto').value]; }), ['SoloConsulta', '']);
await comprobar('1. la nota sale en la lista, con sus documentos que se abren', pagina.evaluate(() => { const f = [...document.querySelectorAll('.nota-directivo-sin-ver')].find((x) => /justificante de pago/.test(x.textContent)); return [f.querySelector('.nota-quien').textContent, [...f.querySelectorAll('[data-nd-abrir]')].map((b) => b.textContent), f.querySelectorAll('[data-nd-guardar]').length]; }), [JEFA + ' (Jefatura de Estudios)', ['Justificante de pago.pdf'], 0]);
await pagina.click('.nota-directivo-sin-ver:has-text("justificante de pago") [data-nd-abrir]');
await pagina.waitForTimeout(800);
await comprobar('1. el documento se abre en el panel de lectura', pagina.evaluate(() => document.body.classList.contains('con-lector')), true);
await pagina.keyboard.press('Escape');
await comprobar('1. sin forma de cambiar ni de borrar sus notas', pagina.evaluate(() => document.querySelectorAll('#ficha-notas-lista .registro-mas').length), 0);
await comprobar('1. en un asunto archivado no sale la caja',
  pagina.evaluate(async () => { await App.verArchivo(); App.abrirFicha(App.E.listaArchivo.filter((a) => a.ficha && a.ficha.categoria === 'ALUMNADO')[0], 'archivado'); FichaTarjetas.abrir('notas'); await new Promise((r) => setTimeout(r, 800)); return [!!document.getElementById('nota-directivo-texto'), !!document.getElementById('ficha-notas-lista')]; }), [false, true]);

/* ===== 2. Administración (sin recargar: la nota enviada sigue en el disco de mentira) ===== */
console.log('--- 2. Administración ---');
await pagina.evaluate(async () => { await Demo.entrarComo('Revisor'); });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await pagina.waitForTimeout(5000);
await comprobar('2. el cuadro de avisos dice «2 notas de directivos» (la de la demostración y la enviada)', sinVer(pagina), '2 notas de directivos');
await comprobar('2. la fila del asunto lleva la marca de nota sin ver; la del asunto con nota vista, no',
  pagina.evaluate(() => { const f = (t) => [...document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]')].find((r) => r.textContent.indexOf(t) !== -1); return [f('Aguilar Ponce, Marina').querySelectorAll('.marca-nota-directivo').length, f('Aguilar Ponce, Marina').querySelector('.marca-nota-directivo').title, f('Aguilar Ponce, Pablo').querySelectorAll('.marca-nota-directivo').length]; }), [1, 'Nota de un directivo sin ver', 0]);
await pagina.click('#avisos-linea [data-aviso="notas-directivos"]');
await pagina.waitForTimeout(800);
await comprobar('2. pulsarlo filtra la tabla a esos asuntos, con «Filtrado por»',
  pagina.evaluate(() => [document.querySelectorAll('#inicio-tabla-cuerpo tr[data-asunto]').length, document.getElementById('inicio-filtrado-por').classList.contains('oculto'), document.getElementById('inicio-filtrado-por-texto').textContent]), [1, false, '2 notas de directivos']);
await pagina.evaluate(() => { document.getElementById('inicio-filtrado-por').querySelector('button').click(); });
await abrirFicha(pagina, MARINA);
await comprobar('2. la nota sale resaltada y arriba, con «Vista» y «Guardar en el asunto»; no la caja de directivo, sí la de siempre',
  pagina.evaluate(() => { const l = document.getElementById('ficha-notas-lista'); const primeras = [...l.querySelectorAll('.nota-fila')].slice(0, 2); return [primeras.every((f) => f.classList.contains('nota-directivo-sin-ver')), l.querySelectorAll('[data-nd-vista]').length, l.querySelectorAll('[data-nd-guardar]').length, !!document.getElementById('nota-directivo-texto'), !!document.getElementById('ficha-nota-texto')]; }), [true, 2, 2, false, true]);
const ficherosDeMarina = () => pagina.evaluate(async () => { const n = Object.keys(App.E.registro.asuntos).filter((k) => k.indexOf('Aguilar Ponce, Marina') !== -1 && App.E.registro.asuntos[k].estado === 'abierto')[0]; return (await Carpetas.ficheros(await App.E.abiertos.getDirectoryHandle(n))).length; });
const ficherosAntes = await ficherosDeMarina();
/* «Vista» con documentos sin guardar avisa */
await pagina.click('.nota-directivo-sin-ver:has-text("justificante de pago") [data-nd-vista]');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('2. «Vista» con un documento sin guardar avisa, con sus dos botones',
  pagina.evaluate(() => [document.getElementById('cuadro-cuerpo').textContent, document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-cancelar').textContent]),
  ['Tiene 1 documento sin guardar en el asunto.', 'Marcar como vista de todos modos', 'Guardarlos ahora']);
await pagina.click('#cuadro-cancelar');   /* «Guardarlos ahora»: el cuadro de ponerle nombre */
await pagina.waitForSelector('#doc-guardar', { state: 'visible', timeout: 15000 });
await comprobar('2. «Guardarlos ahora» abre el cuadro de ponerle nombre', pagina.evaluate(() => /Justificante de pago/.test(document.getElementById('doc-cuerpo').textContent)), true);
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(2500);
await comprobar('2. el documento está en el asunto (con el nombre que se le ha puesto) y su carpeta de espera se ha borrado',
  Promise.all([ficherosDeMarina().then((n) => n - ficherosAntes), pagina.evaluate(async (id) => { try { await (await Gestor.carpetaGestor().getDirectoryHandle('notas-directivos')).getDirectoryHandle(id); return true; } catch (e) { return false; } }, mia.carpeta)]), [1, false]);
await comprobar('2. ya no sale «Guardar en el asunto» en esa nota', pagina.evaluate(() => [...document.querySelectorAll('.nota-directivo-sin-ver')].find((x) => /justificante de pago/.test(x.textContent)).querySelectorAll('[data-nd-guardar]').length), 0);
/* «Vista» */
const numeroDeNotas = () => pagina.evaluate(() => Gestor.asuntos().filter((a) => a.nombre.indexOf('Aguilar Ponce, Marina') !== -1)[0].ficha.notas.length);
const n0 = await numeroDeNotas();
await pagina.click('.nota-directivo-sin-ver:has-text("justificante de pago") [data-nd-vista]');
await pagina.waitForTimeout(1500);
await comprobar('2. «Vista» (sin documentos pendientes): deja de estar resaltada, sigue en la lista una sola vez y no se duplica',
  pagina.evaluate(() => { const l = document.getElementById('ficha-notas-lista'); return [l.querySelectorAll('.nota-fila').length && [...l.querySelectorAll('.nota-fila')].filter((f) => /justificante de pago/.test(f.textContent)).length, [...l.querySelectorAll('.nota-fila')].filter((f) => /justificante de pago/.test(f.textContent) && f.classList.contains('nota-directivo-sin-ver')).length]; }), [1, 0]);
await comprobar('2. en disco: `vistaPor` y `vistaEl`, y el mismo número de notas', Promise.all([notasDe(pagina, MARINA).then((l) => l.filter((n) => /justificante de pago/.test(n.texto)).map((n) => [n.vistaPor, !!n.vistaEl])), numeroDeNotas()]), [[['Revisor', true]], n0]);
await comprobar('2. el número del aviso baja', sinVer(pagina), '1 nota de directivo');
/* «Guardar en el asunto» en la otra nota sin ver (la de la demostración) */
await comprobar('2. la nota de la demostración sigue sin ver, con su documento',
  pagina.evaluate(() => { const f = document.querySelector('.nota-directivo-sin-ver'); return [/informe de la tutora/.test(f.textContent), f.querySelectorAll('[data-nd-guardar]').length]; }), [true, 1]);
await pagina.click('.nota-directivo-sin-ver [data-nd-guardar]');
await pagina.waitForSelector('#doc-guardar', { state: 'visible', timeout: 15000 });
await comprobar('2. «Guardar en el asunto» pasa por el cuadro de ponerle nombre', pagina.evaluate(() => /Informe de la tutora/.test(document.getElementById('doc-cuerpo').textContent)), true);
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(2500);
await comprobar('2. guardado el último documento, la carpeta de espera se borra',
  pagina.evaluate(async () => { const g = await Gestor.carpetaGestor().getDirectoryHandle('notas-directivos'); return (await Carpetas.subcarpetas(g)).length; }), 0);
await comprobar('2. la nota sin ver (ya sin documentos pendientes) se marca «Vista»', (async () => { await pagina.click('.nota-directivo-sin-ver [data-nd-vista]'); await pagina.waitForTimeout(1500); return sinVer(pagina); })(), null);
/* Archivar con notas sin ver */
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(500);
const nuevaSinVer = await pagina.evaluate(async () => {
  await App.anotarLista(Gestor.asuntos().filter((a) => a.nombre.indexOf('Aguilar Ponce, Pablo') !== -1)[0].nombre, 'notas', { anadir: [{ texto: 'Otra nota para ver.', quien: 'Jefa de estudios de prueba', cuando: new Date().toISOString(), deDirectivo: true, organo: 'Jefatura de Estudios' }] });
  App.pintarAbiertos(); return true;
});
await pagina.waitForTimeout(800);
await comprobar('2. el aviso vuelve a contar', sinVer(pagina), '1 nota de directivo');
await pagina.evaluate(() => { window.__cierre = App.cerrarAsunto(Gestor.asuntos().filter((a) => a.nombre.indexOf('Aguilar Ponce, Pablo') !== -1)[0]); });
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('2. archivar con notas sin ver pregunta antes, con «Verlas» y «Archivar de todos modos»',
  pagina.evaluate(() => [document.getElementById('cuadro-cuerpo').textContent, document.getElementById('cuadro-aceptar').textContent, document.getElementById('cuadro-cancelar').textContent]), ['Tiene 1 nota de directivo sin ver.', 'Archivar de todos modos', 'Verlas']);
await pagina.click('#cuadro-cancelar');
await pagina.waitForTimeout(800);
await comprobar('2. «Verlas» abre la ficha del asunto sin archivarlo', pagina.evaluate(() => [!document.getElementById('pantalla-asunto').classList.contains('oculto'), Gestor.asuntos().some((a) => a.nombre.indexOf('Aguilar Ponce, Pablo') !== -1)]), [true, true]);

/* ===== 3. Dos ordenadores a la vez ===== */
console.log('--- 3. dos notas a la vez ---');
const antes3 = (await notasDe(pagina, PABLO)).length;
await pagina.evaluate(async () => {
  const n = Gestor.asuntos().filter((a) => a.nombre.indexOf('Aguilar Ponce, Pablo') !== -1)[0].nombre;
  const nota = (t, c) => ({ texto: t, quien: 'Directora de prueba', cuando: c, deDirectivo: true, organo: 'Dirección' });
  await Promise.all([App.anotarLista(n, 'notas', { anadir: [nota('Nota desde un ordenador.', '2026-10-07T11:00:00.000Z')] }), App.anotarLista(n, 'notas', { anadir: [nota('Nota desde el otro.', '2026-10-07T11:00:01.000Z')] })]);
});
await comprobar('3. las dos quedan', notasDe(pagina, PABLO).then((l) => l.length - antes3), 2);
await pagina.close();

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
