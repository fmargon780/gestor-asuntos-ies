/* Prueba en navegador de verdad de los campos de cada tipo de asunto
   (docs/CAMPOS-POR-TIPO.md).

   Sin js/campos.js esta prueba falla desde la primera comprobación:
   `#bloque-campos` y `#campos-lista-nuevo` no existen en el HTML viejo,
   el botón "Campos" no está en la fila de un tipo en Ajustes, y
   `App.E.campos` no se llega a rellenar nunca porque `App.cargarCampos`
   no existe. Con el cambio, las ocho comprobaciones de más abajo pasan.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, pero con su
   propio RegAlum.csv: trae Unidad y una columna nueva, "Modalidad de
   Bachillerato", que no viene rellena en el alumnado de la ESO. Así se
   comprueba, con datos reales, que un campo vacío no es un error.

   Corre a 1905 píxeles, el ancho del monitor del trabajo (como
   pruebas/tablon.mjs): con eso se ve si el bloque "Datos del asunto" y
   el cuadro de Campos de Ajustes aprovechan el ancho de verdad. */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const CARPETA_CAPTURAS = process.env.CARPETA_CAPTURAS ||
  path.join('/tmp', 'gestor-asuntos-capturas');
fs.mkdirSync(CARPETA_CAPTURAS, { recursive: true });

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1905, height: 950 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);

/* Fila 105 (docs/AJUSTES-PLEGADO.md): Ajustes nace plegado; esta prueba
   trabaja con las secciones de la pantalla de un tipo ya desplegadas. */
await pagina.addInitScript(() => {
  try {
    const abiertas = {};
    ['datos', 'campos', 'pasos', 'correo', 'word', 'plazo', 'palabras', 'repite']
      .forEach((s) => { abiertas['tipo:' + s] = true; });
    window.localStorage.setItem('gestor-ajustes-plegado', JSON.stringify(abiertas));
  } catch (e) { /* sin localStorage, se queda plegado */ }
});
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

async function leerJson(nombreFichero) {
  return pagina.evaluate(async (n) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const h = await g.getFileHandle(n);
    return JSON.parse(await (await h.getFile()).text());
  }, nombreFichero);
}

async function nombresDeAbiertos() {
  return pagina.evaluate(async () => {
    const n = [];
    for await (const p of window.__disco.abiertos.entries()) n.push(p[0]);
    return n.filter(x => x[0] !== '_');
  });
}

/* Pulsa "Crear el asunto". Varias comprobaciones de este fichero crean,
   a propósito, un segundo asunto del mismo tercero y tipo el mismo día
   (para probar un campo distinto, no para probar duplicados): la
   parada al crear (docs/NO-DUPLICAR-ASUNTOS.md) lo nota y pregunta
   antes de seguir. Aquí se sigue adelante con "Crear otro de todas
   formas", que es la respuesta correcta cuando de verdad se quiere
   otro asunto distinto. */
async function crearAsunto() {
  await pagina.click('#btn-crear');
  await Promise.race([
    pagina.waitForSelector('#pantalla-asunto:not(.oculto)'),
    pagina.waitForSelector('#capa:not(.oculto)')
  ]);
  if (await pagina.locator('#capa:not(.oculto)').isVisible().catch(() => false)) {
    await pagina.click('#cuadro-aceptar');
  }
  /* Fila 119: crear abre la ficha del asunto; se vuelve a la lista. */
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.click('#ficha-volver');
  await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
}

/* ---------- arranque, con un RegAlum de mentira propio ---------- */

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async () => {
  const csv = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;Modalidad de Bachillerato',
    'Ramos Vidal, Elena;1150001;1º de Bachillerato;1º Bach A;2026;Matriculada;05/05/2010;Ciencias',
    'Ferrer Nuño, Iker;1150002;1º de E.S.O.;1º A;2026;Matriculado;10/10/2013;',
    'Blanco Nulo, Marta;1150003;;;2026;Matriculada;01/01/2012;'
  ].join('\r\n') + '\r\n';
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const d = await g.getDirectoryHandle('datos', { create: true });
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', csv));
});

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ================================================================
   1. Configurar SANCION con Unidad (obligatorio, al nombre) y
      Modalidad (opcional, al nombre), desde el cuadro de Ajustes.
   ================================================================ */
console.log('--- 1. configurar los campos de SANCION, en su pantalla de Ajustes ---');

