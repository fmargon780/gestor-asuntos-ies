/* Prueba de la fila 638 (13-nov-2026, docs/638-VISTA-DEL-ASUNTO-HITO-Y-TAREAS.md): la vista del asunto, el hito con solo sus
   tareas y «Documentos de la carpeta». Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. Hito actual con tareas: arriba solo su nombre, «Marcar como hecho» y «Hito ▾»; ni «Generar documento ▾», «Comunicar ▾»
      ni «Hacer este hito»; ni recuadros «Tareas», «Campos», «Documentos» ni «Registro».
   2. «Hito ▾»: Cambiar, Borrar y Cambiar la guía…; sin «Dejarlo solo informativo» ni «Enviar estado».
   3. La línea del hito: «Hito actual · En curso · plazo»; el plazo se pone y se quita ahí; «Esperando a…» → «Esperando a … desde
      el …» con «Ya ha llegado».
   4. Un hito de Administración no dice a quién le toca; uno de otro responsable, «Le toca a: …».
   5. Un hito que no es el actual no tiene «Marcar como hecho» ni «Esperando a…».
   6. La siguiente tarea pendiente va resaltada, con su botón; las tareas de registrar y comunicar, apagadas hasta generar.
   7. Generar desde su tarea: queda colgado bajo la tarea con «Ruta» y «Extracto», tarea hecha, en la carpeta; registrar y
      comunicar se encienden.
   8. «+ Añadir tarea» abre el formulario; añadir deja la tarea en la lista sin abrir nada; «Cancelar» lo cierra.
   9. Hito sin tareas: «Este hito no tiene tareas» y «+ Añadir tarea».
  10. Asunto sin hitos: mensaje, «+ Añadir el primer hito», «Escribir la guía de <tipo>» y la línea de aviso; sin «Comunicar»;
      «+ Añadir documento» apagado con su línea; tras crear el primer hito, se enciende.
  11. «+ Añadir documento» de la carpeta: «¿De qué tarea es?» (hito actual elegido, tarea que espera y «Tarea nueva» al final;
      al cambiar de hito cambian las tareas; «Cancelar» no añade nada); «Tarea nueva» crea una tarea hecha con el nombre del tipo.
  12. El botón «Añadir documento» de una tarea no pregunta.
  13. Un fichero copiado a mano: «sin tarea» y «Colgar de una tarea» (primero «Cambiar el nombre», luego la pregunta); la marca se va.
  14. En «Documentos de la carpeta» no hay «Generar documento»; el registro del asunto dice de qué hito es cada línea. */
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
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 1100 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && !Demo.montando, null, { timeout: 60000 });
await pagina.waitForTimeout(2500);

async function abrir(frag) {
  await pagina.evaluate(() => { try { HitoMesa.cerrar(); } catch (e) { /* sin mesa */ } });
  await pagina.evaluate((f) => {
    const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(f) !== -1 || ((x.ficha && x.ficha.tercero) || '').indexOf(f) !== -1)[0];
    App.abrirFicha(a, 'abierto');
  }, frag);
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto) #ficha-plegables', { timeout: 15000 });
  await pagina.waitForSelector('#ficha-guia .hito-en-mesa .mesa-titulo, #ficha-guia .explica', { state: 'attached', timeout: 15000 });
  await pagina.waitForTimeout(1500);
}
const cond = (f, arg) => pagina.waitForFunction(f, arg, { timeout: 15000 });
const esperarRepintado = () => pagina.waitForTimeout(1400);
const textosDe = (sel) => pagina.evaluate((s) => Array.from(document.querySelectorAll(s)).map((e) => e.textContent.trim().replace(/\s+/g, ' ')), sel);
const botonesCabecera = () => pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-guia .hito-en-mesa .mesa-titulo-fila button')).filter((b) => b.offsetParent).map((b) => b.textContent.trim()));
const tareas = () => pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-guia .guion-paso')).map((e) => ({
  texto: e.querySelector('.guion-paso-texto').textContent.trim(),
  hecha: e.classList.contains('hecho'), siguiente: e.classList.contains('guion-siguiente'),
  boton: (e.querySelector('.guion-accion-tarea') || {}).textContent || '', apagado: !!(e.querySelector('.guion-accion-tarea') || {}).disabled,
  colgado: ((e.querySelector('.tcd') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
})));
const linea = () => pagina.evaluate(() => (document.querySelector('#ficha-guia .hito-en-mesa .mesa-linea') || { innerText: '' }).innerText.replace(/\s+/g, ' ').trim());
const abrirMenuHito = async () => { await pagina.click('#ficha-guia .hito-en-mesa .mesa-mas'); await pagina.waitForTimeout(300); };
const opcionesMenu = () => pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-menu:not(.oculto) > *')).filter((e) => !e.hidden).map((e) => e.tagName === 'HR' ? '—' : e.textContent.trim()));
const cerrarCuadro = async () => {
  await pagina.keyboard.press('Escape');
  await pagina.evaluate(() => { const c = document.getElementById('cuadro-cancelar'); if (!document.getElementById('capa').classList.contains('oculto') && c && c.offsetParent) c.click(); });
  await pagina.waitForTimeout(300);
};

