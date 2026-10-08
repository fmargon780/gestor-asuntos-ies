/* Fila 303 (docs/CARPETAS-PERDIDAS-QUE-ESTAN-ARCHIVADAS.md): la app encuentra sola la carpeta de los asuntos que han
   perdido la suya, también si está en el ARCHIVO, y los enlaza con un botón; «Buscar su carpeta» busca entre todas.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. El bloque «La app ha encontrado la carpeta de 2 de ellos»: dos filas marcadas, «Enlazar los N» sigue a las casillas.
   2. Enlazar los dos: aviso verde con «Deshacer»; el asunto del ARCHIVO queda archivado con las notas de los dos y sus hitos;
      el otro, con el nombre de su carpeta y sus hitos.
   3. «Deshacer» lo devuelve todo a como estaba.
   4. «Buscar su carpeta»: el buscador, el ARCHIVO, y sin aviso de que no hay carpetas.
   5. Una carpeta que ya tiene asunto: aviso de que se unen en uno, «Unir y enlazar»; la unión y su «Deshacer».
   6. Índice del ARCHIVO sin hacer, y dos carpetas que encajan (empate).
   7. Solo consulta: el bloque se ve y «Enlazar los N» sale apagado.
   8. Si uno falla, los demás siguen y el aviso sale en ámbar diciendo cuál no.
   9. La causa (apartado 7): al cambiarle el nombre a un tipo, la ficha de cada asunto abierto se muda con su carpeta;
      no se queda una copia con el nombre viejo, que sería un asunto sin carpeta. */
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
async function nuevaPagina(extra) {
  const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1100 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); " + (extra || '') + " } catch (e) {}");
  await pagina.goto(DIRECCION);
  await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
  await pagina.waitForFunction(() => window.Problemas && Problemas.ids().includes('carpetas'), null, { timeout: 30000 });
  await pagina.waitForTimeout(1200);
  await pagina.evaluate(() => { App.ir('ajustes'); App.cambiarPestanaAjustes('problemas'); });
  return pagina;
}
const esperarBloque = (p) => p.waitForSelector('#problema-carpetas-enlazar-todos', { timeout: 30000 });

/* La carpeta archivada de Lucas, por dentro. */
const porDentro = (pagina) => pagina.evaluate(async () => {
  const cat = await App.E.archivo.getDirectoryHandle('ALUMNADO');
  let persona = null;
  for await (const [n, h] of cat.entries()) if (n.includes('Navarro Pons')) persona = h;
  let carpeta = null, nombre = '';
  for await (const [n, h] of persona.entries()) if (n.includes('TRAS. MATR. VIVA')) { carpeta = h; nombre = n; }
  const ficha = await FichaArchivo.leer(carpeta);
  let historial = null;
  try { historial = await Carpetas.leerTexto(carpeta, Hitos.NOMBRE_HISTORIAL); } catch (e) { historial = null; }
  const indice = await IndiceArchivo.leerDisco({ todos: true });
  return {
    nombre, estado: ficha && ficha.estado, notas: ficha ? (ficha.notas || []).map((n) => n.texto) : null,
    historial: historial ? historial.includes('Enviar el expediente al otro centro') : null,
    enIndice: indice.ok ? indice.datos.asuntos.some((a) => a.nombre === nombre) : null
  };
});

const estadoRegistro = (pagina, palabra) => pagina.evaluate(async (w) => {
  await App.cargarRegistro();
  const claves = Object.keys(App.E.registro.asuntos).filter((k) => k.includes(w));
  const d = await Hitos.leer();
  return { claves, hitos: Object.keys(d.porAsunto).filter((k) => k.includes(w)).map((k) => [k, d.porAsunto[k].hitos.map((h) => h.titulo)]) };
}, palabra);

const pagina = await nuevaPagina();

/* ================= 1. EL BLOQUE ================= */

console.log('--- 1. el bloque con lo que la app ha encontrado ---');
await esperarBloque(pagina);
const bloque = pagina.locator('[data-problema="carpetas"] .problema-bloque');
await comprobar('1. el título del bloque', bloque.locator('.problema-bloque-titulo').textContent(), 'La app ha encontrado la carpeta de 2 de ellos');
await comprobar('1. dos filas, las dos con la casilla marcada',
  bloque.locator('.problema-bloque-fila').evaluateAll((fs) => fs.map((f) => f.querySelector('input').checked)), [true, true]);
