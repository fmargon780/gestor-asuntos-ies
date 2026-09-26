/* Prueba en navegador de verdad de la fila 175 de docs/COLA.md
   (docs/PERSONAS-ARCHIVO-Y-MENU.md): la ficha de una persona enseña
   sus asuntos pulsables y "+ Nuevo asunto para esta persona"; el
   Archivo carga solo; el buscador de Asuntos abiertos busca en todos
   los montones; y el plazo de un paso de la guía no se pierde sin
   avisar si falta el "desde".

   (El menú nace abierto en pantalla ancha, fila 175 punto 4, ya lo
   comprueban de sobra los ~40 ficheros que ya no tienen que pulsar
   "#btn-barra" para ver las pestañas: esta prueba, con ventana ancha,
   se apoya en ese mismo comportamiento.)

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
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

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

const NOMBRE = 'Buscada García, Ana';

/* ================================================================
   0) Fijo: crea, desde "Nuevo asunto", el asunto de MATRICULA (sin
      guía, montón "Nos toca") de la persona que usan los puntos
      siguientes.
   ================================================================ */
console.log('--- se prepara el primer asunto de la persona (MATRICULA) ---');

await pagina.click('.pestana[data-pantalla="nuevo"]');
await pagina.click('.categoria-boton[data-categoria="ALUMNADO"]');
await pagina.getByRole('button', { name: 'MATRICULA', exact: true }).click();
await pagina.fill('#buscar-tercero', NOMBRE);
await pagina.waitForTimeout(300);
await pagina.getByRole('button', { name: '+ Dar de alta un solicitante' }).click();
await pagina.waitForSelector('#capa:not(.oculto)');
await pagina.fill('.alta-campo[data-campo="Nombre"]', NOMBRE);
await pagina.fill('.alta-campo[data-campo="Nº Id. Escolar"]', '1112223');
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#tercero-elegido:not(.oculto)');
await pagina.fill('#campo-fecha', '2026-09-20');
await pagina.fill('#campo-descripcion', 'Matrícula de prueba');
await pagina.waitForTimeout(150);
await pagina.click('#btn-crear');
await Promise.race([
  pagina.waitForSelector('#pantalla-asunto:not(.oculto)'),
  pagina.waitForSelector('#capa:not(.oculto)')
]);
if (await pagina.locator('#capa:not(.oculto)').isVisible().catch(() => false)) await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');

/* Un segundo asunto de la misma persona, en el montón "Esperan a
   terceros": una guía con un solo hito a cargo del papel fijo
   "tercero" basta para que quede ahí, sin tocar hitos a mano. */
console.log('--- se prepara el segundo asunto de la persona (CERTIFICADO, en espera) ---');

const ASUNTO_2 = '260920 CERTIFICADO 26-27 ' + NOMBRE + ' 1112223';
await pagina.evaluate(async ([nombre, asunto2, tercero]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  const h = await g.getFileHandle('guias.json', { create: true });
  const w = await h.createWritable();
  await w.write(JSON.stringify({ CERTIFICADO: [
    { id: 'cert-1', titulo: 'A la espera de la familia', cuerpo: '', opciones: [], responsable: 'tercero' }
  ] }));
  await w.close();
  await window.__disco.abiertos.getDirectoryHandle(asunto2, { create: true });
  await window.App.anotar(asunto2, {
    abiertoEl: window.U.ahora(), tipo: 'CERTIFICADO', categoria: 'ALUMNADO',
    tercero: tercero, curso: '26-27', grupo: '', descripcion: '', campos: {}
  });
  await window.Hitos.crearDesdeGuia(asunto2, 'CERTIFICADO');
  await window.App.verAbiertos();
}, [NOMBRE, ASUNTO_2, NOMBRE + ' 1112223']);

/* ================================================================
   1) La ficha de la persona enseña sus asuntos, pulsables.
   ================================================================ */
console.log('--- 1. la ficha de una persona enseña sus asuntos, sin pulsar nada ---');

await pagina.click('.pestana[data-pantalla="personas"]');
await pagina.fill('#buscar-personas', 'Buscada');
await pagina.waitForSelector('#lista-personas .resultado');
await pagina.click('#lista-personas .resultado');
await pagina.waitForSelector('#asuntos-del-tercero .resultado');
await comprobar('1. "Sus asuntos" cuenta los dos, sin pulsar nada',
  pagina.locator('#titulo-sus-asuntos').textContent(), 'Sus asuntos (2)');
await comprobar('1. salen los dos asuntos de la persona',
  pagina.locator('#asuntos-del-tercero .resultado').count(), 2);

await pagina.locator('#asuntos-del-tercero .resultado', { hasText: 'MATRICULA' }).click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await comprobar('1. pulsar una fila abre la ficha del asunto',
  pagina.locator('#pantalla-asunto').isVisible(), true);

await pagina.keyboard.press('Escape');
await pagina.waitForTimeout(150);
await comprobar('1. al volver, se está en Personas, con la misma persona elegida',
  pagina.locator('.pestana[data-pantalla="personas"]').evaluate(el => el.classList.contains('activa')), true);
