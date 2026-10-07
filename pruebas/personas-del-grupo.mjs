/* Fila 293 (docs/TRABAJO-EN-BLOQUE.md): la tarjeta «Personas del grupo» y lo que dice la ficha de cada persona.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. `PersonasDelGrupo.estado` (sin efectos): generado, registrado y enviado; un documento borrado de la carpeta deja de
      contar; dos plantillas dan dos trabajos; «Solo lo que falta»; el buscador; las cuentas.
   2. El asunto de grupo de la demostración («GRUPO 2ºB»): tres con su documento, una con registro y envío; «Solo lo que falta»
      deja fuera a la que lo tiene todo; la fecha abre el documento; «Quitar del grupo» apagado con algo hecho y, sin nada,
      quita y la cuenta baja en uno; «Abrir su ficha».
   3. La ficha de la persona: «En asuntos de grupo», con la línea de los tres datos; pulsarla abre su documento; la cuenta
      de «Sus asuntos» la incluye; una persona sin nada hecho sale solo con el nombre del asunto.
   4. «Generar para todos ▾»: al terminar, todas las filas con la fecha de hoy; con una segunda plantilla, «Qué se mira».
   5. Un asunto de grupo archivado: la ficha de la persona lo dice (leído de su carpeta del ARCHIVO).
   6. Si una persona cambia de nombre, sus documentos siguen siendo suyos.
   7. Solo consulta: se ve todo, los botones apagados y no se escribe nada. */
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
  const p = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); " + (extra || '') + " } catch (e) {}");
  await p.goto(DIRECCION);
  await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
  await p.waitForFunction(() => window.Demo && Demo.montando === false, null, { timeout: 60000 });   /* fila 299: la demostración tarda un poco más en montarse */
  await p.waitForTimeout(4000);
  return p;
}
const pagina = await nuevaPagina();

/* ================= 1. LA CUENTA, SIN EFECTOS ================= */
console.log('--- 1. estado ---');
const FICHA = {
  relacionados: [{ categoria: 'ALUMNADO', nombre: 'Uno, A 1' }, { categoria: 'ALUMNADO', nombre: 'Dos, B 2' }, { categoria: 'ALUMNADO', nombre: 'Tres, C 3' }],
  documentos: {
    'D26-00001': { tipo: 'CERTIFICADO', fecha: '2026-10-07', generadoDe: 'plA|ALUMNADO|Uno, A 1', registros: [{ codigo: '26SM0412' }] },
    'D26-00002': { tipo: 'CERTIFICADO', fecha: '2026-10-07', generadoDe: 'plA|ALUMNADO|Dos, B 2', registros: [] },
    'D26-00003': { tipo: 'CERTIFICADO', fecha: '2026-10-08', generadoDe: 'plB|ALUMNADO|Uno, A 1', registros: [] },
    'D26-00004': { tipo: 'CERTIFICADO', fecha: '2026-10-07', generadoDe: 'plA|ALUMNADO|Tres, C 3', registros: [] },
    'D26-00005': { tipo: 'OFICIO', fecha: '2026-10-07', registros: [] }
  },
  enviosPorPersona: [{ documento: '261007 CERTIFICADO D26-00001.docx', correo: 'a@correo-demo.es', cuando: '2026-10-08T09:00:00.000Z', quien: 'Q' }]
};
const FICHEROS = ['261007 CERTIFICADO D26-00001.docx', '261007 CERTIFICADO D26-00002.docx', '261008 CERTIFICADO D26-00003.docx', '261007 OFICIO D26-00005.pdf'];
const est = await pagina.evaluate(([f, ficheros]) => PersonasDelGrupo.estado({ nombre: 'no existe', ficha: f }, ficheros), [FICHA, FICHEROS]);
await comprobar('1. dos plantillas dan dos trabajos, del más viejo al último',
  est.trabajos.map((t) => t.clave + ':' + t.fecha), ['plA:2026-10-07', 'plB:2026-10-08']);
await comprobar('1. generado, registrado y enviado de la primera persona',
  est.personas[0].hechos.plA, { generado: { fecha: '2026-10-07', numero: 'D26-00001', fichero: '261007 CERTIFICADO D26-00001.docx' }, registrado: ['26SM0412'], enviado: { fecha: '2026-10-08', cuando: '2026-10-08T09:00:00.000Z', correo: 'a@correo-demo.es', quien: 'Q' } });
await comprobar('1. la segunda: solo generado',
  [Object.keys(est.personas[1].hechos), est.personas[1].hechos.plA.registrado, est.personas[1].hechos.plA.enviado], [['plA'], [], null]);
