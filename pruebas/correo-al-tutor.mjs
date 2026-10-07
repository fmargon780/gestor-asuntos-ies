/* Fila 299 (7-oct-2026, docs/CORREO-AL-TUTOR-DEL-GRUPO.md), con Chromium real y los datos inventados de la copia de
   pruebas (?demo=1&auto=1): SANCION (con la pasada de «Informar al tutor/a» ya hecha) y cuatro asuntos suyos:
   Jimenez Rubio (4º A: tutora con correo, y su NOTIFICACION en la carpeta), Fuentes Calvo (1º Bach A: tutora sin
   correo, sin NOTIFICACION), Delgado Prieto (2º B: dos tutores) y Klein Soto (1º C: sin tutor); y un asunto de
   INCIDENCIA DE AULA (también Jimenez Rubio, 4º A) con la tarea «Avisar a la tutoría».

   8. La tarea con «Tutor/a del grupo» abre el cuadro con el correo del tutor, el saludo «Buenas:» y su nombre en la
      constancia; lo mismo desde «Hacer este hito»; con dos tutores, las dos direcciones.
   9. Sin correo: sale la línea, se escribe uno, se envía, y al abrir otra vez viene puesto; con «Cambiar» y otro envío,
      queda el nuevo.
   11. Unidad sin tutor: línea ámbar y el cuadro se abre.
   12. Plantilla con «Adjuntar solo»: marca el PDF más reciente de ese tipo; sin ninguno, línea ámbar; al cambiar de
      plantilla se desmarca el que marcó la app y no el que marcó el usuario.
   Y: el hito se llama «Informar al tutor/a», las casillas de «Comunicar ▾», la guía y la plantilla en Ajustes, y el
   asunto de otro tipo. */
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
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.InformarAlTutor, null, { timeout: 60000 });
await pagina.waitForTimeout(3000);

async function abrirMesa(frag) {
  await pagina.evaluate(() => { const v = document.getElementById('word-visor'); if (v) WordVisor.cerrar(); });
  await pagina.click('button.pestana[data-pantalla="abiertos"]');
  await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]');
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto*="' + frag + '"] .tarjeta-nombre').first().click();
  await pagina.waitForTimeout(1200);
  await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
  await pagina.waitForTimeout(400);
  if (!(await pagina.locator('#ficha-guia.con-mesa').count())) await pagina.locator('#ficha-guia .hito .hito-titulo').first().click();
  await pagina.waitForSelector('#ficha-guia.con-mesa', { timeout: 10000 });
  await pagina.waitForTimeout(600);
}
async function abrirComunicar() {
  await pagina.click('.hito-en-mesa .mesa-abrir-panel[data-panel="comunicar"]');
  await pagina.waitForSelector('.hito-en-mesa .mesa-preparar-correo');
  await pagina.waitForTimeout(300);
}
async function cerrarCuadro() {
  await pagina.evaluate(() => HitoMesa.cerrarPanelSiAbierto && HitoMesa.cerrarPanelSiAbierto());
  await pagina.click('#cuadro-aceptar');
  await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));
  await pagina.waitForTimeout(300);
}
async function esperarCuadro() {
  await pagina.waitForSelector('#capa:not(.oculto) #correo-formulario', { timeout: 15000 });
  await pagina.waitForTimeout(900);
}
const cuadro = () => pagina.evaluate(() => {
  const marcadas = [...document.querySelectorAll('#correo-formulario .correo-marca')].filter((c) => c.checked).map((c) => c.value);
  return {
    otro: document.getElementById('correo-otro').value,
    marcadas: marcadas,
    saludo: document.getElementById('correo-cuerpo-texto').value.split('\n')[0],
    cuerpo: document.getElementById('correo-cuerpo-texto').value,
    arriba: (document.getElementById('correo-tutor-aviso') || {}).textContent || '',
    lineas: [...document.querySelectorAll('#correo-formulario .correo-tutor-linea')].map((l) => l.textContent),
    docs: [...document.querySelectorAll('#correo-formulario .adjunto-marca')].filter((c) => !/^(\d{6} )?CORREO /.test(c.value)).map((c) => [c.value.replace(/^\d{6} /, ''), c.checked]),   /* el PDF del correo enviado (fila 236) no cuenta */
    avisoDoc: (document.getElementById('correo-adjunto-plantilla-aviso') || {}).textContent || '',
    plantilla: document.getElementById('correo-plantilla') ? document.getElementById('correo-plantilla').selectedOptions[0].textContent : null
  };
});
const tutorias = (frag) => pagina.evaluate(async (frag) => {
  const a = Gestor.asuntos().filter((x) => x.nombre.indexOf(frag) !== -1)[0];
  const h = (await Hitos.hitosDe(a.nombre))[0];
  return { titulo: h.titulo, notas: (h.notas || []).map((n) => n.texto || n), hechas: Hitos.guionDe(a, h).filter((g) => g.hecho).map((g) => g.id) };
}, frag);
const enviar = async () => {
  await pagina.locator('#correo-caja button:text-is("Enviar")').click();
  await pagina.waitForTimeout(500);
  await pagina.locator('#correo-confirmar-envio').click();
  await pagina.waitForTimeout(2500);
};