/* Desde el 17-sep-2026 (fila 39, docs/AJUSTES-POR-TIPO.md) "Campos" ya
   no es una entrada del menú de los tres puntos ni un cuadro aparte:
   se pulsa la tarjeta del tipo, que abre su pantalla entera, y la
   sección "Campos" ya está ahí, sin plegar. */
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');
/* Los bloques de "El centro" y "Mantenimiento" son <details> cerrados:
   se abren todos de una vez, y como no se vuelven a crear, se quedan
   abiertos el resto de la prueba (igual que pruebas/navegador.mjs). */
await pagina.evaluate(() => {
  document.querySelectorAll('#pantalla-ajustes details').forEach((d) => { d.open = true; });
});

const tarjetaSancion1 = pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: 'SANCION' });
await tarjetaSancion1.locator('.tarjeta-tipo-nombre').click();
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await pagina.waitForSelector('#campos-puestos');
await comprobar('la pantalla del tipo usa el ancho grande, no un cuadro estrecho',
  pagina.evaluate(() => document.getElementById('pantalla-tipo-asunto').getBoundingClientRect().width > 900), true);

/* Fila 56, 18-sep-2026, docs/CAMPOS-CATALOGO-Y-CALCULADOS.md: el
   catálogo ya no está desplegado en la propia sección, se abre con
   "+ Añadir campo" (pestaña "De la ficha", la que sale de partida). */
await pagina.click('#campos-btn-anadir');
await pagina.waitForSelector('#campos-catalogo-buscar');
await pagina.fill('#campos-catalogo-buscar', 'unidad');
await pagina.locator('#campos-catalogo-ficha-lista .fila-tipo').filter({ hasText: 'Unidad' })
  .getByRole('button', { name: 'Añadir' }).click();
await pagina.fill('#campos-catalogo-buscar', 'modalidad');
await pagina.locator('#campos-catalogo-ficha-lista .fila-tipo').filter({ hasText: 'Modalidad' })
  .getByRole('button', { name: 'Añadir' }).click();
await pagina.click('#campos-catalogo-volver');
await pagina.waitForSelector('#campos-puestos');

await comprobar('los dos campos quedan puestos, en orden',
  pagina.locator('#campos-puestos .fila-tipo .nombre-tipo').allTextContents(),
  ['Unidad', 'Modalidad de Bachillerato']);

const filaUnidad = pagina.locator('#campos-puestos .fila-tipo').filter({ hasText: 'Unidad' });
await filaUnidad.locator('label:has-text("Obligatorio") input').check();
await filaUnidad.locator('label:has-text("Añadir al nombre") input').check();
const filaModalidad = pagina.locator('#campos-puestos .fila-tipo').filter({ hasText: 'Modalidad' });
await filaModalidad.locator('label:has-text("Añadir al nombre") input').check();

await pagina.locator('.tipo-asunto-seccion').filter({ hasText: 'Campos' }).screenshot({
  path: path.join(CARPETA_CAPTURAS, 'campos-cuadro-ajustes.png')
});

await pagina.click('#campos-guardar');
await pagina.waitForTimeout(300);

await comprobar('campos.json guarda la configuración de SANCION', leerJson('campos.json').then(j => j.porTipo.SANCION), [
  { origen: 'fichero', columna: 'Unidad', obligatorio: true, enNombre: true },
  { origen: 'fichero', columna: 'Modalidad de Bachillerato', obligatorio: false, enNombre: true }
]);

/* ================================================================
   2. Crear el asunto: los dos campos salen rellenos, y el nombre
      los lleva en ese orden.
   ================================================================ */
console.log('--- 2. crear un asunto: los dos campos salen rellenos ---');

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.getByRole('button', { name: 'SANCION', exact: true }).click();
await pagina.fill('#buscar-tercero', 'ramos vidal');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.waitForSelector('#bloque-campos:not(.oculto)');

await comprobar('salen las dos filas de campos',
  pagina.locator('#campos-lista-nuevo .campo-fila').count(), 2);
await comprobar('Unidad sale marcada como obligatoria y ya rellena',
  pagina.evaluate(() => {
    const filas = document.querySelectorAll('#campos-lista-nuevo .campo-fila');
    return { etiqueta: filas[0].querySelector('.etiqueta').textContent, valor: filas[0].querySelector('input,select').value };
  }), { etiqueta: 'Unidad *', valor: '1º Bach A' });
