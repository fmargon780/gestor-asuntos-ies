/* Prueba en navegador de verdad de los datos de uso diario del bloque «Datos» de la vista del asunto
   (23-oct-2026, fila 426, docs/FICHA-VISTA-DE-TRABAJO.md, parte B; reescrita el 13-nov-2026 para la fila 637: la franja «Datos del
   asunto» pasó a ser el bloque plegable «Datos» de la columna derecha, js/ficha-datos-bloque.js).

   Con un asunto de alumnado de la demostración (sus datos, guardados en el propio asunto):
     1. Con el bloque plegado, en su cabecera hay la línea de datos de uso diario (NIE, curso, unidad, teléfono y correo), cada uno con su ⧉; es de una sola línea y el bloque va encima de «Documentos», en la columna derecha.
     2. A 900 px y a 1120 px de ancho de ventana el NIE sigue a la vista.
     3. El ⧉ del NIE copia el NIE y no abre el bloque.
     4. Al pulsar el título se abre con los datos completos («La alumna», «Contacto» con teléfono y correo, «Campos de este
        asunto»), empujando lo de debajo hacia abajo; pulsarlo otra vez lo pliega; se recuerda al repintar la ficha.
     5. Una nota a mano sin hito sale en el Registro del hito con «del asunto»; una línea automática sin hito no sale; una nota
        de otro hito tampoco.
     6. Un tercero que no es alumnado (empresa) enseña NIF, teléfono y correo; y al entrar en otro asunto, el bloque está plegado. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260905 MATRICULA 26-27 Pérez Ruiz, Ana 1234';
const EMPRESA = '260906 PRESUPUESTO Sillas Lucena SL';
const GUIAS = {
  MATRICULA: [
    { id: 'm1', titulo: 'Recoger la solicitud', cuerpo: '', opciones: [] },
    { id: 'm2', titulo: 'Comprobar el expediente', cuerpo: '', opciones: [] }
  ],
  PRESUPUESTO: [{ id: 'p1', titulo: 'Pedir el presupuesto', cuerpo: '', opciones: [] }]
};
const NOTA_SUELTA = 'La familia ya ha entregado la documentación en Jefatura';
const NOTA_AUTO = 'Generado el impreso de matrícula';
const NOTA_OTRO_HITO = 'Se avisó por teléfono desde el hito dos';

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1600, height: 900 } });
await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);

async function preparar() {
  const pagina = await contexto.newPage();
  const errores = [];
  pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript(preparacion);
  await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
  await pagina.click('#btn-abiertos');
  await pagina.click('#btn-archivo');
  await pagina.fill('#campo-usuario', 'Francisco');
  await pagina.waitForSelector('#btn-entrar:not([disabled])');
  await pagina.evaluate(async ([guias, asuntos]) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
    const h = await g.getFileHandle('guias.json', { create: true });
    const w = await h.createWritable(); await w.write(JSON.stringify(guias)); await w.close();
    for (const a of asuntos) await window.__disco.abiertos.getDirectoryHandle(a, { create: true });
  }, [GUIAS, [ASUNTO, EMPRESA]]);
  await pagina.click('#btn-entrar');
  await pagina.waitForSelector('#aplicacion:not(.oculto)');
  await pagina.evaluate(async ([asunto, empresa, sueltas]) => {
    const cuando = new Date().toISOString();
    await App.anotar(asunto, { abiertoEl: U.ahora(), tipo: 'MATRICULA', categoria: 'ALUMNADO',
      tercero: 'Pérez Ruiz, Ana 1234', curso: '26-27', grupo: '', descripcion: '', campos: {},
      contacto: { nombre: 'Pérez Ruiz, Ana', id: '9876543', documento: '', unidad: '4º ESO E', curso: '4º ESO', fechaNac: '2008-03-04',
        campos: { 'Teléfono': '655645995', 'Correo electrónico': 'ana.perez@example.com' }, fichero: 'RegAlum.csv', fecha: '2026-10-01' },
      notas: [
        { texto: sueltas[0], quien: 'Francisco', cuando: cuando },
        { texto: sueltas[1], quien: 'Francisco', cuando: cuando, auto: true },
        { texto: sueltas[2], quien: 'Francisco', cuando: cuando, hito: 'm2', hitoTitulo: 'Comprobar el expediente' }
      ] });
    await App.anotar(empresa, { abiertoEl: U.ahora(), tipo: 'PRESUPUESTO', categoria: 'EMPRESAS',
      tercero: 'Sillas Lucena SL', descripcion: '', campos: {},
      contacto: { nombre: 'Sillas Lucena SL', nif: 'B12345678', campos: { 'Teléfono': '957123456', 'Correo': 'pedidos@sillas.example.com' }, fichero: 'EMPRESAS.csv', fecha: '2026-10-01' } });
    await App.verAbiertos();
  }, [ASUNTO, EMPRESA, [NOTA_SUELTA, NOTA_AUTO, NOTA_OTRO_HITO]]);
  await pagina.waitForTimeout(300);
  return { pagina, errores };
}

const LINEA = '[data-resumen-bloque="datos"]';
const CAB = '.ficha-plegable[data-tarjeta="datos"] .plegable-cab';
const TITULO = '.ficha-plegable[data-tarjeta="datos"] .plegable-titulo';
const dato = (pagina, t) => pagina.locator(LINEA + ' .datos-mano-dato', { hasText: t });

async function abrirFicha(pagina, asunto) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + asunto + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.waitForSelector(LINEA + ' .datos-mano-dato', { state: 'attached' });
  await pagina.waitForTimeout(400);
}

const caja = (pagina, sel) => pagina.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, b: r.bottom, r: r.right }; }, sel);
const texto = (pagina, sel) => pagina.evaluate((s) => (document.querySelector(s) || {}).textContent || '', sel);
const abierto = (pagina, t) => pagina.evaluate((id) => FichaTarjetas.estaAbierto(id), t);

const { pagina, errores } = await preparar();
await abrirFicha(pagina, ASUNTO);

/* 1. */
const linea1 = (await texto(pagina, LINEA)).replace(/[⧉\s]+/g, ' ').trim();
/* En esta demostración los datos van en el propio asunto (sin fichero RegAlum.csv), así que lo elegido de fábrica no se
   encuentra por su nombre de columna y sale la línea de uso diario de siempre. */