/* ===== 1. El hito se llama «Informar al tutor/a» ===== */
console.log('--- 1. el hito y las casillas ---');
await abrirMesa('SANCION Jimenez Rubio');
await comprobar('1. el hito del primer asunto de SANCION se llama «Informar al tutor/a»', pagina.locator('.hito-en-mesa .mesa-titulo').allTextContents(), ['Informar al tutor/a']);
await comprobar('1. y en los cuatro asuntos y en la guía, ninguno «Notificar al tutor/a»', pagina.evaluate(async () => {
  const t = [];
  for (const a of Gestor.asuntos().filter((x) => /SANCION/.test(x.nombre))) t.push((await Hitos.hitosDe(a.nombre))[0].titulo);
  return t.concat(GuiasDelCentro.pasosDe('SANCION').map((p) => p.titulo));
}), ['Informar al tutor/a', 'Informar al tutor/a', 'Informar al tutor/a', 'Informar al tutor/a', 'Informar al tutor/a', 'Entregar la notificación a la familia']);
await abrirComunicar();
await comprobar('2. «Comunicar ▾»: la casilla del tutor, con su unidad, y sin marcar',
  pagina.$$eval('.hito-en-mesa .mesa-chip', (c) => c.map((x) => [x.textContent, x.querySelector('input').checked])),
  [['Jimenez Rubio, Mateo', true], ['Otero Campos, Marta (tutor/a de 4º A)', false]]);
await comprobar('2. arriba, la tarea pendiente de comunicar', pagina.locator('.hito-en-mesa .mesa-receta').allTextContents(), ['Avisar al tutor/a']);

/* ===== 8. Mateo: el cuadro con todo ===== */
console.log('--- 8. el cuadro del tutor con correo y NOTIFICACION ---');
await pagina.click('.hito-en-mesa .mesa-receta');
await esperarCuadro();
let c = await cuadro();
await comprobar('8. el correo del tutor ya puesto, el saludo «Buenas:» y su texto', [c.otro, c.marcadas, c.saludo, /^Jefatura de Estudios entregará al alumno la notificación escrita para la familia\./m.test(c.cuerpo),
  /Esta comunicación es solo a efectos informativos para el tutor o la tutora\./.test(c.cuerpo)], ['motero@correo-demo.es', [], 'Buenas:', true, true]);
await comprobar('8. con la plantilla «Informar al tutor/a de la sanción»', c.plantilla, 'Informar al tutor/a de la sanción');
await comprobar('8. el documento NOTIFICACION, marcado', c.docs.map((d) => [d[0].replace(/ D26-\d+/, ''), d[1]]), [['NOTIFICACION.pdf', true]]);
await comprobar('8. sin línea ámbar ni «No tengo el correo…»', [c.arriba, c.lineas, c.avisoDoc], ['', [], '']);
await comprobar('8. el saludo de siempre no sale', c.cuerpo.indexOf('Estimados tutores legales'), -1);
await enviar();
await cerrarCuadro();
const t1 = await tutorias('SANCION Jimenez Rubio');
await comprobar('8. la constancia dice a quién, por su nombre', t1.notas.some((n) => /^Correo enviado a Otero Campos, Marta/.test(n)), true);
await comprobar('8. y la tarea queda hecha', t1.hechas, ['g-demo-tutor-avisar']);

/* ===== 6. Delgado: dos tutores, desde «Hacer este hito» ===== */
console.log('--- 6. dos tutores, «Hacer este hito» ---');
await abrirMesa('SANCION Delgado Prieto');
await comprobar('6. «Hacer este hito», con su línea', pagina.locator('.hito-en-mesa .mesa-hacer-linea').allTextContents(), ['correo al tutor o tutora del grupo']);
await pagina.locator('.hito-en-mesa .mesa-hacer-hito').click();
await esperarCuadro();
c = await cuadro();
await comprobar('6. las direcciones de los dos tutores y «Buenas:»', [c.otro, c.saludo, c.marcadas], ['freyes@correo-demo.es, puceda@correo-demo.es', 'Buenas:', []]);
await comprobar('6. «Todavía no» en vez de «Cerrar»', pagina.locator('#cuadro-aceptar').textContent(), 'Todavía no');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(1500);
await pagina.evaluate(() => Hitos.guionDe && 0);

