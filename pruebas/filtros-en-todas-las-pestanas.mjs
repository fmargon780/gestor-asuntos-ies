/* Prueba en navegador de verdad de la fila 216 (28-sep-2026,
   docs/FILTROS-EN-TODAS-LAS-PESTANAS.md): los cinco filtros de "Filtros"
   (Responsable, Situación, Plazo, Lo encarga y Tipo de asunto) valen
   igual en las cuatro pestañas de Inicio, no solo en "Todos los
   abiertos", y "Filtros (N)" cuenta los cinco.

   Datos de prueba (dos tipos, dos responsables propios además de
   Administración):
     - Tipos: TRASLADO (organo SECRETARIA) y BAJA (organo JEFATURA).
     - Responsables: Diego (de Administración, esPersona) y Jefatura
       (NO de Administración).
     - ADM1 (TRASLADO, vencido): hito responsable "administracion".
       "En Administración".
     - ADM2 (BAJA, sin plazo, dormido hace 90 días): hito responsable
       "diego". "En Administración" y "Dormidos" a la vez.
     - ESP1 (TRASLADO, vence pronto): hito responsable "jefatura".
       "En espera".
     - ESP2 (BAJA, vencido): hito responsable "tutor" (papel).
       "En espera"; nunca pasa el filtro Responsable (ningún papel está
       en la lista de responsables).
     - DORM1 (TRASLADO, vencido, dormido hace 90 días, SIN hitos): solo
       "Dormidos"; sin hito actual, nunca pasa el filtro Responsable
       elegido (docs, punto 1).

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
function isoEnDias(n) { const d = new Date(); d.setDate(d.getDate() + n); return isoDe(d); }

/* ================= ENTRAR ================= */

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* ================= LOS DATOS DE PRUEBA ================= */

const CLAVE_ADM1 = '260901 TRASLADO 26-27 Uno Admin, Ana 1111';
const CLAVE_ADM2 = '260902 BAJA 26-27 Dos Admin, Bea 2222';
const CLAVE_ESP1 = '260903 TRASLADO 26-27 Tres Espera, Cris 3333';
const CLAVE_ESP2 = '260904 BAJA 26-27 Cuatro Espera, Dani 4444';
const CLAVE_DORM1 = '260905 TRASLADO 26-27 Cinco Dormido, Eva 5555';

const FECHA_AYER = isoHaceDias(1);
const FECHA_PRONTO = isoEnDias(3);
const DESDE_CINCO = isoHaceDias(5);
const DESDE_VEINTE = isoHaceDias(20);
const NOTA_VIEJA = new Date(Date.now() - 90 * 86400000).toISOString();