await comprobar('1. un documento que ya no está en la carpeta deja de contar; y uno sin `generadoDe` no es de nadie',
  est.personas[2].hechos, {});
await comprobar('1. la primera persona tiene los dos trabajos',
  Object.keys(est.personas[0].hechos), ['plA', 'plB']);
await comprobar('1. cuentas del trabajo plA: 2 generados, 1 registrado, 1 enviado, y su frase',
  pagina.evaluate((e) => { const c = PersonasDelGrupo.cuentas(e, 'plA'); return [c, PersonasDelGrupo.textoResumen(c)]; }, est),
  [[{ personas: 3, generados: 2, registrados: 1, enviados: 1 }, '3 personas · 2 generados · 1 registrado · 1 enviado']].flat());
await comprobar('1. «Solo lo que falta» deja fuera a la que lo tiene todo',
  pagina.evaluate((e) => PersonasDelGrupo.filas(e, 'plA', { soloFalta: true }).map((f) => f.persona.nombre), est), ['Dos, B 2', 'Tres, C 3']);
await comprobar('1. el buscador por nombre, sin tildes ni mayúsculas',
  pagina.evaluate((e) => PersonasDelGrupo.filas(e, 'plA', { texto: 'TRES' }).map((f) => f.persona.nombre), est), ['Tres, C 3']);

/* ================= 2. EL ASUNTO DE GRUPO DE LA DEMOSTRACIÓN ================= */
console.log('--- 2. la tabla ---');
const demo = await pagina.evaluate(() => App.E.listaAbiertos.filter((a) => /GRUPO 2ºB$/.test(a.nombre))[0].nombre);
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), demo);
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(1800);
await comprobar('2. el resumen de la tarjeta cerrada',
  pagina.locator('.ficha-tarjeta[data-tarjeta="relacionados"] .ficha-tarjeta-resumen').textContent(), '8 personas · 5 generados · 4 registrados · 1 enviado');   /* la tercera, colocada sola por su «Ref.» (fila 294); fila 295: y Sara y Vera, con su PDF registrado */
await pagina.evaluate(() => FichaTarjetas.abrir('relacionados'));
await pagina.waitForSelector('.pg-tabla');
const columnas = () => pagina.locator('.pg-tabla thead th').allTextContents();
await comprobar('2. las columnas', columnas(), ['Persona', 'Unidad', 'Generado', 'Registrado', 'Enviado', '']);
await comprobar('2. una fila por persona, a todo el ancho de la tarjeta',
  pagina.evaluate(() => { const t = document.querySelector('.pg-tabla'), c = document.querySelector('.ficha-tarjeta.abierta .ficha-tarjeta-cuerpo'); return [t.querySelectorAll('tbody tr').length, t.getBoundingClientRect().width > c.getBoundingClientRect().width * 0.9]; }), [8, true]);
