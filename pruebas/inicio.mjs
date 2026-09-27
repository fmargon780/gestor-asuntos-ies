/* Prueba en navegador de verdad de la pantalla de Inicio (27-sep-2026,
   fila 191, docs/INICIO-CUATRO-BLOQUES.md, apartados 1, 2, 3, 4 y 7):
   los bloques "Ha llegado", "Me toca" y "Esperamos a otros", el
   tablón siempre a la vista, y "Qué me toca" ya no existe como
   pantalla aparte.

   Como pruebas/que-me-toca.mjs (retirado en esta misma fila: sus
   escenarios de clasificación, orden y filtro se portan aquí), no
   hace falta pasar por una guía ni por Hitos.marcar para levantar los
   datos: basta con las carpetas de los asuntos, su ficha en
   asuntos.json y hitos.json escrito a mano, con el mismo esquema que
   ya normaliza js/hitos.js.

   Datos de prueba:
     - Un tipo TRASLADO (tipos.json) con una guía de dos hitos,
       responsable Administración (guias.json; no se usa para generar
       los hitos --se escriben a mano, como hitos.json de siempre--,
       solo para que el tipo exista de verdad en el centro).
     - Asunto A: dos hitos, el primero ya hecho y el segundo (el
       actual) "encurso", responsable Administración, con fecha de
       ayer (vencido): tiene que salir en "Me toca", el único vencido.
     - Asunto B: un hito responsable "El tutor del alumnado" (la
       familia), sin fecha, en espera: tiene que salir en "Esperamos a
       otros".
     - Un documento suelto en la carpeta de abiertos: tiene que salir
       en "Ha llegado". Sin correo (fila 191: no es el foco de esta
       prueba, y mockear la bandeja entera saldría caro para lo que
       aporta aquí).

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1905, height: 1000 } });
const errores = [];
pagina.on('console', m => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', e => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript(preparacion);
await pagina.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');

let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

function isoDe(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function isoHaceDias(n) { const d = new Date(); d.setDate(d.getDate() - n); return isoDe(d); }

/* ================= ENTRAR ================= */

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ================= LOS DATOS DE PRUEBA ================= */

const CLAVE_A = '260901 TRASLADO 26-27 Uno Reves, Ana 1111';
const CLAVE_B = '260902 TRASLADO 26-27 Familia Espera, Bea 2222';
const FECHA_AYER = isoHaceDias(1);