await comprobar('Modalidad sale opcional y ya rellena',
  pagina.evaluate(() => {
    const filas = document.querySelectorAll('#campos-lista-nuevo .campo-fila');
    return { etiqueta: filas[1].querySelector('.etiqueta').textContent, valor: filas[1].querySelector('input,select').value };
  }), { etiqueta: 'Modalidad de Bachillerato', valor: 'Ciencias' });

await pagina.fill('#campo-fecha', '2026-09-11');
await pagina.fill('#campo-curso', '');
await pagina.waitForTimeout(150);

await pagina.locator('.formulario').screenshot({
  path: path.join(CARPETA_CAPTURAS, 'campos-datos-del-asunto.png')
});

await comprobar('el nombre lleva los dos campos, en el orden de Ajustes',
  pagina.locator('#vista-nombre').textContent(),
  '260911 SANCION 1º Bach A Ciencias Ramos Vidal, Elena 1150001');

await crearAsunto();
await comprobar('la carpeta se crea con ese nombre', nombresDeAbiertos(),
  ['260911 SANCION 1º Bach A Ciencias Ramos Vidal, Elena 1150001']);
await comprobar('la ficha guarda los dos valores', leerJson('asuntos.json').then(j =>
  j.asuntos['260911 SANCION 1º Bach A Ciencias Ramos Vidal, Elena 1150001'].campos), {
  'fichero:Unidad': { valor: '1º Bach A', enNombre: true },
  'fichero:Modalidad de Bachillerato': { valor: 'Ciencias', enNombre: true }
});

/* ================================================================
   3. Desmarcar "Añadir al nombre" en Modalidad: la carpeta se crea
      sin ella, pero el valor se guarda en asuntos.json.
   ================================================================ */
console.log('--- 3. sin marcar "Añadir al nombre" en Modalidad ---');

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.getByRole('button', { name: 'SANCION', exact: true }).click();
await pagina.fill('#buscar-tercero', 'ramos vidal');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.waitForSelector('#bloque-campos:not(.oculto)');
await pagina.fill('#campo-fecha', '2026-09-11');
await pagina.fill('#campo-curso', '');

await pagina.evaluate(() => {
  const filas = document.querySelectorAll('#campos-lista-nuevo .campo-fila');
  filas[1].querySelector('.interruptor-fila input').click();
});
await pagina.waitForTimeout(150);

await comprobar('el nombre ya no lleva la modalidad',
  pagina.locator('#vista-nombre').textContent(),
  '260911 SANCION 1º Bach A Ramos Vidal, Elena 1150001');

await crearAsunto();
await comprobar('la carpeta se crea sin la modalidad en el nombre',
  nombresDeAbiertos().then(n => n.indexOf('260911 SANCION 1º Bach A Ramos Vidal, Elena 1150001') !== -1), true);
await comprobar('pero el valor de la modalidad se ha guardado igual', leerJson('asuntos.json').then(j =>
  j.asuntos['260911 SANCION 1º Bach A Ramos Vidal, Elena 1150001'].campos['fichero:Modalidad de Bachillerato']),
  { valor: 'Ciencias', enNombre: false });

/* ================================================================
   4. Un alumno de la ESO, con la Modalidad vacía: el campo sale
      vacío, deja crear el asunto y el nombre no lleva doble espacio.
   ================================================================ */
console.log('--- 4. la ESO no tiene modalidad: el campo sale vacío ---');

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.getByRole('button', { name: 'SANCION', exact: true }).click();
await pagina.fill('#buscar-tercero', 'ferrer nuño');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.waitForSelector('#bloque-campos:not(.oculto)');
await pagina.fill('#campo-fecha', '2026-09-12');
await pagina.fill('#campo-curso', '');
await pagina.waitForTimeout(150);

await comprobar('la modalidad sale en blanco, no es un error',
  pagina.evaluate(() => document.querySelectorAll('#campos-lista-nuevo .campo-fila')[1]
    .querySelector('input,select').value), '');
await comprobar('el nombre no lleva doble espacio',
  pagina.locator('#vista-nombre').textContent(),
  '260912 SANCION 1º A Ferrer Nuño, Iker 1150002');

await crearAsunto();
await comprobar('deja crear el asunto igual',
  nombresDeAbiertos().then(n => n.indexOf('260912 SANCION 1º A Ferrer Nuño, Iker 1150002') !== -1), true);

/* ================================================================
   5. Con Unidad obligatoria y vacía, no deja crear y dice qué falta.
   ================================================================ */