await comprobar('1. la línea plegada trae NIE, curso, unidad, teléfono y correo, en ese orden', linea1,
  'NIE 9876543 · Curso 4º ESO · Unidad 4º ESO E · Tel. 655 645 995 · ana.perez@example.com');
await comprobar('1. el bloque está plegado y su cabecera es de una sola línea', [await abierto(pagina, 'datos'), (await caja(pagina, CAB)).h < 60], [false, true]);
const franja = await caja(pagina, '.ficha-plegable[data-tarjeta="datos"]'), carpeta = await caja(pagina, '.ficha-plegable[data-tarjeta="documentos"]');
await comprobar('1. encima de «Documentos», en la columna derecha', franja.b <= carpeta.y + 1 && franja.x >= (await caja(pagina, '#trabajo-izq')).r, true);

/* 3. */
await dato(pagina, 'NIE').locator('.dato-copiable').click();
await pagina.waitForTimeout(200);
await comprobar('3. el ⧉ del NIE copia el NIE', pagina.evaluate(() => navigator.clipboard.readText()), '9876543');
await comprobar('3. y no abre el bloque', abierto(pagina, 'datos'), false);

/* 4. */
const carpetaAntes = (await caja(pagina, '.ficha-plegable[data-tarjeta="documentos"]')).y;
await pagina.locator(TITULO).click();
await pagina.waitForTimeout(400);
await comprobar('4. al pulsar el título se abre', abierto(pagina, 'datos'), true);
const cuerpo = await texto(pagina, '#ficha-datos-bloque');
const grupos = await pagina.locator('#ficha-datos-bloque .datos-grupo h4').allTextContents();

await comprobar('4. con los datos completos del alumno: su recuadro y «Contacto», con el teléfono y el correo',
  [/^La alumna|^El alumno/.test(grupos[0]), grupos.indexOf('Contacto') !== -1, /655 645 995/.test(cuerpo), /ana\.perez@example\.com/.test(cuerpo), /9876543/.test(cuerpo)], [true, true, true, true, true]);
await pagina.evaluate(() => navigator.clipboard.writeText('(nada)'));
await pagina.locator('#ficha-datos-bloque dd', { hasText: 'ana.perez@example.com' }).locator('.dato-copiable').first().click();
await pagina.waitForTimeout(200);
await comprobar('3. el ⧉ del correo (dentro del bloque abierto) copia el correo', pagina.evaluate(() => navigator.clipboard.readText()), 'ana.perez@example.com');
await comprobar('4. y los campos del asunto', /Campos de este asunto/.test(cuerpo) && grupos.indexOf('Campos de este asunto') !== -1, true);
await comprobar('4. empuja lo de debajo («Documentos») hacia abajo', (await caja(pagina, '.ficha-plegable[data-tarjeta="documentos"]')).y > carpetaAntes + 40, true);
await pagina.evaluate(() => HitosPanel.programarRepintado());
await pagina.waitForTimeout(500);
await comprobar('4. un repintado de la ficha la deja como estaba (abierto)', abierto(pagina, 'datos'), true);
await pagina.locator(TITULO).click();
await pagina.waitForTimeout(300);
await comprobar('4. pulsar el título otra vez la pliega', abierto(pagina, 'datos'), false);
await comprobar('4. no hay pestañas: «Datos» y «Campos de este asunto» son de este mismo bloque',
  pagina.evaluate(() => [!!document.getElementById('ficha-tarjetas-pestanas'), !!document.querySelector('.ficha-pestana'),
    !!document.querySelector('.ficha-plegable[data-tarjeta="datos"] #ficha-datos-tramite')]), [false, false, true]);