await pagina.evaluate(async ({ CLAVE_ADM1, CLAVE_ADM2, CLAVE_ESP1, CLAVE_ESP2, CLAVE_DORM1,
                               FECHA_AYER, FECHA_PRONTO, DESDE_CINCO, DESDE_VEINTE, NOTA_VIEJA }) => {
  const abiertos = window.__disco.abiertos;
  for (const clave of [CLAVE_ADM1, CLAVE_ADM2, CLAVE_ESP1, CLAVE_ESP2, CLAVE_DORM1]) {
    await abiertos.getDirectoryHandle(clave, { create: true });
  }

  const g = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
  async function escribir(nombre, datos) {
    const h = await g.getFileHandle(nombre, { create: true });
    const w = await h.createWritable();
    await w.write(JSON.stringify(datos));
    await w.close();
  }

  await escribir('tipos.json', [
    { tipo: 'TRASLADO', categoria: 'ALUMNADO', organo: 'SECRETARIA' },
    { tipo: 'BAJA', categoria: 'ALUMNADO', organo: 'JEFATURA' }
  ]);

  await escribir('asuntos.json', { asuntos: {
    [CLAVE_ADM1]: { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Uno Admin, Ana 1111', abiertoPor: 'Francisco', limite: FECHA_AYER },
    [CLAVE_ADM2]: { estado: 'abierto', tipo: 'BAJA', categoria: 'ALUMNADO', tercero: 'Dos Admin, Bea 2222', abiertoPor: 'Francisco', notaEl: NOTA_VIEJA },
    [CLAVE_ESP1]: { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Tres Espera, Cris 3333', abiertoPor: 'Francisco', limite: FECHA_PRONTO },
    [CLAVE_ESP2]: { estado: 'abierto', tipo: 'BAJA', categoria: 'ALUMNADO', tercero: 'Cuatro Espera, Dani 4444', abiertoPor: 'Francisco', limite: FECHA_AYER },
    [CLAVE_DORM1]: { estado: 'abierto', tipo: 'TRASLADO', categoria: 'ALUMNADO', tercero: 'Cinco Dormido, Eva 5555', abiertoPor: 'Francisco', limite: FECHA_AYER, notaEl: NOTA_VIEJA }
  } });

  await escribir('hitos.json', {
    ajustes: {
      responsables: [
        { id: 'diego', nombre: 'Diego', administracion: true },
        { id: 'jefatura', nombre: 'Jefatura', administracion: false }
      ],
      noLectivos: []
    },
    porAsunto: {
      [CLAVE_ADM1]: { creados: '2026-09-01', hitos: [
        { id: 'a1', titulo: 'Revisar el expediente', estado: 'encurso', responsable: 'administracion', fecha: FECHA_AYER }
      ] },
      [CLAVE_ADM2]: { creados: '2026-09-02', hitos: [
        { id: 'b1', titulo: 'Tramitar la baja', estado: 'pendiente', responsable: 'diego' }
      ] },
      [CLAVE_ESP1]: { creados: '2026-09-03', hitos: [
        { id: 'c1', titulo: 'Esperar el visto bueno de Jefatura', estado: 'encurso', responsable: 'jefatura', desde: DESDE_CINCO }
      ] },
      [CLAVE_ESP2]: { creados: '2026-09-04', hitos: [
        { id: 'd1', titulo: 'Esperar respuesta de la familia', estado: 'encurso', responsable: 'tutor', desde: DESDE_VEINTE }
      ] }
      /* CLAVE_DORM1: sin hitos.json, a propósito: sin hito actual. */
    }
  });

  /* La marca de EstadoMigracion (js/estado-migracion.js), puesta a mano:
     sin ella, a los 3 s crea hitos solos para DORM1 (sin hitos.json,
     a propósito) a partir de una guía mínima, y contamina "En
     Administración" y el filtro "Sin hitos" de "Dormidos" a mitad de
     la prueba. */
  await escribir('estado-migrado.json', { hechoEl: '', hechoPor: '', creados: 0, enEspera: 0 });

  await App.cargarRegistro();
  await App.cargarTipos();
}, { CLAVE_ADM1, CLAVE_ADM2, CLAVE_ESP1, CLAVE_ESP2, CLAVE_DORM1,
     FECHA_AYER, FECHA_PRONTO, DESDE_CINCO, DESDE_VEINTE, NOTA_VIEJA });

await pagina.click('#btn-recargar');
await pagina.waitForTimeout(500);
await pagina.evaluate(() => window.Inicio && window.Inicio.repintar());
await pagina.waitForSelector('#inicio-tabla-cuerpo .inicio-tabla-fila');
await pagina.click('#btn-filtros');
await pagina.waitForSelector('#filtros-abiertos:not(.oculto)');

async function irA(pestana) {
  await pagina.click('.inicio-pestana[data-pestana="' + pestana + '"]');
  await pagina.waitForTimeout(200);
}

async function filasYcuenta(pestana) {
  const filas = await pagina.locator('#inicio-tabla-cuerpo .inicio-tabla-fila').count();
  const cuenta = await pagina.locator('.inicio-pestana[data-pestana="' + pestana + '"] .cuenta-lista').textContent();
  return [filas, parseInt(cuenta, 10)];
}

async function conFiltro(select, valor, fn) {
  await pagina.selectOption(select, valor);
  await pagina.waitForTimeout(250);
  await fn();
  await pagina.selectOption(select, '');
  await pagina.waitForTimeout(250);
}

/* ================= 1. "TODOS LOS ABIERTOS": LOS CINCO FILTROS ================= */

console.log('--- 1. "Todos los abiertos": los cinco filtros, y "vuelve todo" al quitarlos ---');
await irA('todos');
await comprobar('de partida, las cinco filas', filasYcuenta('todos'), [5, 5]);

await conFiltro('#filtro-estado', 'administracion', async () => {
  await comprobar('Situación "Nos toca": ADM1, ADM2 y DORM1 (3)', filasYcuenta('todos'), [3, 3]);
});
await comprobar('al quitar Situación, vuelven las cinco', filasYcuenta('todos'), [5, 5]);

await conFiltro('#filtro-plazo', 'vencidos', async () => {
  await comprobar('Plazo "vencidos": ADM1, ESP2 y DORM1 (3)', filasYcuenta('todos'), [3, 3]);
});
await comprobar('al quitar Plazo, vuelven las cinco', filasYcuenta('todos'), [5, 5]);

await conFiltro('#filtro-organo', 'JEFATURA', async () => {
  await comprobar('Lo encarga "Jefatura de Estudios": ADM2 y ESP2 (2)', filasYcuenta('todos'), [2, 2]);
});
await comprobar('al quitar Lo encarga, vuelven las cinco', filasYcuenta('todos'), [5, 5]);

await conFiltro('#filtro-tipo-asunto', 'BAJA', async () => {
  await comprobar('Tipo "BAJA": ADM2 y ESP2 (2)', filasYcuenta('todos'), [2, 2]);
});
await comprobar('al quitar Tipo, vuelven las cinco', filasYcuenta('todos'), [5, 5]);

await conFiltro('#inicio-me-toca-responsable', 'diego', async () => {
  await comprobar('Responsable "Diego": ADM1 (por Administración) y ADM2 (2)', filasYcuenta('todos'), [2, 2]);
});
await comprobar('al quitar Responsable, vuelven las cinco', filasYcuenta('todos'), [5, 5]);

/* ================= 2. "EN ADMINISTRACIÓN": LOS CINCO FILTROS ================= */

console.log('--- 2. "En Administración": los cinco filtros valen aquí también ---');
await irA('adm');
await comprobar('de partida, dos filas (ADM1, ADM2)', filasYcuenta('adm'), [2, 2]);

await conFiltro('#inicio-me-toca-responsable', 'administracion', async () => {
  await comprobar('Responsable "Administración": solo ADM1 (ADM2 es de Diego)', filasYcuenta('adm'), [1, 1]);
});
await comprobar('vuelven las dos', filasYcuenta('adm'), [2, 2]);

await conFiltro('#filtro-tipo-asunto', 'BAJA', async () => {
  await comprobar('Tipo "BAJA": solo ADM2', filasYcuenta('adm'), [1, 1]);
});
await comprobar('vuelven las dos', filasYcuenta('adm'), [2, 2]);

await conFiltro('#filtro-plazo', 'sinplazo', async () => {
  await comprobar('Plazo "sin plazo": solo ADM2', filasYcuenta('adm'), [1, 1]);
});
await comprobar('vuelven las dos', filasYcuenta('adm'), [2, 2]);

await conFiltro('#filtro-organo', 'JEFATURA', async () => {
  await comprobar('Lo encarga "Jefatura de Estudios": solo ADM2', filasYcuenta('adm'), [1, 1]);
});
await comprobar('vuelven las dos', filasYcuenta('adm'), [2, 2]);

await conFiltro('#filtro-estado', 'terceros', async () => {
  await comprobar('Situación "Esperan a terceros" no tiene sentido aquí: tabla vacía, no se esconde la opción', filasYcuenta('adm'), [0, 0]);
  await comprobar('con el texto de vacío de "En Administración"',
    pagina.locator('#inicio-tabla-cuerpo').textContent().then(t => t.indexOf('Nada pendiente de Administración por ahora.') !== -1), true);
});
await comprobar('vuelven las dos', filasYcuenta('adm'), [2, 2]);

/* ================= 3. "EN ESPERA": LOS CINCO FILTROS ================= */

console.log('--- 3. "En espera": los cinco filtros valen aquí también ---');
await irA('esp');
await comprobar('de partida, dos filas (ESP1, ESP2)', filasYcuenta('esp'), [2, 2]);

await conFiltro('#inicio-me-toca-responsable', 'jefatura', async () => {
  await comprobar('Responsable "Jefatura": solo ESP1 (ESP2 es de la familia, ningún papel está en la lista)', filasYcuenta('esp'), [1, 1]);
});
await comprobar('vuelven las dos', filasYcuenta('esp'), [2, 2]);

await conFiltro('#filtro-plazo', 'vencidos', async () => {
  await comprobar('Plazo "vencidos": solo ESP2 (ESP1 vence pronto, no está vencido)', filasYcuenta('esp'), [1, 1]);
});
await comprobar('vuelven las dos', filasYcuenta('esp'), [2, 2]);

await conFiltro('#filtro-organo', 'SECRETARIA', async () => {
  await comprobar('Lo encarga "Secretaría": solo ESP1', filasYcuenta('esp'), [1, 1]);
});
await comprobar('vuelven las dos', filasYcuenta('esp'), [2, 2]);

await conFiltro('#filtro-tipo-asunto', 'TRASLADO', async () => {
  await comprobar('Tipo "TRASLADO": solo ESP1', filasYcuenta('esp'), [1, 1]);
});
await comprobar('vuelven las dos', filasYcuenta('esp'), [2, 2]);

await conFiltro('#filtro-estado', 'sinhitos', async () => {
  await comprobar('Situación "Sin hitos" no tiene sentido aquí: tabla vacía', filasYcuenta('esp'), [0, 0]);
  await comprobar('con el texto de vacío de "En espera"',
    pagina.locator('#inicio-tabla-cuerpo').textContent().then(t => t.indexOf('No se espera a nadie por ahora.') !== -1), true);
});
await comprobar('vuelven las dos', filasYcuenta('esp'), [2, 2]);

/* ================= 4. "DORMIDOS": LOS CINCO FILTROS ================= */

console.log('--- 4. "Dormidos": los cinco filtros valen aquí también ---');
await irA('dorm');
await comprobar('de partida, dos filas (ADM2 y DORM1, dormidos los dos)', filasYcuenta('dorm'), [2, 2]);

await conFiltro('#inicio-me-toca-responsable', 'diego', async () => {
  await comprobar('Responsable "Diego": solo ADM2 (DORM1 no tiene hito actual)', filasYcuenta('dorm'), [1, 1]);
});
await comprobar('vuelven las dos', filasYcuenta('dorm'), [2, 2]);

await conFiltro('#filtro-estado', 'sinhitos', async () => {
  await comprobar('Situación "Sin hitos": solo DORM1', filasYcuenta('dorm'), [1, 1]);
});
await comprobar('vuelven las dos', filasYcuenta('dorm'), [2, 2]);

await conFiltro('#filtro-organo', 'JEFATURA', async () => {
  await comprobar('Lo encarga "Jefatura de Estudios": solo ADM2', filasYcuenta('dorm'), [1, 1]);
});
await comprobar('vuelven las dos', filasYcuenta('dorm'), [2, 2]);

await conFiltro('#filtro-plazo', 'sinplazo', async () => {
  await comprobar('Plazo "sin plazo": solo ADM2 (DORM1 está vencido)', filasYcuenta('dorm'), [1, 1]);
});
await comprobar('vuelven las dos', filasYcuenta('dorm'), [2, 2]);

await conFiltro('#filtro-tipo-asunto', 'TRASLADO', async () => {
  await comprobar('Tipo "TRASLADO": solo DORM1', filasYcuenta('dorm'), [1, 1]);
});
await comprobar('vuelven las dos', filasYcuenta('dorm'), [2, 2]);

/* ================= 5. "FILTROS (N)" CUENTA LOS CINCO, RESPONSABLE INCLUIDO ================= */

console.log('--- 5. "Filtros (N)" cuenta los cinco, Responsable incluido ---');
await comprobar('de partida, sin ninguno puesto', pagina.locator('#btn-filtros').textContent(), 'Filtros');
await pagina.selectOption('#inicio-me-toca-responsable', 'diego');
await pagina.waitForTimeout(200);
await comprobar('con Responsable puesto, "Filtros (1)"', pagina.locator('#btn-filtros').textContent(), 'Filtros (1)');
await pagina.selectOption('#filtro-plazo', 'vencidos');
await pagina.waitForTimeout(200);
await comprobar('con Responsable y Plazo, "Filtros (2)"', pagina.locator('#btn-filtros').textContent(), 'Filtros (2)');

/* ================= 6. "LIMPIAR TODO" TAMBIÉN LIMPIA RESPONSABLE ================= */

console.log('--- 6. "Limpiar todo" también limpia Responsable ---');
await pagina.waitForSelector('#filtros-puestos:not(.oculto)');
await comprobar('"Limpiar todo" está a la vista', pagina.locator('#filtros-puestos .boton-limpiar').isVisible(), true);
await pagina.click('#filtros-puestos .boton-limpiar');
await pagina.waitForTimeout(300);
await comprobar('Responsable queda limpio', pagina.locator('#inicio-me-toca-responsable').inputValue(), '');
await comprobar('Plazo también', pagina.locator('#filtro-plazo').inputValue(), '');
await comprobar('vuelven las dos filas de "Dormidos"', filasYcuenta('dorm'), [2, 2]);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