console.log('--- 5. Unidad obligatoria y vacía: no deja crear ---');

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.getByRole('button', { name: 'SANCION', exact: true }).click();
await pagina.fill('#buscar-tercero', 'blanco nulo');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.waitForSelector('#bloque-campos:not(.oculto)');
await pagina.fill('#campo-fecha', '2026-09-13');
await pagina.fill('#campo-curso', '');

await comprobar('la Unidad de Marta sale vacía',
  pagina.evaluate(() => document.querySelectorAll('#campos-lista-nuevo .campo-fila')[0]
    .querySelector('input,select').value), '');

await pagina.click('#btn-crear');
await pagina.waitForTimeout(200);
await comprobar('no se sale del formulario', pagina.locator('#pantalla-nuevo').isHidden(), false);
await comprobar('el aviso dice qué falta',
  pagina.locator('#mensajes').textContent().then(t => t.indexOf('Unidad') !== -1), true);
await comprobar('el foco va al campo que falta',
  pagina.evaluate(() => {
    const primero = document.querySelectorAll('#campos-lista-nuevo .campo-fila')[0].querySelector('input,select');
    return document.activeElement === primero;
  }), true);
await comprobar('no se ha creado ninguna carpeta para Marta',
  nombresDeAbiertos().then(n => n.some(x => x.indexOf('Blanco Nulo') !== -1)), false);

/* ================================================================
   6. El campo calculado Curso: 1ºBachA da 1ºBach y 1ºA da 1º.
   ================================================================ */
console.log('--- 6. el campo calculado Curso ---');

await comprobar('1ºBachA dice 1ºBach', pagina.evaluate(() => Campos.calcularCurso('1ºBachA')), '1ºBach');
await comprobar('1ºA dice 1º', pagina.evaluate(() => Campos.calcularCurso('1ºA')), '1º');
await comprobar('un espacio sobrante se limpia', pagina.evaluate(() => Campos.calcularCurso('2ºFPB B')), '2ºFPB');

/* ================================================================
   7. Un campo propio de lista cerrada sale como desplegable, y su
      valor entra en el nombre.
   ================================================================ */
console.log('--- 7. un campo propio de lista cerrada ---');

/* El catálogo de campos propios vive en "El centro" desde la fila 39
   (docs/AJUSTES-POR-TIPO.md). */
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.click('[data-ajustes-pestana="centro"]');
await pagina.fill('#nuevo-propio', 'Trimestre');
await pagina.selectOption('#nueva-clase-propio', 'lista');
await pagina.click('#btn-anadir-propio');
await pagina.waitForSelector('#propio-valores-alta');
await pagina.fill('#propio-valores-alta', '1º\n2º\n3º');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(200);
await comprobar('el campo propio queda en la lista',
  pagina.locator('#tabla-propios .fila-tipo').filter({ hasText: 'Trimestre' }).locator('.suave').textContent(),
  '1º, 2º, 3º');

await pagina.click('[data-ajustes-pestana="tipos"]');
const tarjetaSancion2 = pagina.locator('#tabla-tipos .tarjeta-tipo').filter({ hasText: 'SANCION' });
await tarjetaSancion2.locator('.tarjeta-tipo-nombre').click();
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await pagina.waitForSelector('#campos-puestos');
await pagina.click('#campos-btn-anadir');
await pagina.waitForSelector('.pestana-categoria[data-pestana="mios"]');
await pagina.click('.pestana-categoria[data-pestana="mios"]');
await pagina.locator('#campos-mios-lista .fila-tipo').filter({ hasText: 'Trimestre' })
  .getByRole('button', { name: 'Añadir' }).click();
await pagina.click('#campos-catalogo-volver');
await pagina.waitForSelector('#campos-puestos');
await pagina.locator('#campos-puestos .fila-tipo').filter({ hasText: 'Trimestre' })
  .locator('label:has-text("Añadir al nombre") input').check();
await pagina.click('#campos-guardar');
await pagina.waitForTimeout(200);

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.getByRole('button', { name: 'SANCION', exact: true }).click();
await pagina.fill('#buscar-tercero', 'ferrer nuño');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.waitForSelector('#bloque-campos:not(.oculto)');
await pagina.fill('#campo-fecha', '2026-09-14');
await pagina.fill('#campo-curso', '');

await comprobar('el campo propio sale como desplegable',
  pagina.evaluate(() => document.querySelectorAll('#campos-lista-nuevo .campo-fila')[2]
    .querySelector('select') ? 'select' : 'otra cosa'), 'select');