/* ===== 9. Fuentes: tutora sin correo ===== */
console.log('--- 9. sin correo: se escribe, se recuerda ---');
await abrirMesa('SANCION Fuentes Calvo');
await abrirComunicar();
await pagina.click('.hito-en-mesa .mesa-receta');
await esperarCuadro();
c = await cuadro();
await comprobar('9. «Otro correo» vacío y la línea «No tengo el correo de…»', [c.otro, c.marcadas, c.lineas],
  ['', [], ['No tengo el correo de Cabello Ruiz, Esperanza. Escríbelo aquí y lo recordaré.']]);
await comprobar('9. sin NOTIFICACION: la línea ámbar de la plantilla', c.avisoDoc,
  'Esta plantilla adjunta el documento NOTIFICACION, y en este asunto todavía no hay ninguno.');
await comprobar('9. el saludo «Buenas:»', c.saludo, 'Buenas:');
await pagina.fill('#correo-otro', 'esperanza@correo-demo.es');
await enviar();
await cerrarCuadro();
await comprobar('9. al enviar, se recuerda para esa profesora', pagina.evaluate(async () => {
  const t = await CorreosAMano.leerTodos();
  return Object.keys(t).map((k) => [k, t[k].correo, t[k].nombre, t[k].quien, /^\d{4}-\d{2}-\d{2}$/.test(t[k].cuando)]);
}), [['77889900', 'esperanza@correo-demo.es', 'Cabello Ruiz, Esperanza', 'Revisor', true]]);
await comprobar('9. y el fichero entra en las copias diarias', pagina.evaluate(() => Copias.FICHEROS.indexOf('correos-a-mano.json') !== -1), true);
/* Otra vez: la casilla de la tutora, «Preparar correo» */
await abrirMesa('SANCION Fuentes Calvo');
await abrirComunicar();
await pagina.locator('.hito-en-mesa .mesa-chip', { hasText: 'Cabello Ruiz' }).locator('input').check();
await pagina.locator('.hito-en-mesa .mesa-chip', { hasText: 'Fuentes Calvo' }).locator('input').uncheck();
await pagina.click('.hito-en-mesa .mesa-preparar-correo');
await esperarCuadro();
c = await cuadro();
await comprobar('9. la dirección viene puesta, con «escrito a mano» y «Cambiar»', [c.otro, c.lineas.length, /^Correo de Cabello Ruiz, Esperanza, escrito a mano el \d{2}\/\d{2}\/\d{4} · Cambiar$/.test(c.lineas[0] || ''), c.saludo],
  ['esperanza@correo-demo.es', 1, true, 'Buenas:']);
await pagina.locator('.correo-tutor-cambiar').click();
await comprobar('9. «Cambiar» vacía la caja', pagina.inputValue('#correo-otro'), '');
await pagina.fill('#correo-otro', 'esperanza.nueva@correo-demo.es');
await enviar();
await cerrarCuadro();
await comprobar('9. el nuevo sustituye al anterior', pagina.evaluate(async () => Object.values(await CorreosAMano.leerTodos()).map((t) => t.correo)), ['esperanza.nueva@correo-demo.es']);

/* ===== 11. Klein: unidad sin tutor ===== */
console.log('--- 11. unidad sin tutor ---');
await abrirMesa('SANCION Klein Soto');
await abrirComunicar();
await comprobar('11. sin casilla de tutor', pagina.$$eval('.hito-en-mesa .mesa-chip', (c) => c.map((x) => x.textContent.trim())), ['Klein Soto, Ana']);
await pagina.click('.hito-en-mesa .mesa-receta');
await esperarCuadro();
c = await cuadro();
await comprobar('11. el cuadro se abre, con la línea ámbar y sin dirección', [c.arriba, c.otro, c.marcadas, c.saludo],
  ['No sé quién es el tutor o tutora de 1º C. Sube la relación de tutorías de Séneca en Herramientas → Tablas de datos.', '', [], 'Buenas:']);
await comprobar('11. sin «No tengo el correo de…» (no hay a quién)', c.lineas, []);
await cerrarCuadro();

