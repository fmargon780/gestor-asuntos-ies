/* Prueba en navegador de verdad de los datos a mano de «Trabajo»
   (23-oct-2026, fila 426 de docs/COLA.md, docs/FICHA-VISTA-DE-TRABAJO.md, parte B).

   Con un asunto de alumnado de la demostración (sus datos, guardados en el propio asunto):
     1. Cerrada, la franja «Datos del asunto» enseña NIE, curso, unidad, teléfono y correo en una sola
        línea, encima de la carpeta.
     2. A 900 px de ancho de ventana el NIE sigue a la vista.
     3. El ⧉ del NIE copia el NIE y no despliega la franja.
     4. Al pulsarla se despliega con los datos completos y los campos del asunto, empujando la carpeta
        hacia abajo; pulsarla otra vez la cierra; se recuerda al repintar la ficha.
     5. Una nota a mano sin hito sale en el Registro del hito con «del asunto»; una línea automática sin
        hito no sale; una nota de otro hito tampoco.
     6. Un tercero que no es alumnado (empresa) enseña NIF, teléfono y correo. */
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

async function abrirFicha(pagina, asunto) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(200);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + asunto + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('#ficha-guia .hito', { state: 'attached' });
  await pagina.waitForSelector('#datos-mano-linea .datos-mano-dato', { state: 'attached' });
  await pagina.waitForTimeout(400);
}

const caja = (pagina, sel) => pagina.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, b: r.bottom, r: r.right }; }, sel);
const texto = (pagina, sel) => pagina.evaluate((s) => (document.querySelector(s) || {}).textContent || '', sel);

const { pagina, errores } = await preparar();
await abrirFicha(pagina, ASUNTO);

/* 1. */
const linea1 = (await texto(pagina, '#datos-mano-linea')).replace(/[⧉\s]+/g, ' ').trim();
await comprobar('1. la línea cerrada trae NIE, curso, unidad, teléfono y correo, en ese orden', linea1,
  'NIE 9876543 · Curso 4º ESO · Unidad 4º ESO E · Tel. 655 645 995 · ana.perez@example.com');
await comprobar('1. la franja está cerrada y es de una sola línea', [await pagina.locator('#datos-mano-cuerpo').isVisible(), (await caja(pagina, '#datos-mano-cabeza')).h < 60], [false, true]);
const franja = await caja(pagina, '#datos-mano'), carpeta = await caja(pagina, '#trabajo-carpeta');
await comprobar('1. encima de la carpeta, en la columna derecha', franja.b <= carpeta.y + 1 && franja.x >= (await caja(pagina, '#trabajo-izq')).r, true);

/* 3. */
await pagina.locator('#datos-mano-linea .datos-mano-dato', { hasText: 'NIE' }).locator('.dato-copiable').click();
await pagina.waitForTimeout(200);
await comprobar('3. el ⧉ del NIE copia el NIE', pagina.evaluate(() => navigator.clipboard.readText()), '9876543');
await comprobar('3. y no despliega la franja', pagina.locator('#datos-mano-cuerpo').isVisible(), false);
await pagina.locator('#datos-mano-linea .datos-mano-dato', { hasText: 'ana.perez' }).locator('.dato-copiable').click();
await pagina.waitForTimeout(200);
await comprobar('3. el ⧉ del correo copia el correo', pagina.evaluate(() => navigator.clipboard.readText()), 'ana.perez@example.com');

/* 4. */
const carpetaAntes = (await caja(pagina, '#trabajo-carpeta')).y;
await pagina.locator('#datos-mano-cabeza .datos-mano-titulo').click();
await pagina.waitForTimeout(400);
await comprobar('4. al pulsarla se despliega', pagina.locator('#datos-mano-cuerpo').isVisible(), true);
const cuerpo = await texto(pagina, '#datos-mano-cuerpo');

await comprobar('4. con los datos completos del alumno', /Ana Pérez Ruiz/.test(cuerpo) && /9876543/.test(cuerpo) && /655 645 995/.test(cuerpo), true);
await comprobar('4. y los campos del asunto', /Campos del asunto/.test(cuerpo) && (await pagina.locator('#dm-campos .ficha-dato').count()) > 0, true);
await comprobar('4. empuja la carpeta hacia abajo', (await caja(pagina, '#trabajo-carpeta')).y > carpetaAntes + 40, true);
await pagina.evaluate(() => HitosPanel.programarRepintado());
await pagina.waitForTimeout(500);
await comprobar('4. un repintado de la ficha la deja como estaba (abierta)', pagina.locator('#datos-mano-cuerpo').isVisible(), true);
await pagina.locator('#datos-mano-cabeza .datos-mano-titulo').click();
await pagina.waitForTimeout(300);
await comprobar('4. pulsar el título otra vez la cierra', pagina.locator('#datos-mano-cuerpo').isVisible(), false);
await pagina.locator('#datos-mano-cabeza .datos-mano-titulo').click();
await pagina.waitForTimeout(300);
await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="contacto"]');
await comprobar('4. las pestañas «Datos y contacto» y «Campos del asunto» siguen ahí',
  pagina.locator('#ficha-tarjetas-pestanas .ficha-pestana').allTextContents().then((t) => t.filter((x) => /^(Datos y contacto|Campos del asunto)/.test(x)).length), 2);