await comprobar('1. la ficha de Ana sigue enseñada',
  pagina.locator('#ficha-persona h4').first().textContent().then(t => t.indexOf('Buscada') !== -1), true);

/* ================================================================
   2) "+ Nuevo asunto para esta persona".
   ================================================================ */
console.log('--- 2. "+ Nuevo asunto para esta persona" deja la persona esperando ---');

await pagina.click('#nuevo-asunto-persona');
await pagina.waitForSelector('#pantalla-nuevo:not(.oculto)');
await comprobar('2. lleva a Nuevo asunto con la categoría ya elegida',
  pagina.locator('.categoria-boton[data-categoria="ALUMNADO"]').evaluate(el => el.classList.contains('elegido')), true);
await comprobar('2. y con ella esperando a que se elija el tipo',
  pagina.locator('#tercero-propuesto-nuevo').textContent().then(t => t.indexOf('Buscada') !== -1), true);

/* ================================================================
   3) El Archivo carga solo al entrar.
   ================================================================ */
console.log('--- 3. el Archivo pinta la lista sin pulsar nada ---');

await pagina.click('.pestana[data-pantalla="archivo"]');
await pagina.waitForFunction(() => document.getElementById('explica-archivo').textContent.indexOf('asuntos archivados') !== -1);
await comprobar('3. la lista está pintada (sin archivados todavía, pero sin "Pulsa Actualizar")',
  pagina.locator('#explica-archivo').textContent().then(t => t.indexOf('Pulsa Actualizar') === -1), true);

/* ================================================================
   4) El buscador de Asuntos abiertos busca en todos los montones.
   ================================================================ */
console.log('--- 4. el buscador de Asuntos abiertos busca en todos los montones ---');

await pagina.click('.pestana[data-pantalla="abiertos"]');
await pagina.click('.panel[data-vista="departamento"]');
await pagina.waitForTimeout(150);
await comprobar('4. sin buscar, en "Nos toca" solo sale el de MATRICULA',
  pagina.locator('#lista-abiertos .tarjeta').count(), 1);
await comprobar('4. la línea de "buscando en todos" no se ve',
  pagina.locator('#buscando-en-todos').isVisible(), false);

await pagina.fill('#buscar-abiertos', 'Buscada');
await pagina.waitForTimeout(250);
await comprobar('4. buscando, salen los dos asuntos (el de "Nos toca" y el de "Esperan a terceros")',
  pagina.locator('#lista-abiertos .tarjeta').count(), 2);
await comprobar('4. avisa de que busca en todos los montones',
  pagina.locator('#buscando-en-todos').isVisible(), true);

await pagina.fill('#buscar-abiertos', '');
await pagina.waitForTimeout(150);
await comprobar('4. al vaciar el buscador, vuelve a filtrar por el montón elegido',
  pagina.locator('#lista-abiertos .tarjeta').count(), 1);

/* ================================================================
   5) El plazo de un paso no se pierde sin avisar.
   ================================================================ */
console.log('--- 5. la guía no se guarda con días de plazo sin "desde" ---');

await pagina.evaluate(() => { window.__pasosGuardados = window.Guias.editar('PRUEBAPLAZO175', [], [], []); });
await pagina.waitForSelector('#guia-anadir');
await pagina.click('#guia-anadir');
await pagina.waitForSelector('#guia-pasos .paso-titulo');
await pagina.fill('#guia-pasos .paso-titulo', 'Paso base');
await pagina.click('#guia-anadir');
await pagina.waitForTimeout(150);
await pagina.locator('#guia-pasos .paso-titulo').nth(1).fill('Paso con plazo suelto');
await pagina.locator('#guia-pasos .paso-extra summary').nth(1).click();
await pagina.locator('#guia-pasos .paso-plazo-dias').nth(1).fill('10');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(200);
await comprobar('5. "Guardar" no cierra el cuadro con días sin "desde"',
  pagina.locator('#capa:not(.oculto)').count(), 1);
await comprobar('5. avisa, nombrando el paso',
  pagina.locator('#mensajes .mensaje.malo').last().textContent()
    .then(t => t.indexOf('Paso con plazo suelto') !== -1 && t.indexOf('desde') !== -1), true);
await comprobar('5. dentro del acordeón, el paso con el problema queda abierto',
  pagina.locator('#guia-pasos .paso-editor').nth(1).evaluate(el => !el.classList.contains('paso-plegado')), true);
await comprobar('5. y el foco está en su desplegable "desde"',
  pagina.evaluate(() => document.activeElement && document.activeElement.className), 'campo paso-plazo-desde');

await pagina.locator('#guia-pasos .paso-plazo-desde').nth(1).selectOption({ label: 'Paso base' });
await pagina.click('#cuadro-aceptar');
await pagina.waitForSelector('#capa', { state: 'hidden' });
await comprobar('5. con "desde" elegido, "Guardar" sí guarda y cierra',
  pagina.evaluate(async () => {
    const pasos = await window.__pasosGuardados;
    const p = pasos && pasos[1];
    return !!(p && p.plazo && p.plazo.dias === 10 && p.plazo.desde);
  }), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' prueba(s) han fallado.' : '\nTodas las pruebas pasan.');
await navegador.close();
process.exit(fallos ? 1 : 0);