/* ===== 12. Adjuntar solo ===== */
console.log('--- 12. adjuntar solo ---');
await pagina.evaluate(async () => {
  const a = Gestor.asuntos().filter((x) => /SANCION Jimenez/.test(x.nombre))[0];
  const f = await a.handle.getFileHandle('260920 INFORME D26-09999.pdf', { create: true });
  const w = await f.createWritable(); await w.write(new Blob(['%PDF-1.4\n%%EOF'])); await w.close();
});
await abrirMesa('SANCION Jimenez Rubio');
await abrirComunicar();
await pagina.click('.hito-en-mesa .mesa-preparar-correo');
await esperarCuadro();
c = await cuadro();
await comprobar('12. con el INFORME suelto en la carpeta, solo se marca la NOTIFICACION',
  c.docs.map((d) => [d[0].replace(/ D26-\d+/, ''), d[1]]), [['INFORME.pdf', false], ['NOTIFICACION.pdf', true]]);
await comprobar('12. «Sin plantilla»: se desmarca la que marcó la app', (async () => {
  await pagina.selectOption('#correo-plantilla', '');
  await pagina.waitForTimeout(500);
  return (await cuadro()).docs.map((d) => d[1]);
})(), [false, false]);
await comprobar('12. la plantilla otra vez: se vuelve a marcar', (async () => {
  await pagina.selectOption('#correo-plantilla', { label: 'Informar al tutor/a de la sanción' });
  await pagina.waitForTimeout(500);
  return (await cuadro()).docs.map((d) => d[1]);
})(), [false, true]);
await pagina.locator('#correo-formulario .adjunto-marca').first().check();
await pagina.selectOption('#correo-plantilla', '');
await pagina.waitForTimeout(500);
await comprobar('12. lo que marcó la persona no se toca; lo de la app, sí', (await cuadro()).docs.map((d) => d[1]), [true, false]);
await pagina.selectOption('#correo-plantilla', { label: 'Informar al tutor/a de la sanción' });
await pagina.waitForTimeout(500);
await pagina.locator('#correo-formulario .adjunto-marca').nth(1).uncheck();
await pagina.selectOption('#correo-plantilla', '');
await pagina.waitForTimeout(500);
await comprobar('12. si la persona desmarca el de la app, no se vuelve a tocar', (await cuadro()).docs.map((d) => d[1]), [true, false]);
await cerrarCuadro();

/* ===== 12b. «Guardar como plantilla nueva» conoce el saludo «Buenas:»; y Séneca señala el documento ===== */
console.log('--- 12b. plantilla de lo escrito y Séneca ---');
await abrirMesa('SANCION Jimenez Rubio');
await abrirComunicar();
await pagina.locator('.hito-en-mesa .mesa-chip', { hasText: 'Otero Campos' }).locator('input').check();
await pagina.locator('.hito-en-mesa .mesa-chip', { hasText: 'Jimenez Rubio' }).locator('input').uncheck();
await pagina.click('.hito-en-mesa .mesa-preparar-correo');
await esperarCuadro();
await pagina.click('#correo-plantilla-desde-escrito');
await pagina.waitForSelector('#pl2-texto');
await comprobar('12b. el editor de la plantilla nueva no lleva el saludo «Buenas:» ni la firma',
  pagina.inputValue('#pl2-texto').then((t) => [/^Buenas/.test(t), /Un saludo/.test(t), /^Jefatura de Estudios entregará/.test(t)]), [false, false, true]);
await pagina.click('#pl2-cancelar');
await cerrarCuadro();
await abrirComunicar();
await pagina.click('.hito-en-mesa .mesa-mensaje-seneca');
await pagina.waitForSelector('#capa:not(.oculto) #seneca-formulario');
await pagina.waitForTimeout(900);
await comprobar('12b. en Séneca, el documento NOTIFICACION se señala para adjuntarlo a mano',
  pagina.locator('#seneca-formulario .seneca-doc-adjuntar').allTextContents().then((t) => t.map((x) => /^Adjunta este documento en Séneca: \d{6} NOTIFICACION D26-\d+\.pdf/.test(x))), [true]);
await comprobar('12b. y el saludo de Séneca es el de siempre', pagina.inputValue('#seneca-cuerpo-texto').then((t) => /^Estimados tutores legales de /.test(t)), true);
await cerrarCuadro();