await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="trabajo"]');
await pagina.locator('#datos-mano-cabeza .datos-mano-titulo').click();
await pagina.waitForTimeout(300);

/* 5. */
const registro = (await texto(pagina, '.hito-en-mesa .mesa-grande-notas .hito-notas'));
await comprobar('5. la nota a mano sin hito sale en el Registro del hito', registro.indexOf(NOTA_SUELTA) !== -1, true);
await comprobar('5. con la etiqueta «del asunto»', pagina.locator('.hito-en-mesa .mesa-grande-notas .registro-linea', { hasText: NOTA_SUELTA }).locator('.registro-del-asunto').textContent(), 'del asunto');
await comprobar('5. la línea automática sin hito no sale', registro.indexOf(NOTA_AUTO) === -1, true);
await comprobar('5. la nota de otro hito tampoco', registro.indexOf(NOTA_OTRO_HITO) === -1, true);
await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="notas"]');
await comprobar('5. la pestaña Registro sigue enseñando las tres',
  pagina.evaluate(([a, b, c]) => { const t = document.getElementById('ficha-notas').textContent; return [a, b, c].every((x) => t.indexOf(x) !== -1); }, [NOTA_SUELTA, NOTA_AUTO, NOTA_OTRO_HITO]), true);
await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="trabajo"]');

/* 5b. Una nota escrita a mano en la pestaña Registro sale enseguida en el Registro del hito. */
await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="notas"]');
await pagina.fill('#ficha-nota-texto', 'Escrita después de abrir');
await pagina.click('#ficha-nota-guardar');
await pagina.waitForTimeout(1200);
await pagina.click('#ficha-tarjetas-pestanas .ficha-pestana[data-tarjeta="trabajo"]');
await pagina.waitForTimeout(800);
await comprobar('5. una nota escrita ahora en la pestaña Registro sale también en el del hito',
  pagina.evaluate(() => document.querySelector('.hito-en-mesa .hito-notas').textContent.indexOf('Escrita después') !== -1), true);

/* 2. */
await pagina.setViewportSize({ width: 900, height: 900 });
await pagina.waitForTimeout(300);
await pagina.locator('#datos-mano-cabeza .datos-mano-titulo').click();   /* cerrada */
await pagina.waitForTimeout(300);
/* Pulsar el ⧉ del correo (cortado a 1600 px) corrió la línea; aquí se mira la línea recién pintada. */
await pagina.evaluate(() => { document.getElementById('datos-mano-linea').scrollLeft = 0; });
const nie = await caja(pagina, '#datos-mano-linea .datos-mano-dato'), cab = await caja(pagina, '#datos-mano-cabeza');
await comprobar('2. a 900 px, el NIE sigue a la vista', nie.r <= cab.r + 1 && nie.x >= cab.x, true);
await pagina.setViewportSize({ width: 1120, height: 900 });   /* dos columnas, la línea no cabe entera */
await pagina.waitForTimeout(300);
await pagina.evaluate(() => { document.getElementById('datos-mano-linea').scrollLeft = 0; });
const nie2 = await caja(pagina, '#datos-mano-linea .datos-mano-dato'), cab2 = await caja(pagina, '#datos-mano-cabeza');
await comprobar('2. con dos columnas estrechas la línea se corta y el NIE sigue a la vista',
  [await pagina.evaluate(() => { const l = document.getElementById('datos-mano-linea'); return l.scrollWidth > l.clientWidth; }), nie2.r <= cab2.r + 1 && nie2.x >= cab2.x], [true, true]);
await pagina.setViewportSize({ width: 1600, height: 900 });
await pagina.waitForTimeout(200);

/* 6. */
await abrirFicha(pagina, EMPRESA);
const lineaE = (await texto(pagina, '#datos-mano-linea')).replace(/[⧉\s]+/g, ' ').trim();
await comprobar('6. una empresa enseña NIF, teléfono y correo', lineaE, 'NIF B12345678 · Tel. 957 123 456 · pedidos@sillas.example.com');
await comprobar('6. y al entrar en otro asunto, la franja está cerrada', pagina.locator('#datos-mano-cuerpo').isVisible(), false);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