await comprobar('1. una dice «En asuntos abiertos» y la otra «En el ARCHIVO»',
  bloque.locator('.problema-bloque-fila').evaluateAll((fs) => fs.map((f) => /En asuntos abiertos/.test(f.textContent) ? 'abiertos' : /En el ARCHIVO/.test(f.textContent) ? 'archivo' : '?')), ['abiertos', 'archivo']);
await comprobar('1. la del ARCHIVO enseña su carpeta con el tipo abreviado, dice que ya tiene su asunto y que queda archivado con un hito sin hacer',
  bloque.locator('.problema-bloque-fila').nth(1).evaluate((f) => [f.textContent.includes('Su carpeta: ') && f.textContent.includes('TRAS. MATR. VIVA'), f.textContent.includes('Ya tiene su asunto: se unen en uno.'), f.textContent.includes('Queda archivado con 1 hito sin hacer.')]),
  [true, true, true]);
await comprobar('1. el tercer asunto (sin carpeta en ningún sitio) no está en el bloque y sigue debajo, en «Asunto por asunto»',
  pagina.evaluate(() => [document.querySelector('[data-problema="carpetas"] .problema-bloque').textContent.includes('Rubio Luna'),
    [...document.querySelectorAll('[data-problema="carpetas"] .problema-elemento .problema-nombre')].map((e) => e.textContent.includes('Rubio Luna'))]),
  [false, [false, false, true]]);
await comprobar('1. el botón dice «Enlazar los 2»', pagina.locator('#problema-carpetas-enlazar-todos').textContent(), 'Enlazar los 2');
await bloque.locator('.problema-bloque-casilla').first().uncheck();
await comprobar('1. al desmarcar una casilla dice «Enlazar 1»', pagina.locator('#problema-carpetas-enlazar-todos').textContent(), 'Enlazar 1');
await bloque.locator('.problema-bloque-casilla').nth(1).uncheck();
await comprobar('1. sin ninguna marcada está apagado', pagina.locator('#problema-carpetas-enlazar-todos').isDisabled(), true);
await bloque.locator('.problema-bloque-casilla').first().check();
await bloque.locator('.problema-bloque-casilla').nth(1).check();
await comprobar('1. con las dos marcadas, otra vez «Enlazar los 2»', pagina.locator('#problema-carpetas-enlazar-todos').textContent(), 'Enlazar los 2');

const antes = await porDentro(pagina);
await comprobar('1. (antes) la carpeta archivada tiene su ficha con una nota y ni historial de hitos', [antes.estado, antes.notas.length, antes.historial, antes.enIndice], ['cerrado', 1, null, true]);
const antesRegistro = { lucas: await estadoRegistro(pagina, 'Navarro Pons'), ferre: await estadoRegistro(pagina, 'Ferreter') };

/* ================= 2. ENLAZAR LOS DOS ================= */

console.log('--- 2. enlazar los dos ---');
await pagina.click('#problema-carpetas-enlazar-todos');
await pagina.waitForFunction(() => /2 asuntos enlazados con su carpeta\./.test(document.getElementById('mensajes').textContent), null, { timeout: 30000 });
await comprobar('2. aviso verde con «Deshacer»',
  pagina.evaluate(() => { const m = [...document.querySelectorAll('#mensajes .mensaje')].find((x) => /enlazados/.test(x.textContent)); return [m.className.includes('bueno'), !!m.querySelector('.mensaje-boton') && m.querySelector('.mensaje-boton').textContent]; }),
  [true, 'Deshacer']);
await pagina.waitForFunction(() => /1 asunto ha perdido su carpeta/.test(document.querySelector('[data-problema="carpetas"] .problema-titulo').textContent), null, { timeout: 20000 });
await comprobar('2. la tarjeta pasa a decir «1 asunto ha perdido su carpeta»', pagina.locator('[data-problema="carpetas"] .problema-titulo').textContent(), '1 asunto ha perdido su carpeta');
await pagina.waitForFunction(() => !/Buscando/.test(document.querySelector('[data-problema="carpetas"]').textContent), null, { timeout: 20000 });
await comprobar('2. ya no sale el bloque (el que queda no tiene carpeta en ningún sitio)', pagina.locator('[data-problema="carpetas"] .problema-bloque').count(), 0);

const despues = await porDentro(pagina);
await comprobar('2. el asunto del ARCHIVO queda archivado en su carpeta, con las notas de los dos, el historial de sus hitos y su entrada en el índice',
  [despues.estado, despues.notas.length, despues.notas.some((t) => t.includes('Nota de la carpeta archivada')), despues.notas.some((t) => t.includes('Nota del asunto perdido')), despues.historial, despues.enIndice],
  ['cerrado', 2, true, true, true, true]);