/* ===== 10. Otro tipo: «Avisar a la tutoría» ===== */
console.log('--- 10. otro tipo de asunto ---');
await abrirMesa('INCIDENCIA DE AULA Jimenez Rubio');
await abrirComunicar();
await comprobar('10. la tarea «Avisar a la tutoría» y la casilla del tutor de 4º A',
  Promise.all([pagina.locator('.hito-en-mesa .mesa-receta').allTextContents(), pagina.$$eval('.hito-en-mesa .mesa-chip', (c) => c.map((x) => x.textContent.trim()))]),
  [['Avisar a la tutoría'], ['Jimenez Rubio, Mateo', 'Otero Campos, Marta (tutor/a de 4º A)']]);
await pagina.click('.hito-en-mesa .mesa-receta');
await esperarCuadro();
c = await cuadro();
await comprobar('10. el cuadro se abre con la dirección del tutor del grupo y «Buenas:»', [c.otro, c.saludo, c.arriba, c.docs.length], ['motero@correo-demo.es', 'Buenas:', '', 0]);
await comprobar('10. sin plantilla que adjunte: ninguna línea de documentos', c.avisoDoc, '');
await cerrarCuadro();

/* ===== 3. La guía y la plantilla en Ajustes ===== */
console.log('--- 3. la guía y la plantilla ---');
await abrirMesa('SANCION Jimenez Rubio');
await pagina.evaluate(() => HitoMesa.cerrarPanelSiAbierto && HitoMesa.cerrarPanelSiAbierto());
await pagina.locator('.hito-en-mesa .guion-paso').first().locator('.guion-tarea-menu-boton').click();
await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: 'Abrir en la guía' }).click();
await pagina.waitForSelector('#capa:not(.oculto) .paso-guion .guion-fila');
await comprobar('3. en la guía: «Tutor/a del grupo», por correo y la plantilla de la sanción',
  pagina.evaluate(() => {
    const f = document.querySelector('#capa .paso-guion .guion-fila[data-id="g-demo-tutor-avisar"]');
    const sel = (cl) => f.querySelector(cl).selectedOptions[0].textContent;
    return [sel('.guion-receta-a'), sel('.guion-receta-via'), sel('.guion-receta-plantilla')];
  }), ['Tutor/a del grupo', 'Por correo', 'Informar al tutor/a de la sanción (SANCION)']);
await comprobar('3. y la opción ya no se llama «La tutoría»', pagina.evaluate(() => [...document.querySelectorAll('#capa .guion-receta-a option')].map((o) => o.textContent)),
  ['A quien toque', 'El tercero', 'La familia', 'Tutor/a del grupo', 'Los relacionados', 'Otro']);
await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina.waitForTimeout(500);
await pagina.evaluate(async () => {
  const p = (await Plantillas.cargar(App.E.gestor)).lista.filter((x) => /Informar al tutor/.test(x.nombre))[0];
  PlantillasAjustes.abrirCuadroDePlantilla(p, null, () => {});
});
await pagina.waitForSelector('#pl-adjuntar');
await comprobar('3. en Ajustes, la plantilla: «Adjuntar solo» dice NOTIFICACION y ofrece «Nada» y los tipos',
  pagina.evaluate(() => [document.getElementById('pl-adjuntar').value, document.getElementById('pl-adjuntar').options[0].textContent,
    document.getElementById('pl-adjuntar').options.length > 3]), ['NOTIFICACION', 'Nada', true]);
await pagina.selectOption('#pl-adjuntar', '');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(800);
await comprobar('3. guardar con «Nada» quita lo que adjuntaba', pagina.evaluate(async () => (await Plantillas.cargar(App.E.gestor)).lista.filter((x) => /Informar al tutor/.test(x.nombre))[0].adjuntar), undefined);
await pagina.evaluate(async () => {
  const p = (await Plantillas.cargar(App.E.gestor)).lista.filter((x) => /Informar al tutor/.test(x.nombre))[0];
  PlantillasAjustes.abrirCuadroDePlantilla(p, null, () => {});
});
await pagina.waitForSelector('#pl-adjuntar');
await pagina.selectOption('#pl-adjuntar', 'NOTIFICACION');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(800);
await comprobar('3. y se vuelve a poner', pagina.evaluate(async () => (await Plantillas.cargar(App.E.gestor)).lista.filter((x) => /Informar al tutor/.test(x.nombre))[0].adjuntar), 'NOTIFICACION');

/* ===== 11b. «Qué hay de nuevo» ===== */
console.log('--- 11b. novedades ---');
await comprobar('«Qué hay de nuevo» trae la línea del tutor del grupo', pagina.evaluate(() => NOVEDADES[0].id === '299' && /tutor o tutora del grupo/.test(NOVEDADES[0].texto) && NOVEDADES[0].texto.length < 110), true);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