const fila = (i) => pagina.locator('.pg-tabla tbody tr').nth(i).locator('td').allTextContents();
const hoy = await pagina.evaluate(() => PersonasDelGrupo.fechaLarga(U.hoyIso()));
const hace3 = await pagina.evaluate(() => { const d = new Date(Date.now() - 3 * 86400000); return PersonasDelGrupo.fechaLarga(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')); });
await comprobar('2. la primera: generada, con su registro y su envío (fecha y dirección)',
  fila(0).then((c) => [c[0], c[1], c[2], c[3], /tutor\.noa@correo-demo\.es/.test(c[4])]), ['Castro Reina, Noa', '2º B', hace3, '26SM0412', true]);
await comprobar('2. la segunda: solo generada (registro «Pendiente»); la tercera, con el registro de su PDF sellado; la cuarta, vacía',
  Promise.all([fila(1), fila(2), fila(3)]).then(([a, b, c]) => [a[2] === hace3 && a[3] === 'Pendiente' && !a[4], b[2] === hace3 && b[3] === '26SM0413' && !b[4], !c[2] && !c[3] && !c[4]]), [true, true, true]);
await pagina.check('.pg-solo-falta');
await comprobar('2. «Solo lo que falta» deja fuera a la que lo tiene todo',
  pagina.locator('.pg-tabla tbody tr .pg-persona').allTextContents().then((l) => [l.length, l.indexOf('Castro Reina, Noa')]), [7, -1]);
await pagina.uncheck('.pg-solo-falta');
await comprobar('2. con ocho personas no sale el buscador por nombre', pagina.locator('.pg-buscar').count(), 0);

/* El menú de una fila. */
await pagina.locator('.pg-tabla tbody tr').nth(1).locator('.pg-mas').click();
await comprobar('2. con algo generado, «Quitar del grupo» está apagado',
  pagina.locator('.pg-menu button').evaluateAll((bs) => bs.map((b) => b.textContent + ':' + b.disabled)), ['Abrir su ficha:false', 'Copiar el nombre:false', 'Quitar del grupo:true', 'Volver a generar:false']);
await pagina.keyboard.press('Escape');
await comprobar('2. Escape cierra solo el menú, no la tarjeta',
  pagina.evaluate(() => [document.querySelector('.pg-menu').classList.contains('oculto'), FichaTarjetas.abierta()]), [true, 'relacionados']);
await pagina.locator('.pg-tabla tbody tr').nth(1).locator('.pg-abrir').click();
await pagina.waitForTimeout(2000);
await comprobar('2. pulsar la fecha abre el documento de esa persona, con su nombre dentro',
  pagina.evaluate(() => [document.body.classList.contains('con-word-visor'), (document.getElementById('word-visor').textContent || '').indexOf('Iker Delgado Prieto') !== -1]), [true, true]);
await pagina.evaluate(() => document.querySelector('.word-visor-cerrar').click());

await pagina.locator('.pg-tabla tbody tr').nth(4).locator('.pg-mas').click();
await pagina.locator('.pg-menu button', { hasText: 'Quitar del grupo' }).click();
await pagina.waitForFunction(() => document.querySelectorAll('.pg-tabla tbody tr').length === 7);
await comprobar('2. sin nada hecho, «Quitar del grupo» quita y la cuenta baja en uno',
  pagina.evaluate((n) => [App.E.registro.asuntos[n].relacionados.length, document.querySelector('.ficha-tarjeta[data-tarjeta="relacionados"] .ficha-titulo').textContent.trim(), document.querySelector('.pg-cuenta').textContent], demo),
  [7, 'Personas del grupo (7)', '7 personas · 5 generados · 4 registrados · 1 enviado']);

await pagina.locator('.pg-tabla tbody tr').nth(0).locator('.pg-mas').click();
await pagina.locator('.pg-menu button', { hasText: 'Abrir su ficha' }).click();
await pagina.waitForSelector('#ficha-persona .ficha-grupo-de', { timeout: 15000 });
await comprobar('2. «Abrir su ficha» lleva a Personas y empresas, a su ficha',
  pagina.evaluate(() => [document.querySelector('.pantalla:not(.oculto)').id, /Castro Reina/.test(document.getElementById('ficha-persona').textContent)]), ['pantalla-personas', true]);

/* ================= 3. LA FICHA DE LA PERSONA ================= */
console.log('--- 3. la ficha de la persona ---');
await comprobar('3. «En asuntos de grupo»: nombre de la plantilla, y generado, registrado y enviado, con sus fechas',
  pagina.locator('.ficha-grupo-de .pg-linea-persona > div').first().textContent().then((t) => t.replace(/\s+/g, ' ')),
  'Certificado de notas · generado el ' + hace3 + ' · registrado 26SM0412 · enviado el ' + await pagina.evaluate(() => { const d = new Date(Date.now() - 2 * 86400000); return PersonasDelGrupo.fechaLarga(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')); }) + ' a tutor.noa@correo-demo.es');
await comprobar('3. debajo, el nombre del asunto y «Abierto»',
  pagina.locator('.ficha-grupo-de .pg-linea-persona .resultado-pie').first().textContent(), demo + ' · Abierto');
await comprobar('3. el título de «Sus asuntos» cuenta también estas líneas',
  pagina.locator('#titulo-sus-asuntos').textContent().then((t) => /^Sus asuntos \((\d+)\)$/.exec(t.trim())[1] === String(1 + 1) || t), true);
await comprobar('3. ya no hay el bloque suelto «Relacionado con este asunto»', pagina.evaluate(() => /Relacionado con (este asunto|estos asuntos)/.test(document.getElementById('ficha-persona').textContent)), false);
await pagina.locator('.ficha-grupo-de .pg-linea-persona').first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(2200);
await comprobar('3. pulsar la línea abre el asunto con su documento',
  pagina.evaluate((n) => [App.fichaAbierta && App.fichaAbierta(), document.body.classList.contains('con-word-visor')], demo), [demo, true]);
await pagina.evaluate(() => document.querySelector('.word-visor-cerrar').click());
/* Una persona del grupo a la que no se le ha hecho nada: solo el nombre del asunto. */
await pagina.evaluate(() => { App.ir('personas'); $('filtro-personas').value = 'ALUMNADO'; });
await pagina.fill('#buscar-personas', 'Navarro');
await pagina.waitForTimeout(600);
await pagina.click('#lista-personas .resultado');
await pagina.waitForSelector('#ficha-persona .ficha-grupo-de');
await comprobar('3. sin nada hecho: solo el nombre del asunto y «Abierto»',
  pagina.evaluate(() => [...document.querySelectorAll('.ficha-grupo-de .resultado')].map((r) => r.textContent.replace(/\s+/g, ' ').trim())), [demo + 'Abierto']);

/* ================= 4. GENERAR PARA TODOS ================= */
console.log('--- 4. generar para todos ---');
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), demo);
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(1500);
await pagina.evaluate(() => FichaTarjetas.abrir('relacionados'));
await pagina.waitForSelector('.pg-tabla');
await pagina.click('.pg-generar');
await comprobar('4. el menú ofrece la plantilla del tipo', pagina.locator('.pg-menu button').allTextContents(), ['Certificado de notas']);
await pagina.click('.pg-menu button');
await pagina.waitForSelector('.word-visor-franja .muestra-generar');   /* fila 294: antes, una muestra */
await pagina.click('.muestra-generar');
await pagina.waitForSelector('#capa:not(.oculto) .generar-cada-resumen', { timeout: 120000 });
await comprobar('4. el resumen dice cuántos documentos', pagina.locator('.generar-cada-resumen').textContent(), '7 documentos generados.');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction((h) => [...document.querySelectorAll('.pg-tabla tbody tr')].every((r) => r.children[2].textContent.trim() === h), hoy, { timeout: 15000 });
await comprobar('4. al terminar, todas las filas llevan la fecha de hoy y el resumen cuenta siete generados',
  pagina.locator('.pg-cuenta').textContent(), '7 personas · 7 generados · 0 registrados · 0 enviados');
await comprobar('4. el trabajo es el mismo (una sola plantilla): no sale «Qué se mira»', pagina.locator('.pg-trabajo-lista').count(), 0);

/* Una segunda plantilla: dos trabajos. */
await pagina.evaluate(async () => {
  const d = await Plantillas.cargar(App.E.gestor);
  const base = d.documentos.filter((x) => x.nombre === 'Certificado de notas')[0];
  await Plantillas.guardar(App.E.gestor, (actual) => { actual.documentos.push(Object.assign({}, base, { id: Plantillas.idNuevoDocumento(), nombre: 'Otro certificado' })); return actual; });
});
await pagina.click('.pg-generar');
await comprobar('4. con dos plantillas en el tipo, el menú las ofrece', pagina.locator('.pg-menu button').allTextContents(), ['Certificado de notas', 'Otro certificado']);
await pagina.locator('.pg-menu button', { hasText: 'Otro certificado' }).click();
await pagina.waitForSelector('.word-visor-franja .muestra-generar');
await pagina.click('.muestra-generar');
await pagina.waitForSelector('#capa:not(.oculto) .generar-cada-resumen', { timeout: 120000 });
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('.pg-trabajo-lista', { timeout: 15000 });
await comprobar('4. aparece «Qué se mira» con los dos trabajos, el último elegido',
  pagina.evaluate(() => { const s = document.querySelector('.pg-trabajo-lista'); return [[...s.options].map((o) => o.textContent.replace(/ · .*/, '')), s.options[s.selectedIndex].textContent.replace(/ · .*/, '')]; }),
  [['Certificado de notas', 'Otro certificado'], 'Otro certificado']);
await pagina.selectOption('.pg-trabajo-lista', { index: 0 });
await comprobar('4. y al elegir el primero, la tabla cambia a sus columnas',
  pagina.locator('.pg-cuenta').textContent(), '7 personas · 7 generados · 0 registrados · 0 enviados');

await comprobar('sin errores de consola (parte principal)', Promise.resolve(errores), []);

/* ================= 6. CAMBIAR EL NOMBRE DE UNA PERSONA ================= */
console.log('--- 6. una persona cambia de nombre ---');
const pagina2 = await nuevaPagina();
const demo2 = await pagina2.evaluate(() => App.E.listaAbiertos.filter((a) => /GRUPO 2ºB$/.test(a.nombre))[0].nombre);
await pagina2.evaluate(async (n) => {
  const f = App.E.registro.asuntos[n];
  const viejo = f.relacionados[0].nombre;
  await PersonasDelGrupo.alRenombrar(n, 'ALUMNADO', viejo, 'Castro Reina, Noa 2199999');
  await App.anotarLista(n, 'relacionados', { quitar: [{ categoria: 'ALUMNADO', nombre: viejo }], anadir: [{ categoria: 'ALUMNADO', nombre: 'Castro Reina, Noa 2199999' }] });
}, demo2);
await comprobar('6. tras el cambio de nombre, sus documentos siguen siendo suyos en la tabla',
  pagina2.evaluate(async (n) => {
    const a = App.E.listaAbiertos.filter((x) => x.nombre === n)[0];
    const est = PersonasDelGrupo.estado(a, (await Carpetas.ficheros(a.handle)).map((f) => f.nombre));
    const p = est.personas.filter((x) => x.nombre === 'Castro Reina, Noa 2199999')[0];
    return [!!p, Object.keys(p.hechos).length, est.personas.filter((x) => Object.keys(x.hechos).length).length];
  }, demo2), [true, 1, 5]);
await pagina2.close();

/* ================= 5. ARCHIVADO ================= */
console.log('--- 5. un asunto de grupo archivado ---');
const pagina4 = await nuevaPagina();
const demo4 = await pagina4.evaluate(() => App.E.listaAbiertos.filter((a) => /GRUPO 2ºB$/.test(a.nombre))[0].nombre);
await pagina4.evaluate((n) => { App.cerrarAsunto(App.E.listaAbiertos.filter((x) => x.nombre === n)[0]); }, demo4);
await pagina4.waitForSelector('#capa:not(.oculto)');
await pagina4.evaluate(() => document.getElementById('cuadro-aceptar').click());   /* «Avisar a los relacionados» */
await pagina4.waitForFunction(() => document.getElementById('cuadro-titulo').textContent === 'Archivar el asunto');
await pagina4.evaluate(() => document.getElementById('cuadro-aceptar').click());
await pagina4.waitForFunction((n) => !App.E.listaAbiertos.some((a) => a.nombre === n), demo4, { timeout: 30000 });
await pagina4.waitForTimeout(1500);
await pagina4.evaluate(async () => { await App.reconstruirIndiceArchivo(); });
await pagina4.evaluate(() => { App.ir('personas'); $('filtro-personas').value = 'ALUMNADO'; });
await pagina4.fill('#buscar-personas', 'Castro');
await pagina4.waitForTimeout(600);
await pagina4.locator('#lista-personas .resultado', { hasText: 'Castro Reina' }).first().click();
await pagina4.waitForSelector('#ficha-persona .ficha-grupo-de .pg-linea-persona', { timeout: 20000 });
await comprobar('5. archivado: la línea sale con sus tres datos, leída de la carpeta del ARCHIVO, y dice «Archivado»',
  pagina4.evaluate(() => { const l = document.querySelector('.ficha-grupo-de .pg-linea-persona'); return [l.children[0].textContent.indexOf('generado el') !== -1 && /registrado 26SM0412/.test(l.children[0].textContent) && /enviado el/.test(l.children[0].textContent), /Archivado$/.test(l.children[1].textContent)]; }), [true, true]);

await pagina4.close();

/* ================= 7. SOLO CONSULTA ================= */
console.log('--- 7. solo consulta ---');
const pagina3 = await nuevaPagina("localStorage.setItem('gestor.soloConsulta', '1');");
const demo3 = await pagina3.evaluate(() => App.E.listaAbiertos.filter((a) => /GRUPO 2ºB$/.test(a.nombre))[0].nombre);
await pagina3.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), demo3);
await pagina3.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina3.waitForTimeout(1500);
await pagina3.evaluate(() => FichaTarjetas.abrir('relacionados'));
await pagina3.waitForSelector('.pg-tabla');
await pagina3.waitForTimeout(500);
await comprobar('7. la tabla se ve entera y sus cuatro botones están apagados',
  pagina3.evaluate(() => [document.querySelectorAll('.pg-tabla tbody tr').length, ...[...document.querySelectorAll('.pg-botones button')].map((b) => b.disabled)]), [8, true, true, true, true]);
await comprobar('7. mirar, filtrar y abrir siguen funcionando; «Quitar del grupo» apagado',
  (async () => {
    await pagina3.check('.pg-solo-falta');
    const filas = await pagina3.locator('.pg-tabla tbody tr').count();
    await pagina3.uncheck('.pg-solo-falta');
    await pagina3.locator('.pg-tabla tbody tr').nth(3).locator('.pg-mas').click();
    const quitar = await pagina3.locator('.pg-menu button', { hasText: 'Quitar del grupo' }).isDisabled();
    return [filas, quitar];
  })(), [7, true]);
await comprobar('7. no se ha escrito nada', pagina3.evaluate(() => Demo.escrituras()), 0);
await comprobar('sin errores de consola', Promise.resolve(errores), []);

await navegador.close();
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas de personas-del-grupo pasan.');
process.exit(fallos ? 1 : 0);