await comprobar('2. la carpeta no ha cambiado de nombre', despues.nombre, antes.nombre);
await comprobar('2. su clave y sus hitos han salido de asuntos.json y de hitos.json', estadoRegistro(pagina, 'Navarro Pons'), { claves: [], hitos: [] });
const ferre = await estadoRegistro(pagina, 'Ferreter');
await comprobar('2. el otro asunto tiene el nombre de su carpeta y sus hitos',
  [ferre.claves.length, ferre.claves[0].includes('FACTURAS'), ferre.hitos.length, ferre.hitos[0][1]], [1, true, 1, ['Recibir la factura']]);

await pagina.click('.pestana[data-pantalla="archivo"]');
await pagina.waitForSelector('#buscar-archivo');
await pagina.fill('#buscar-archivo', 'Navarro Pons');
await pagina.waitForTimeout(800);
await comprobar('2. en «Archivo», buscando a la persona, sale el asunto con el nombre de la carpeta',
  pagina.evaluate(() => document.getElementById('lista-archivo').textContent.includes('TRAS. MATR. VIVA')), true);
await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.waitForTimeout(600);
await comprobar('2. en Inicio, el otro asunto está entre los abiertos con el nombre de su carpeta',
  pagina.evaluate(() => App.E.listaAbiertos.some((a) => a.nombre.includes('FACTURAS Ferreteria'))), true);

/* ================= 3. DESHACER ================= */

console.log('--- 3. deshacer (en una copia nueva de la demostración) ---');
await pagina.close();
const pb = await nuevaPagina();
await esperarBloque(pb);
const antesB = await porDentro(pb);
const antesRegistroB = { lucas: await estadoRegistro(pb, 'Navarro Pons'), ferre: await estadoRegistro(pb, 'Ferreter') };
await pb.click('#problema-carpetas-enlazar-todos');
await pb.waitForFunction(() => /2 asuntos enlazados con su carpeta\./.test(document.getElementById('mensajes').textContent), null, { timeout: 30000 });
await pb.locator('#mensajes .mensaje-boton', { hasText: 'Deshacer' }).click();
await pb.waitForFunction(() => /3 asuntos han perdido su carpeta/.test(document.querySelector('[data-problema="carpetas"] .problema-titulo').textContent), null, { timeout: 30000 });
await comprobar('3. la tarjeta vuelve a decir «3 asuntos han perdido su carpeta»', pb.locator('[data-problema="carpetas"] .problema-titulo').textContent(), '3 asuntos han perdido su carpeta');
const vuelto = await porDentro(pb);
await comprobar('3. la carpeta archivada, con su ficha y su índice como eran, y sin historial de hitos',
  [vuelto.estado, vuelto.notas, vuelto.historial, vuelto.enIndice], [antesB.estado, antesB.notas, null, true]);
await comprobar('3. los asuntos y sus hitos, de vuelta con su nombre de antes',
  [await estadoRegistro(pb, 'Navarro Pons'), await estadoRegistro(pb, 'Ferreter')], [antesRegistroB.lucas, antesRegistroB.ferre]);
await esperarBloque(pb);
await comprobar('3. el bloque vuelve a salir con sus dos filas', pb.locator('[data-problema="carpetas"] .problema-bloque-fila').count(), 2);

/* ================= 4. «BUSCAR SU CARPETA» ================= */

console.log('--- 4. el buscador ---');
const tercero = pb.locator('[data-problema="carpetas"] .problema-elemento', { hasText: 'Rubio Luna' });
await tercero.getByRole('button', { name: 'Buscar su carpeta (lo normal)' }).click();
await pb.waitForSelector('#huerfana-buscar');
await comprobar('4. el cuadro tiene la caja «Buscar entre todas las carpetas…» y no avisa de que no hay carpetas',
  pb.evaluate(() => [document.getElementById('huerfana-buscar').placeholder, document.getElementById('cuadro-cuerpo').textContent.includes('No hay ninguna carpeta sin asunto')]),
  ['Buscar entre todas las carpetas…', false]);
await comprobar('4. sin escribir salen carpetas (abiertas y del ARCHIVO), como mucho 30',
  pb.evaluate(() => { const n = document.querySelectorAll('#huerfana-destino input[type=radio]').length; return [n > 0 && n <= 30, document.getElementById('cuadro-cuerpo').textContent.includes('En el ARCHIVO'), document.getElementById('cuadro-cuerpo').textContent.includes('En asuntos abiertos')]; }),
  [true, true, true]);