/* ---------- 1 a 7: un asunto con guía ---------- */
console.log('--- 1. el hito actual ---');
await abrir('Vidal Soto');
await comprobar('1. arriba, solo «Marcar como hecho» y «Hito ▾»', botonesCabecera(), ['Marcar como hecho', 'Hito ▾']);
await comprobar('1. ni «Generar documento ▾», ni «Comunicar ▾», ni «Hacer este hito», en ningún sitio del hito',
  pagina.evaluate(() => { const t = Array.from(document.querySelectorAll('#ficha-guia button')).filter((b) => b.offsetParent).map((b) => b.textContent.trim()).join('|'); return [/Generar documento ▾/.test(t), /Comunicar ▾/.test(t), /Hacer este hito/.test(t)]; }), [false, false, false]);
await comprobar('1. ni recuadros «Tareas», «Campos», «Documentos» ni «Registro» en el hito',
  pagina.evaluate(() => { const t = document.querySelector('#ficha-guia .hito-en-mesa').innerText; return [/^\s*TAREAS/im.test(t), /^\s*CAMPOS/im.test(t), /^\s*DOCUMENTOS/im.test(t), /^\s*REGISTRO/im.test(t), !!document.querySelector('#ficha-guia .mesa-bloque:not(.mesa-normativa)')]; }), [false, false, false, false, false]);
await comprobar('1. el hito lleva su explicación', pagina.evaluate(() => !!document.querySelector('#ficha-guia .hito-explicacion')), true);

console.log('--- 2. «Hito ▾» ---');
await abrirMenuHito();
await comprobar('2. Cambiar, Borrar y Cambiar la guía…, sin «Dejarlo solo informativo» ni «Enviar estado»',
  opcionesMenu().then((o) => o.filter((t) => t !== '—' && t !== 'Saltar a este hito…')), ['Cambiar', 'Borrar', 'Cambiar la guía…']);
await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(200);

console.log('--- 3. la línea del hito ---');
await comprobar('3. «Hito actual · En curso · Sin plazo» y «Esperando a…»', linea().then((t) => /^Hito actual · En curso · Sin plazo/.test(t) && /Esperando a…/.test(t)), true);
await pagina.click('#ficha-guia .mesa-etq-plazo');
await pagina.waitForTimeout(300);
await comprobar('3. el plazo se pulsa ahí mismo: poner, cambiar o quitar', opcionesMenu(), ['Cambiar la fecha…', 'Quitar la fecha']);
await pagina.click('.ficha-menu:not(.oculto) >> text=Cambiar la fecha…');
await pagina.waitForSelector('#mesa-fecha-nueva');
const manana = await pagina.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 20); return d.toISOString().slice(0, 10); });
await pagina.fill('#mesa-fecha-nueva', manana);
await pagina.click('#cuadro-aceptar');
await esperarRepintado();
await comprobar('3. con plazo, la línea lo dice', linea().then((t) => /^Hito actual · En curso · Vence el /.test(t)), true);
await pagina.click('#ficha-guia .mesa-etq-plazo');
await pagina.waitForTimeout(300);
await pagina.click('.ficha-menu:not(.oculto) >> text=Quitar la fecha');
await esperarRepintado();
await comprobar('3. y se quita', linea().then((t) => /^Hito actual · En curso · Sin plazo/.test(t)), true);
await pagina.click('#ficha-guia .mesa-esperando-a');
await pagina.waitForSelector('#esperando-a');
await pagina.click('#cuadro-aceptar');
await esperarRepintado();
await comprobar('3. «Esperando a…» pone la espera: «Esperando a … desde el …» y «Ya ha llegado»',
  linea().then((t) => [/^Hito actual · Esperando a .+ desde el \d+-\w+/.test(t), /Ya ha llegado/.test(t), /Esperando a…/.test(t)]), [true, true, false]);