await pagina.evaluate(() => {
  const sel = document.querySelectorAll('#campos-lista-nuevo .campo-fila')[2].querySelector('select');
  sel.value = '2º';
  sel.dispatchEvent(new Event('change'));
});
await pagina.waitForTimeout(150);

await comprobar('su valor entra en el nombre',
  pagina.locator('#vista-nombre').textContent(),
  '260914 SANCION 1º A 2º Ferrer Nuño, Iker 1150002');

await crearAsunto();
await comprobar('la carpeta lleva el trimestre elegido',
  nombresDeAbiertos().then(n => n.indexOf('260914 SANCION 1º A 2º Ferrer Nuño, Iker 1150002') !== -1), true);

/* ================================================================
   8. Un tipo sin campos configurados crea el asunto exactamente
      igual que antes.
   ================================================================ */
console.log('--- 8. un tipo sin campos, igual que siempre ---');

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.getByRole('button', { name: 'MATRICULA', exact: true }).click();
await pagina.fill('#buscar-tercero', 'ramos vidal');
await pagina.waitForSelector('#resultados-tercero .resultado');
await pagina.click('#resultados-tercero .resultado');
await pagina.waitForTimeout(200);

await comprobar('el bloque de campos no se enseña', pagina.locator('#bloque-campos').isHidden(), true);
await pagina.fill('#campo-fecha', '2026-09-15');
await pagina.fill('#campo-curso', '');
await pagina.uncheck('#campo-grupo').catch(() => {});
await pagina.waitForTimeout(150);
await comprobar('el nombre se monta como siempre, sin ningún campo de más',
  pagina.locator('#vista-nombre').textContent(),
  '260915 MATRICULA Ramos Vidal, Elena 1150001');
await crearAsunto();
await comprobar('se crea igual que antes de este cambio',
  nombresDeAbiertos().then(n => n.indexOf('260915 MATRICULA Ramos Vidal, Elena 1150001') !== -1), true);

/* ================================================================
   9. Editar el asunto cambiando un campo renombra la carpeta y la
      ficha viaja con ella.
   ================================================================ */
console.log('--- 9. editar un asunto cambiando un campo ---');

const NOMBRE_ORIGINAL = '260911 SANCION 1º Bach A Ciencias Ramos Vidal, Elena 1150001';
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.locator('.tarjeta').filter({ hasText: NOMBRE_ORIGINAL }).locator('.nombre-pulsable').click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
/* "Editar" vive ahora en el menú de tres puntos del nombre (18-sep-2026,
   fila 52, docs/CABECERA-DEL-ASUNTO.md). */
await pagina.click('.ficha-nombre-menu-boton');
await pagina.getByRole('button', { name: 'Editar el asunto', exact: true }).click();
await pagina.waitForSelector('#ed-campos');

await comprobar('el cuadro de editar trae los mismos campos, con lo guardado',
  pagina.evaluate(() => Array.from(document.querySelectorAll('#ed-campos .campo-fila')).map(f => ({
    etiqueta: f.querySelector('.etiqueta').textContent.trim(),
    valor: f.querySelector('input,select').value
  }))), [
    { etiqueta: 'Unidad *', valor: '1º Bach A' },
    { etiqueta: 'Modalidad de Bachillerato', valor: 'Ciencias' },
    { etiqueta: 'Trimestre', valor: '' }
  ]);

await pagina.fill('#ed-campo-0', '2º Bach B');
await pagina.waitForTimeout(150);
await comprobar('la vista previa recoge el cambio',
  pagina.locator('#ed-vista').textContent(),
  '260911 SANCION 2º Bach B Ciencias Ramos Vidal, Elena 1150001');

await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(400);

const nombresTrasEditar = await nombresDeAbiertos();
await comprobar('la carpeta vieja ya no está',
  nombresTrasEditar.indexOf(NOMBRE_ORIGINAL) === -1, true);
await comprobar('la carpeta nueva sí está',
  nombresTrasEditar.indexOf('260911 SANCION 2º Bach B Ciencias Ramos Vidal, Elena 1150001') !== -1, true);
await comprobar('la ficha ha viajado con el campo cambiado', leerJson('asuntos.json').then(j => {
  const f = j.asuntos['260911 SANCION 2º Bach B Ciencias Ramos Vidal, Elena 1150001'];
  return f && f.campos && f.campos['fichero:Unidad'];
}), { valor: '2º Bach B', enNombre: true });

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
console.log('Capturas en: ' + CARPETA_CAPTURAS);
await navegador.close();
process.exit(fallos ? 1 : 0);