await pb.fill('#huerfana-buscar', 'noelia');
await pb.waitForTimeout(500);
await comprobar('4. escribiendo una palabra del nombre sale esa carpeta, con «En el ARCHIVO», su categoría y su persona',
  pb.evaluate(() => [document.querySelectorAll('#huerfana-destino input[type=radio]').length, document.getElementById('huerfana-destino').textContent.includes('CONVALIDACION'),
    document.getElementById('huerfana-destino').textContent.includes('En el ARCHIVO · ALUMNADO / Santos Gil, Noelia 2100777')]), [1, true, true]);
await pb.waitForFunction(() => /sin documentos/.test(document.getElementById('huerfana-destino').textContent), null, { timeout: 10000 });
await comprobar('4. solo de la elegida cuenta los documentos (no cuenta la ficha de la propia app)', pb.locator('#huerfana-destino').textContent().then((t) => /sin documentos/.test(t)), true);
await pb.fill('#huerfana-buscar', 'noelia zzzz');
await pb.waitForTimeout(400);
await comprobar('4. dos palabras que no están juntas en ningún nombre: no sale ninguna y el cuadro lo dice',
  pb.evaluate(() => [document.querySelectorAll('#huerfana-destino input[type=radio]').length, document.getElementById('huerfana-destino').textContent]),
  [0, 'Ninguna carpeta tiene todas esas palabras.']);

console.log('--- 5. una carpeta que ya tiene asunto ---');
const otroAbierto = await pb.evaluate(async () => {
  await App.cargarRegistro();
  return App.E.listaAbiertos.map((a) => a.nombre).filter((n) => App.E.registro.asuntos[n] && !n.includes('FACTURAS Ferreteria'))[0];
});
await pb.fill('#huerfana-buscar', otroAbierto);
await pb.waitForTimeout(500);
await comprobar('5. sale el aviso de que se unen en uno y el botón dice «Unir y enlazar»',
  pb.evaluate(() => [document.getElementById('huerfana-union').textContent.startsWith('Esta carpeta ya tiene su asunto. Se unen en uno'), document.getElementById('cuadro-aceptar').textContent]),
  [true, 'Unir y enlazar']);
const registroAntes = await pb.evaluate(async () => { await App.cargarRegistro(); return JSON.stringify(App.E.registro.asuntos); });
await pb.click('#cuadro-cancelar');
await pb.waitForTimeout(500);
await comprobar('5. «Cancelar» no cambia nada', pb.evaluate(async () => { await App.cargarRegistro(); return JSON.stringify(App.E.registro.asuntos); }), registroAntes);

/* La unión de verdad, y su «Deshacer»: el asunto perdido de Lucas con un asunto abierto que ya tiene el suyo. */
const union = await pb.evaluate(async (destino) => {
  await App.cargarRegistro();
  const lucas = Object.keys(App.E.registro.asuntos).find((k) => k.includes('Navarro Pons'));
  const instantanea = async () => { await App.cargarRegistro(); const d = await Hitos.leer(); return JSON.stringify([App.E.registro.asuntos[lucas], App.E.registro.asuntos[destino], d.porAsunto[lucas], d.porAsunto[destino]]); };
  const antes = await instantanea();
  const foto = await CarpetasPerdidasEnlazar.enlazarUno(lucas, { nombre: destino, donde: 'abiertos', tieneAsunto: true });
  await App.cargarRegistro();
  const d = await Hitos.leer();
  const unido = App.E.registro.asuntos[destino];
  const tras = {
    caso: foto.caso, lucasFuera: !App.E.registro.asuntos[lucas], hitosLucasFuera: !d.porAsunto[lucas],
    notaDeLucas: (unido.notas || []).some((n) => n.texto.includes('Nota del asunto perdido')),
    hitosDeLucas: d.porAsunto[destino].hitos.some((h) => h.titulo === 'Enviar el expediente al otro centro')
  };
  await CarpetasPerdidasEnlazar.deshacerUno(foto);
  return { tras, igual: (await instantanea()) === antes };
}, otroAbierto);
await comprobar('5. unir con un asunto abierto: caso b, lleva sus notas y sus hitos, y el asunto perdido desaparece',
  union.tras, { caso: 'b', lucasFuera: true, hitosLucasFuera: true, notaDeLucas: true, hitosDeLucas: true });