await pagina.evaluate(async ({ CLAVE_A, CLAVE_B, FECHA_AYER }) => {
  const abiertos = window.__disco.abiertos;
  await abiertos.getDirectoryHandle(CLAVE_A, { create: true });
  await abiertos.getDirectoryHandle(CLAVE_B, { create: true });
  /* Un papel suelto, de los de "Ha llegado". */
  abiertos._hijos.set('260926 escaneo del director.pdf',
    window.__disco.fich('260926 escaneo del director.pdf', 'un papel'));

  const g = await abiertos.getDirectoryHandle('_GESTOR', { create: true });

  async function escribir(nombre, datos) {
    const h = await g.getFileHandle(nombre, { create: true });
    const w = await h.createWritable();
    await w.write(JSON.stringify(datos));
    await w.close();
  }

  await escribir('tipos.json', [{ tipo: 'TRASLADO', categoria: 'ALUMNADO' }]);
  await escribir('guias.json', { TRASLADO: [
    { id: 'g1', titulo: 'Pedir papeles', cuerpo: '', opciones: [], responsable: 'administracion' },
    { id: 'g2', titulo: 'Revisar el expediente', cuerpo: '', opciones: [], responsable: 'administracion' }
  ] });

  const fAsuntos = await g.getFileHandle('asuntos.json', { create: true });
  const jAsuntos = JSON.parse(await (await fAsuntos.getFile()).text() || '{"asuntos":{}}');
  jAsuntos.asuntos[CLAVE_A] = { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Uno Reves, Ana 1111', abiertoPor: 'Francisco' };
  jAsuntos.asuntos[CLAVE_B] = { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Familia Espera, Bea 2222', abiertoPor: 'Francisco' };
  await escribir('asuntos.json', jAsuntos);

  await escribir('hitos.json', {
    ajustes: { responsables: [], noLectivos: [] },
    porAsunto: {
      [CLAVE_A]: { creados: '2026-09-01', hitos: [
        { id: 'a1', titulo: 'Pedir papeles', estado: 'hecho', responsable: 'administracion' },
        { id: 'a2', titulo: 'Revisar el expediente', estado: 'encurso', responsable: 'administracion', fecha: FECHA_AYER }
      ] },
      [CLAVE_B]: { creados: '2026-09-01', hitos: [
        { id: 'b1', titulo: 'Esperar respuesta de la familia', estado: 'pendiente', responsable: 'tutor' }
      ] }
    }
  });

  await App.cargarRegistro();
}, { CLAVE_A, CLAVE_B, FECHA_AYER });

await pagina.click('#btn-recargar');
await pagina.waitForTimeout(500);
await pagina.evaluate(() => window.Inicio && window.Inicio.repintar());
await pagina.waitForSelector('#inicio-me-toca-lista .inicio-fila');
await pagina.waitForSelector('#inicio-esperamos-lista .inicio-fila');
await pagina.waitForSelector('#tablon');

/* ================= 1. LA PESTAÑA DICE "INICIO"; SIN "QUÉ ME TOCA" ================= */

console.log('--- 1. la pestaña dice "Inicio", sin "Qué me toca" ---');
await comprobar('la pestaña de siempre dice "Inicio"',
  pagina.locator('.pestana[data-pantalla="abiertos"] span').first().textContent(), 'Inicio');
await comprobar('no hay ninguna pestaña "Qué me toca"',
  pagina.locator('.lateral').textContent().then(t => t.indexOf('Qué me toca') !== -1), false);
await comprobar('ni la pantalla vieja', pagina.locator('#pantalla-que-me-toca').count(), 0);

/* ================= 2. LOS CUATRO BLOQUES, A LA VEZ ================= */

console.log('--- 2. los cuatro bloques se ven a la vez, sin pulsar nada ---');
await comprobar('"Ha llegado" se ve', pagina.locator('#inicio-ha-llegado').isVisible(), true);
await comprobar('"Me toca" se ve', pagina.locator('#inicio-me-toca').isVisible(), true);
await comprobar('"Esperamos a otros" se ve', pagina.locator('#inicio-esperamos').isVisible(), true);
await comprobar('el tablón se ve', pagina.locator('#tablon').isVisible(), true);

/* ================= 3. EL BADGE ROJO DE VENCIDOS ================= */

console.log('--- 3. el badge rojo de vencidos, en la pestaña ---');
await comprobar('dice "1" (solo el hito de A está vencido)',
  pagina.locator('#cuenta-vencidos-inicio').textContent(), '1');
await comprobar('y se ve (sin la clase oculto)',
  pagina.locator('#cuenta-vencidos-inicio').getAttribute('class').then(c => c.indexOf('oculto') === -1), true);

/* ================= 4. "ME TOCA": EL HITO VENCIDO DE A, PRIMERO ================= */

console.log('--- 4. "Me toca": el hito vencido de A sale primero ---');
await comprobar('la primera (y única) fila de "Me toca" es a2, de A',
  pagina.locator('#inicio-me-toca-lista .inicio-fila').first().getAttribute('data-hito'), 'a2');
await comprobar('lleva la clase roja de vencido',
  pagina.locator('#inicio-me-toca-lista .inicio-fila[data-hito="a2"]').getAttribute('class')
    .then(c => c.indexOf('plazo-vencido') !== -1), true);

await pagina.click('#inicio-me-toca-lista .inicio-fila[data-hito="a2"]');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(400);
await comprobar('se abre la ficha de A', pagina.locator('.ficha-nombre-texto').textContent(), CLAVE_A);
await comprobar('con la mesa del hito a2 ya desplegada',
  pagina.locator('#ficha-guia .hito[data-id="a2"] .hito-cuerpo').getAttribute('class')
    .then(c => c === null || c.indexOf('oculto') === -1), true);

await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await pagina.waitForTimeout(300);

/* ================= 5. "ESPERAMOS A OTROS": EL ASUNTO B ================= */

console.log('--- 5. "Esperamos a otros": el asunto B ---');
await comprobar('B sale en "Esperamos a otros"',
  pagina.locator('#inicio-esperamos-lista .inicio-fila[data-hito="b1"]').count(), 1);
await comprobar('con "El tutor del alumnado" (la familia) en el texto',
  pagina.locator('#inicio-esperamos-lista .inicio-fila[data-hito="b1"]').textContent()
    .then(t => t.indexOf('El tutor del alumnado') !== -1), true);

await pagina.click('#inicio-esperamos-lista .inicio-fila[data-hito="b1"]');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(400);
await comprobar('se abre la ficha de B', pagina.locator('.ficha-nombre-texto').textContent(), CLAVE_B);

await pagina.click('#ficha-volver');
await pagina.waitForSelector('#pantalla-abiertos:not(.oculto)');
await pagina.waitForTimeout(300);

/* ================= 6. "HA LLEGADO": EL DOCUMENTO SUELTO ================= */

console.log('--- 6. "Ha llegado": el documento suelto ---');
await comprobar('el suelto sale en "Ha llegado"',
  pagina.locator('#inicio-ha-llegado-lista').textContent()
    .then(t => t.indexOf('escaneo del director.pdf') !== -1), true);

/* ================= 7. EL BUSCADOR FILTRA LOS BLOQUES ================= */

console.log('--- 7. el buscador de la cabecera filtra los bloques ---');
await pagina.fill('#buscar-abiertos', 'Uno Reves');
await pagina.waitForTimeout(400);
await comprobar('"Me toca" sigue con su fila (el nombre de A coincide)',
  pagina.locator('#inicio-me-toca-lista .inicio-fila').count(), 1);
await comprobar('"Esperamos a otros" se queda vacío (B no coincide)',
  pagina.locator('#inicio-esperamos-lista .inicio-fila').count(), 0);

await pagina.fill('#buscar-abiertos', '');
await pagina.waitForTimeout(400);
await comprobar('al borrar la búsqueda, "Esperamos a otros" vuelve a tener su fila',
  pagina.locator('#inicio-esperamos-lista .inicio-fila').count(), 1);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