await comprobar('3. ya no sale a la derecha de la fila de hitos', pagina.evaluate(() => document.querySelectorAll('#ficha-acciones .marca-esperando, #ficha-acciones .boton-esperando, #ficha-acciones .boton-ya-llegado').length), 0);
await pagina.click('#ficha-guia .mesa-ya-llego');
await esperarRepintado();
await comprobar('3. «Ya ha llegado» la quita', linea().then((t) => [/Esperando a …/.test(t), /^Hito actual · En curso/.test(t), /Esperando a…/.test(t)]), [false, true, true]);

console.log('--- 4. a quién le toca ---');
await comprobar('4. un hito de Administración no dice a quién le toca', linea().then((t) => /Le toca a/.test(t)), false);
await pagina.evaluate(async () => {
  const a = App.E.listaAbiertos.filter((x) => (x.ficha.tercero || '').indexOf('Vidal Soto') !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[0];
  await Hitos.guardarCampos(a.nombre, h.id, { responsable: 'tutor' });
  HitosPanel.programarRepintado();
});
await esperarRepintado();
await comprobar('4. uno de otro responsable dice «Le toca a: …»', linea().then((t) => /Le toca a: Familia/.test(t)), true);
await comprobar('4. y no enseña «Esperando a…» (ya espera a su responsable)', linea().then((t) => /Esperando a…/.test(t)), false);
await pagina.evaluate(async () => {
  const a = App.E.listaAbiertos.filter((x) => (x.ficha.tercero || '').indexOf('Vidal Soto') !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[0];
  await Hitos.guardarCampos(a.nombre, h.id, { responsable: '' });
  HitosPanel.programarRepintado();
});
await esperarRepintado();

console.log('--- 5. un hito que no es el actual ---');
await pagina.locator('#ficha-tira .mesa-tira-hito').nth(1).click();
await esperarRepintado();
await comprobar('5. sin «Marcar como hecho» ni «Esperando a…»; «Sin empezar»', Promise.all([botonesCabecera(), linea()]).then(([b, t]) => [b, /^Sin empezar/.test(t), /Esperando a/.test(t)]), [['Hito ▾'], true, false]);
await comprobar('9. un hito sin tareas lo dice, y trae «+ Añadir tarea»', pagina.evaluate(() => [/Este hito no tiene tareas/.test(document.querySelector('#ficha-guia .hito-en-mesa').innerText), !!document.querySelector('#ficha-guia .tcd-abrir-form')]), [true, true]);
await pagina.locator('#ficha-tira .mesa-tira-hito').nth(0).click();
await esperarRepintado();

console.log('--- 6. la siguiente tarea ---');
await comprobar('6. tres tareas, la primera resaltada con su botón; registrar y comunicar, apagadas con «Saldrá aquí…»', tareas(), [
  { texto: 'Generar el certificado', hecha: false, siguiente: true, boton: 'Generar documento', apagado: false, colgado: '' },
  { texto: 'Registrar la salida en Séneca', hecha: false, siguiente: false, boton: 'Registrar', apagado: true, colgado: 'Saldrá aquí al generar el certificado.' },
  { texto: 'Enviar el certificado por correo', hecha: false, siguiente: false, boton: 'Enviar correo', apagado: true, colgado: 'Saldrá aquí al generar el certificado.' }]);
await comprobar('6. el botón de la siguiente es el principal', pagina.evaluate(() => document.querySelector('#ficha-guia .guion-siguiente .guion-accion-tarea').classList.contains('boton-principal')), true);

console.log('--- 7. generar desde su tarea ---');
await pagina.click('#ficha-guia .guion-siguiente .guion-accion-tarea');
await cond(() => document.querySelector('#ficha-guia .guion-paso.hecho .tcd'));
await esperarRepintado();
const t7 = await tareas();
await comprobar('7. la tarea queda hecha y el documento, colgado con «Ruta» y «Extracto»',
  [t7[0].hecha, /^DOCX\d{6} CERTIFICADO D26-\d+\.docxRutaExtracto/.test(t7[0].colgado)], [true, true]);
await comprobar('7. registrar y comunicar pasan de apagadas a encendidas', [t7[1].apagado, t7[2].apagado], [false, false]);
await comprobar('7. el documento sale también en «Documentos de la carpeta»', pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento-fila')).some((f) => /CERTIFICADO D26/.test(f.dataset.doc))), true);
await comprobar('7. la siguiente es ahora «Registrar»', tareas().then((t) => t.filter((x) => x.siguiente).map((x) => x.texto)), ['Registrar la salida en Séneca']);
await pagina.evaluate(() => { const b = document.querySelector('#trabajo-der button'); /* cierra el documento abierto, si lo hay */ const v = Array.from(document.querySelectorAll('#trabajo-der button')).filter((x) => /Carpeta|Volver|Cerrar/.test(x.textContent) && x.offsetParent)[0]; if (v) v.click(); });
await pagina.waitForTimeout(500);

console.log('--- 8. «+ Añadir tarea» ---');
await pagina.click('#ficha-guia .tcd-abrir-form');
await pagina.waitForSelector('#guion-nueva-tarea');
await comprobar('8. abre el formulario: nombre y «Qué se hace»', pagina.evaluate(() => [!!document.getElementById('guion-nueva-tarea'), !!document.querySelector('#ficha-guia .tcd-accion'), !!document.querySelector('#ficha-guia .tcd-abrir-form')]), [true, true, false]);
await pagina.click('#ficha-guia .tcd-cancelar-form');
await pagina.waitForTimeout(400);
await comprobar('8. «Cancelar» lo cierra', pagina.evaluate(() => [!document.getElementById('guion-nueva-tarea'), !!document.querySelector('#ficha-guia .tcd-abrir-form')]), [true, true]);
await pagina.click('#ficha-guia .tcd-abrir-form');
await pagina.fill('#guion-nueva-tarea', 'Revisar el DNI de la familia');
await pagina.selectOption('#ficha-guia .tcd-accion', 'anadir');
await pagina.click('#ficha-guia .tcd-anadir');
await pagina.waitForFunction(() => Array.from(document.querySelectorAll('#ficha-guia .guion-paso-texto')).some((e) => /Revisar el DNI de la familia/.test(e.textContent)), null, { timeout: 10000 });
await esperarRepintado();
await comprobar('8. la tarea queda en la lista, sin abrir ninguna ventana y con el formulario cerrado',
  pagina.evaluate(() => [document.getElementById('capa').classList.contains('oculto'), !document.getElementById('guion-nueva-tarea'),
    Array.from(document.querySelectorAll('#ficha-guia .guion-paso')).pop().querySelector('.guion-accion-tarea').textContent]), [true, true, 'Añadir documento']);

/* ---------- 12: el botón «Añadir documento» de una tarea no pregunta ---------- */
console.log('--- 12. «Añadir documento» de una tarea ---');
await pagina.evaluate(async () => {
  const a = App.E.listaAbiertos.filter((x) => (x.ficha.tercero || '').indexOf('Vidal Soto') !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[0];
  const g = Hitos.guionDe(a, h);
  for (const x of g) if (x.accion !== 'anadir') await Hitos.marcarGuion(a.nombre, h.id, x.id, { hecho: true });
  HitosPanel.programarRepintado();
});
await esperarRepintado();
await pagina.click('#ficha-guia .guion-siguiente .guion-accion-tarea');
await pagina.waitForSelector('#doc-tipo', { timeout: 10000 });
await pagina.selectOption('#doc-tipo', { label: 'SOLICITUD' });
await pagina.click('#doc-guardar');
await cond(() => !document.getElementById('doc-guardar') || document.getElementById('doc-guardar').disabled === false || true);
await pagina.waitForTimeout(2500);
await comprobar('12. no pregunta «¿De qué tarea es?»', pagina.evaluate(() => !document.querySelector('.pt-capa')), true);
await pagina.evaluate(() => { const c = document.getElementById('cuadro-aceptar'); if (!document.getElementById('capa').classList.contains('oculto') && c) c.click(); });
await esperarRepintado();
const t12 = await tareas();
await comprobar('12. la tarea queda hecha con su documento colgado', [t12[t12.length - 1].hecha, /SOLICITUD/.test(t12[t12.length - 1].colgado)], [true, true]);

/* ---------- 11: «+ Añadir documento» de la carpeta ---------- */
console.log('--- 11. «+ Añadir documento» de la carpeta ---');
await pagina.locator('#ficha-plegables .plegable-cab', { hasText: 'Documentos de la carpeta' }).click();
await pagina.waitForTimeout(500);
await comprobar('14. en «Documentos de la carpeta» no hay «Generar documento»', pagina.evaluate(() => Array.from(document.querySelectorAll('#trabajo-carpeta button')).some((b) => /Generar documento/.test(b.textContent)), false), false);
const nTareasAntes = (await tareas()).length;
await pagina.click('.ficha-documentos-anadir');
await pagina.waitForSelector('#doc-tipo', { timeout: 10000 });
await pagina.selectOption('#doc-tipo', { label: 'INFORME' });
await pagina.click('#doc-guardar');
await pagina.waitForSelector('.pt-capa', { timeout: 10000 });
await comprobar('11. pregunta «¿De qué tarea es?» con el hito actual elegido y «Tarea nueva» al final',
  pagina.evaluate(() => ({ titulo: document.querySelector('.pt-capa h3').textContent, hito: document.querySelector('#pt-hito').selectedOptions[0].textContent,
    opciones: Array.from(document.querySelectorAll('.pt-op')).map((e) => e.innerText.trim().replace(/\s+/g, ' ')), boton: document.getElementById('pt-ok').textContent })),
  { titulo: '¿De qué tarea es?', hito: '1. Preparar y enviar el certificado (el actual)', opciones: ['Tarea nueva: «INFORME» La app la crea en ese hito y la deja hecha.'], boton: 'Añadir' });
await pagina.selectOption('#pt-hito', { index: 1 });
await comprobar('11. al cambiar de hito cambian las tareas', pagina.evaluate(() => Array.from(document.querySelectorAll('.pt-op')).length), 1);
await pagina.selectOption('#pt-hito', { index: 0 });
await pagina.click('#pt-cancelar');
await pagina.waitForTimeout(500);
await comprobar('11. «Cancelar» no añade nada', pagina.evaluate(async () => {
  const a = App.E.listaAbiertos.filter((x) => (x.ficha.tercero || '').indexOf('Vidal Soto') !== -1)[0];
  const f = await Carpetas.ficheros(a.handle);
  return [f.some((x) => /INFORME/.test(x.nombre)), !document.querySelector('.pt-capa')];
}), [false, true]);
await comprobar('11. y el cuadro de fichero y tipo sigue abierto para corregir', pagina.evaluate(() => !!document.getElementById('doc-guardar')), true);
await pagina.click('#doc-guardar');
await pagina.waitForSelector('.pt-capa', { timeout: 10000 });
await pagina.click('#pt-ok');
await pagina.waitForTimeout(2500);
await pagina.evaluate(() => { const c = document.getElementById('cuadro-aceptar'); if (!document.getElementById('capa').classList.contains('oculto') && c) c.click(); });
await esperarRepintado();
const t11 = await tareas();
await comprobar('11. «Tarea nueva»: aparece en ese hito una tarea hecha con el nombre del tipo y el documento colgado',
  [t11.length - nTareasAntes, t11[t11.length - 1].texto, t11[t11.length - 1].hecha, /INFORME/.test(t11[t11.length - 1].colgado)], [1, 'INFORME', true, true]);
await comprobar('11. y una línea en el registro del asunto, con el hito', pagina.evaluate(async () => {
  const a = App.E.listaAbiertos.filter((x) => (x.ficha.tercero || '').indexOf('Vidal Soto') !== -1)[0];
  return RegistroAsunto.lineas(a).some((l) => /Añadido «.*INFORME.*» en la tarea «INFORME»/.test(l.texto) && l.hitoTitulo === 'Preparar y enviar el certificado');
}), true);

/* ---------- 13: un fichero copiado a mano ---------- */
console.log('--- 13. un fichero que llega solo a la carpeta ---');
await pagina.evaluate(async () => {
  const a = App.E.listaAbiertos.filter((x) => (x.ficha.tercero || '').indexOf('Vidal Soto') !== -1)[0];
  await Carpetas.escribirBytes(a.handle, 'escaneo0012.pdf', new TextEncoder().encode('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF'), 'application/pdf');
  await FichaDocumentos.pintar(a);
});
await pagina.waitForTimeout(800);
await comprobar('13. sale con «sin tarea» y «Colgar de una tarea»; los que cuelgan de una tarea, no',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento-fila')).map((f) => [f.dataset.doc.slice(0, 11), !!f.querySelector('.marca-sin-tarea'), !!f.querySelector('.ficha-documento-colgar')]).sort()),
  await pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-documentos .ficha-documento-fila')).map((f) => [f.dataset.doc.slice(0, 11), /escaneo/.test(f.dataset.doc), /escaneo/.test(f.dataset.doc)]).sort()));
await comprobar('13. y solo ese está sin tarea', pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-documentos .marca-sin-tarea')).map((e) => e.closest('.ficha-documento-fila').dataset.doc)), ['escaneo0012.pdf']);
await pagina.click('#ficha-documentos .ficha-documento-colgar');
await pagina.waitForSelector('#doc-tipo', { timeout: 10000 });
await comprobar('13. sin tipo ni nombre según la norma, abre antes «Cambiar el nombre»', pagina.evaluate(() => !!document.getElementById('doc-guardar') && !document.querySelector('.pt-capa')), true);
await pagina.selectOption('#doc-tipo', { label: 'SOLICITUD' });
await pagina.click('#doc-guardar');
await pagina.waitForSelector('.pt-capa', { timeout: 10000 });
await comprobar('13. después, la pregunta, con «Colgar»', pagina.evaluate(() => [document.getElementById('pt-ok').textContent, /Tarea nueva: «SOLICITUD»/.test(document.querySelector('.pt-capa').innerText)]), ['Colgar', true]);
await pagina.click('#pt-ok');
await pagina.waitForTimeout(2500);
await pagina.evaluate(() => { const c = document.getElementById('cuadro-aceptar'); if (!document.getElementById('capa').classList.contains('oculto') && c) c.click(); });
await esperarRepintado();
await comprobar('13. la marca «sin tarea» desaparece y la tarea nueva lleva el nombre del tipo (no el del fichero)',
  pagina.evaluate(() => [document.querySelectorAll('#ficha-documentos .marca-sin-tarea').length, Array.from(document.querySelectorAll('#ficha-guia .guion-paso-texto')).pop().textContent.trim()]), [0, 'SOLICITUD']);

/* ---------- el registro del asunto ---------- */
console.log('--- 14. el registro del asunto ---');
await pagina.locator('#ficha-plegables .plegable-cab', { hasText: 'Registro' }).click();
await pagina.waitForTimeout(500);
await comprobar('14. cada línea dice de qué hito es', pagina.evaluate(() => {
  const l = Array.from(document.querySelectorAll('#ficha-notas .registro-linea'));
  return [l.length > 0, l.filter((x) => /Colgado|Añadido/.test(x.textContent)).every((x) => /Preparar y enviar el certificado/.test(x.querySelector('.nota-cabeza').textContent))];
}), [true, true]);

/* ---------- 10: un asunto sin hitos ---------- */
console.log('--- 10. un asunto sin hitos ---');
await abrir('Imprenta Sol');
await comprobar('10. el mensaje, «+ Añadir el primer hito», «Escribir la guía de PEDIDO» y la línea de aviso, en ese orden',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ficha-guia > *')).map((e) => e.innerText.trim().replace(/\s+/g, ' ').slice(0, 26))),
  ['Este tipo no tiene guía. P', '+ Añadir el primer hito', 'Escribir la guía de PEDIDO', 'Para generar, comunicar o ']);
await comprobar('10. no hay fila de hitos ni «Comunicar» de arriba',
  pagina.evaluate(() => [document.getElementById('ficha-tira').children.length, Array.from(document.querySelectorAll('#ficha-acciones button')).filter((b) => b.offsetParent && /Comunicar|Generar documento/.test(b.textContent)).length]), [0, 0]);
await pagina.locator('#ficha-plegables .plegable-cab', { hasText: 'Documentos de la carpeta' }).click();
await pagina.waitForTimeout(500);
await comprobar('10. «+ Añadir documento» apagado, con su línea', pagina.evaluate(() => [document.querySelector('.ficha-documentos-anadir').disabled, (document.querySelector('.ficha-documentos-sin-hito') || {}).textContent]), [true, 'Para añadir un documento, crea antes el hito.']);
await pagina.click('#ficha-guia button:has-text("+ Añadir el primer hito")');
await pagina.waitForSelector('#hda-titulo');
await pagina.fill('#hda-titulo', 'Atender el pedido');
await pagina.evaluate(() => { const c = document.getElementById('hda-solo-aqui'); if (c && !c.checked) c.click(); });
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#ficha-guia .hito-en-mesa', { timeout: 15000 });
await esperarRepintado();
await comprobar('10. tras crear el primer hito, «+ Añadir documento» se enciende y la línea se va',
  pagina.evaluate(() => [document.querySelector('.ficha-documentos-anadir').disabled, !document.querySelector('.ficha-documentos-sin-hito')]), [false, true]);
await comprobar('10. y el hito nuevo no tiene tareas', pagina.evaluate(() => /Este hito no tiene tareas/.test(document.querySelector('#ficha-guia .hito-en-mesa').innerText)), true);

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