await comprobar('5. «Deshacer» lo deja todo como estaba', union.igual, true);
await pb.waitForTimeout(500);
await pb.close();

/* ================= 6. SIN ÍNDICE, Y DOS QUE ENCAJAN ================= */

console.log('--- 6. índice sin hacer, y empate ---');
const sinIndice = await nuevaPagina();
await esperarBloque(sinIndice);
await sinIndice.evaluate(async () => { await App.E.gestor.removeEntry('indice-archivo.json'); });
await sinIndice.evaluate(() => FichasHuerfanas._buscarSiToca(true));
await sinIndice.waitForFunction(() => document.querySelectorAll('[data-problema="carpetas"] .problema-bloque-fila').length >= 1 && !/Buscando/.test(document.querySelector('[data-problema="carpetas"]').textContent), null, { timeout: 30000 });
await comprobar('6. sin el índice, la carpeta de la persona se lee directamente y el bloque sigue teniendo las dos filas',
  sinIndice.locator('[data-problema="carpetas"] .problema-bloque-fila').count(), 2);
await sinIndice.locator('[data-problema="carpetas"] .problema-elemento', { hasText: 'Rubio Luna' }).getByRole('button', { name: 'Buscar su carpeta (lo normal)' }).click();
await sinIndice.waitForSelector('#huerfana-buscar');
await comprobar('6. el cuadro dice que el ARCHIVO no está leído entero, con el botón para leerlo',
  sinIndice.evaluate(() => [document.getElementById('huerfana-sin-indice').textContent.startsWith('El ARCHIVO no está leído entero: de lo archivado solo busco en la carpeta de esta persona.'), !!document.getElementById('huerfana-reconstruir')]),
  [true, true]);
await sinIndice.fill('#huerfana-buscar', 'noelia');
await sinIndice.waitForTimeout(400);
await comprobar('6. de lo archivado solo busca en la carpeta de esta persona (la de otra no sale)',
  sinIndice.locator('#huerfana-destino input[type=radio]').count(), 0);
await sinIndice.click('#cuadro-cancelar');

/* Dos carpetas de la misma persona que encajan: ninguna se propone, y en el cuadro salen las dos arriba. */
await sinIndice.evaluate(async () => {
  const cat = await App.E.archivo.getDirectoryHandle('ALUMNADO');
  let persona = null, existente = '';
  for await (const [n, h] of cat.entries()) if (n.includes('Navarro Pons')) persona = h;
  for await (const [n] of persona.entries()) if (n.includes('TRAS. MATR. VIVA')) existente = n;
  await Carpetas.crear(persona, existente.replace('TRAS. MATR. VIVA', 'TRASLADO MATR. VIVA'));
});
await sinIndice.evaluate(() => FichasHuerfanas._buscarSiToca(true));
await sinIndice.waitForFunction(() => document.querySelectorAll('[data-problema="carpetas"] .problema-bloque-fila').length === 1 && !/Buscando/.test(document.querySelector('[data-problema="carpetas"]').textContent), null, { timeout: 30000 });
await comprobar('6. con dos carpetas que encajan, a ese asunto no se le propone ninguna (el bloque queda con una sola fila)',
  sinIndice.locator('[data-problema="carpetas"] .problema-bloque-fila').count(), 1);
await sinIndice.locator('[data-problema="carpetas"] .problema-elemento', { hasText: 'Navarro Pons' }).getByRole('button', { name: 'Buscar su carpeta (lo normal)' }).click();
await sinIndice.waitForSelector('#huerfana-buscar');
await comprobar('6. en el cuadro salen las dos arriba, sin «Parece esta:»',
  sinIndice.evaluate(() => { const r = [...document.querySelectorAll('#huerfana-destino label')].slice(0, 2).map((l) => /TRAS/.test(l.textContent)); return [r.length === 2, document.getElementById('cuadro-cuerpo').textContent.includes('Parece esta:'),
    [...document.querySelectorAll('#huerfana-destino strong')].slice(0, 2).every((e) => /TRAS(LADO|\.) MATR\. VIVA/.test(e.textContent))]; }),
  [true, false, true]);
await sinIndice.click('#cuadro-cancelar');
await sinIndice.close();

/* ================= 7. SOLO CONSULTA ================= */