/* 5. */
const registro = (await texto(pagina, '.hito-en-mesa .mesa-grande-notas .hito-notas'));
await comprobar('5. la nota a mano sin hito sale en el Registro del hito', registro.indexOf(NOTA_SUELTA) !== -1, true);
await comprobar('5. con la etiqueta «del asunto»', pagina.locator('.hito-en-mesa .mesa-grande-notas .registro-linea', { hasText: NOTA_SUELTA }).locator('.registro-del-asunto').textContent(), 'del asunto');
await comprobar('5. la línea automática sin hito no sale', registro.indexOf(NOTA_AUTO) === -1, true);
await comprobar('5. la nota de otro hito tampoco', registro.indexOf(NOTA_OTRO_HITO) === -1, true);
await pagina.evaluate(() => FichaTarjetas.abrir('notas'));
await comprobar('5. el bloque Registro sigue enseñando las tres',
  pagina.evaluate(([a, b, c]) => { const t = document.getElementById('ficha-notas').textContent; return [a, b, c].every((x) => t.indexOf(x) !== -1); }, [NOTA_SUELTA, NOTA_AUTO, NOTA_OTRO_HITO]), true);
await pagina.evaluate(() => FichaTarjetas.plegar('notas'));

/* 5b. Una nota escrita a mano en el bloque Registro sale enseguida en el Registro del hito. */
await pagina.evaluate(() => FichaTarjetas.abrir('notas'));
await pagina.fill('#ficha-nota-texto', 'Escrita después de abrir');
await pagina.click('#ficha-nota-guardar');
await pagina.waitForTimeout(1200);
await pagina.evaluate(() => FichaTarjetas.plegar('notas'));
await pagina.waitForTimeout(800);
await comprobar('5. una nota escrita ahora en el bloque Registro sale también en el del hito',
  pagina.evaluate(() => document.querySelector('.hito-en-mesa .hito-notas').textContent.indexOf('Escrita después') !== -1), true);

/* 2. */
await pagina.setViewportSize({ width: 900, height: 900 });
await pagina.waitForTimeout(300);
await pagina.waitForTimeout(300);   /* el bloque Datos sigue plegado */
/* Pulsar el ⧉ del correo (cortado a 1600 px) corrió la línea; aquí se mira la línea recién pintada. */
await pagina.evaluate((L) => { document.querySelector(L).scrollLeft = 0; }, LINEA);
const nie = await caja(pagina, LINEA + ' .datos-mano-dato'), cab = await caja(pagina, CAB);
await comprobar('2. a 900 px, el NIE sigue a la vista', nie.r <= cab.r + 1 && nie.x >= cab.x, true);
await pagina.setViewportSize({ width: 1120, height: 900 });   /* dos columnas, la línea no cabe entera */
await pagina.waitForTimeout(300);
await pagina.evaluate((L) => { document.querySelector(L).scrollLeft = 0; }, LINEA);
const nie2 = await caja(pagina, LINEA + ' .datos-mano-dato'), cab2 = await caja(pagina, CAB);
await comprobar('2. con dos columnas estrechas la línea se corta y el NIE sigue a la vista',
  [await pagina.evaluate((L) => { const l = document.querySelector(L); return l.scrollWidth > l.clientWidth; }, LINEA), nie2.r <= cab2.r + 1 && nie2.x >= cab2.x], [true, true]);
await pagina.setViewportSize({ width: 1600, height: 900 });
await pagina.waitForTimeout(200);

/* 6. */
await abrirFicha(pagina, EMPRESA);
const lineaE = (await texto(pagina, LINEA)).replace(/[⧉\s]+/g, ' ').trim();
await comprobar('6. una empresa enseña NIF, teléfono y correo', lineaE, 'NIF B12345678 · Tel. 957 123 456 · pedidos@sillas.example.com');
await comprobar('6. y al entrar en otro asunto, el bloque está plegado', abierto(pagina, 'datos'), false);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