console.log('--- 7. solo consulta ---');
const consulta = await nuevaPagina("localStorage.setItem('gestor.soloConsulta', '1');");
await esperarBloque(consulta);
await consulta.waitForTimeout(500);
await comprobar('7. el bloque se ve y «Enlazar los 2» está apagado',
  consulta.evaluate(() => [document.querySelectorAll('[data-problema="carpetas"] .problema-bloque-fila').length, document.getElementById('problema-carpetas-enlazar-todos').textContent, document.getElementById('problema-carpetas-enlazar-todos').disabled]),
  [2, 'Enlazar los 2', true]);
await comprobar('7. y nada se ha escrito', consulta.evaluate(async () => { await App.cargarRegistro(); return Object.keys(App.E.registro.asuntos).some((k) => k.includes('Navarro Pons')); }), true);
await consulta.close();

/* ================= 8. SI UNO FALLA, LOS DEMÁS SIGUEN ================= */

console.log('--- 8. uno falla ---');
const falla = await nuevaPagina();
await esperarBloque(falla);
await falla.evaluate(async () => {   /* el compañero lo quita desde el otro ordenador mientras se mira la lista */
  const k = Object.keys(App.E.registro.asuntos).find((x) => x.includes('Navarro Pons'));
  await App.guardarRegistroFresco((r) => { delete r.asuntos[k]; });
});
await falla.click('#problema-carpetas-enlazar-todos');
await falla.waitForFunction(() => /No he podido enlazar/.test(document.getElementById('mensajes').textContent), null, { timeout: 30000 });
await comprobar('8. aviso ámbar: uno enlazado y cuál no, con el motivo',
  falla.evaluate(() => { const m = [...document.querySelectorAll('#mensajes .mensaje')].find((x) => /No he podido enlazar/.test(x.textContent)); return [m.className.includes('ambar'), m.textContent.includes('1 asunto enlazado.'), m.textContent.includes('Navarro Pons'), m.textContent.includes('ya no está')]; }),
  [true, true, true, true]);
await comprobar('8. el otro quedó enlazado', estadoRegistro(falla, 'Ferreter').then((r) => r.claves.length === 1 && r.claves[0].includes('FACTURAS')), true);
await falla.close();

/* ================= 9. LA CAUSA: CAMBIAR EL NOMBRE DE UN TIPO ================= */

console.log('--- 9. cambiar el nombre de un tipo no deja asuntos sin carpeta ---');
const tipo = await nuevaPagina();
const sueltas = () => tipo.evaluate(async () => {
  await App.cargarRegistro();
  const d = await Hitos.leer();
  const vivas = new Set(App.E.listaAbiertos.map((a) => a.nombre));
  return {
    perdidos: (await FichasHuerfanas.calcular()).length,
    claves: Object.keys(App.E.registro.asuntos).filter((k) => / FACTURA /.test(k) && !vivas.has(k)).sort(),
    hitos: Object.keys(d.porAsunto).filter((k) => / FACTURA /.test(k) && !vivas.has(k)).sort(),
    conNombreNuevo: App.E.listaAbiertos.filter((a) => a.nombre.includes('ZZ PRUEBA 303') && App.E.registro.asuntos[a.nombre]).length,
    conFichaDelTipo: App.E.listaAbiertos.filter((a) => a.leido.reconocido && a.leido.tipo === 'FACTURA' && App.E.registro.asuntos[a.nombre]).length
  };
});
const antesDelTipo = await sueltas();   /* (la demostración ya trae algún asunto sin carpeta de un tipo FACTURA) */
await tipo.evaluate(() => { App.renombrarTipo(App.E.tipos.find((t) => t.tipo === 'FACTURA')); });
await tipo.waitForSelector('#tipo-nuevo-nombre');
await tipo.fill('#tipo-nuevo-nombre', 'ZZ PRUEBA 303');
await tipo.click('#cuadro-aceptar');
await tipo.waitForFunction(() => /Tipo renombrado/.test(document.getElementById('mensajes').textContent), null, { timeout: 30000 });
await tipo.waitForTimeout(500);
const trasElTipo = await sueltas();
await comprobar('9. ningún asunto nuevo sin carpeta', trasElTipo.perdidos, antesDelTipo.perdidos);
await comprobar('9. ninguna ficha ni hitos se quedan con el nombre viejo', [trasElTipo.claves, trasElTipo.hitos], [antesDelTipo.claves, antesDelTipo.hitos]);
await comprobar('9. y cada asunto abierto del tipo tiene su ficha con el nombre nuevo', trasElTipo.conNombreNuevo, antesDelTipo.conFichaDelTipo);
await tipo.close();

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
