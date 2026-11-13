/* Prueba en navegador de verdad de los botones de copiar al bajar
   (20-oct-2026, fila 382, docs/BOTONES-DE-COPIAR-AL-BAJAR.md; adaptada a la fila 637): la fila de copiar de la cabecera
   ya no existe, sus botones (Asunto, NIE, DNI, Nombre) son opciones de «Copiar» en el menú «⋯» de la cabecera de una
   línea. Con la columna derecha bajada (ahora cada columna se desplaza sola, la página no), la cabecera sigue a la vista
   en un solo renglón, el menú sigue ofreciendo las cuatro opciones y copiar funciona. Se mira a 1920 y a 1366 px, y con
   el visor de PDF abierto al lado. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const contexto = await navegador.newContext({ viewport: { width: 1920, height: 900 } });
await contexto.grantPermissions(['clipboard-read', 'clipboard-write']);
const pagina = await contexto.newPage();
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

const ALUMNO = '260918 SOLICITUD 26-27 Pérez Ruiz, Ana 1150055';
const ALUMNO_CON_DNI = ALUMNO;
const ALUMNO_SIN_DNI = '260918 SOLICITUD 26-27 López Soto, Iván 1150066';
const PERSONAL = '260918 PERMISO Ordóñez Gil, Rafael';
const EMPRESA = '260918 COMPRA Suministros Escolares SL';
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async ([alumnoConDni, alumnoSinDni, personal, empresa]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: {
      [alumnoConDni]: { tercero: 'Pérez Ruiz, Ana 1150055', categoria: 'ALUMNADO', situacion: 'PENDIENTE' },
      [alumnoSinDni]: { tercero: 'López Soto, Iván 1150066', categoria: 'ALUMNADO', situacion: 'PENDIENTE' },
      [personal]: { tercero: 'Ordóñez Gil, Rafael', categoria: 'PERSONAL', situacion: 'PENDIENTE' },
      [empresa]: { tercero: 'Suministros Escolares SL', categoria: 'EMPRESAS', situacion: 'PENDIENTE' }
    }
  })));
  for (const n of [alumnoConDni, alumnoSinDni, personal, empresa]) {
    await window.__disco.abiertos.getDirectoryHandle(n, { create: true });
  }

  const d = await g.getDirectoryHandle('datos', { create: true });

  const regAlum = [
    'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento;DNI/Pasaporte',
    'Pérez Ruiz, Ana;1150055;2º de E.S.O.;2º A;2026;Matriculada;05/05/2012;12345678Z',
    'López Soto, Iván;1150066;2º de E.S.O.;2º B;2026;Matriculado;10/10/2012;'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RegAlum.csv', window.__disco.fich('RegAlum.csv', regAlum));

  const relPerCen = [
    '"Empleado/a","DNI/Pasaporte","Puesto","Fecha de toma de posesión","Fecha de cese"',
    '"Ordóñez Gil, Rafael","44556677B","Ordenanza","01/09/2015",""'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RelPerCen 26-27.csv', window.__disco.fich('RelPerCen 26-27.csv', relPerCen));

  const empresas = [
    'Razón social;Nombre comercial;NIF;Contacto;Teléfono;Correo',
    'Suministros Escolares SL;;B87654321;Marta;952111222;marta@suministros.es'
  ].join('\r\n') + '\r\n';
  d._hijos.set('empresas.csv', window.__disco.fich('empresas.csv', empresas));
}, [ALUMNO_CON_DNI, ALUMNO_SIN_DNI, PERSONAL, EMPRESA]);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');
await pagina.waitForTimeout(300);

async function abrirFicha(nombre) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.waitForTimeout(150);
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + nombre + '"] .nombre-pulsable').first().click();
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForSelector('.ficha-nombre-menu-boton');
}

await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(150);
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + ALUMNO + '"] .nombre-pulsable').first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('.ficha-nombre-menu-boton');
/* Una lista larga de verdad: la página no baja (cada columna se desplaza sola, fila 425), así que se alarga el hueco
   de «Registro», en la columna de la derecha, para tener por dónde bajar. */
await pagina.addStyleTag({ content: '#ficha-notas { min-height: 2500px; }' });
await pagina.evaluate(() => FichaTarjetas.abrir('notas'));

/* Las opciones de «Copiar» del menú «⋯» que se ven (las de DNI y Nombre salen cuando llega el dato). */
const ABRIR_MENU = async () => {
  if (await pagina.locator('.ficha-menu:not(.oculto)').count() === 0) await pagina.click('.ficha-nombre-menu-boton');
  await pagina.waitForSelector('.ficha-menu:not(.oculto)');
};
const opciones = () => pagina.evaluate(() => {
  const m = document.querySelector('.ficha-menu:not(.oculto)');
  const rot = Array.from(m.children).findIndex((e) => e.classList.contains('ficha-menu-rotulo'));
  return Array.from(m.children).slice(rot + 1).filter((e) => e.classList.contains('ficha-menu-opcion') && !e.hidden && !e.classList.contains('ficha-menu-peligro'))
    .map((b) => b.textContent.trim() + ((r) => (r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= window.innerWidth + 1 ? '' : ' (fuera)'))(b.getBoundingClientRect()));
});
const cerrarMenu = async () => {
  await pagina.keyboard.press('Escape');
  if (await pagina.locator('.ficha-menu:not(.oculto)').count()) await pagina.mouse.click(5, 5);
  await pagina.waitForFunction(() => !document.querySelector('.ficha-menu:not(.oculto)'));
};

/* La columna que se desplaza es la de la derecha (con la lista larga de «Registro»). */
const columna = () => pagina.evaluate(() => { const c = document.getElementById('trabajo-der'); return [c.scrollHeight > c.clientHeight + 100, c.scrollTop]; });
async function bajar() {
  await pagina.evaluate(() => { document.getElementById('trabajo-der').scrollTop = 600; });
  await pagina.waitForFunction(() => document.getElementById('trabajo-der').scrollTop > 100);
}

async function revisar(etiqueta) {
  console.log('--- ' + etiqueta + ' ---');
  await pagina.evaluate(() => { document.getElementById('trabajo-der').scrollTop = 0; });
  await bajar();
  await comprobar(etiqueta + ': la columna de la derecha baja de verdad y la cabecera sigue arriba, en una línea',
    pagina.evaluate(() => {
      const c = document.querySelector('.ficha-cabecera').getBoundingClientRect();
      const l = document.querySelector('.ficha-linea1').getBoundingClientRect();
      return [document.getElementById('trabajo-der').scrollTop > 100, c.top >= -1 && c.top < 40, l.height < 60];
    }), [true, true, true]);
  await ABRIR_MENU();
  /* Nombre y DNI llegan después de pintar: se espera a que salgan, no una pausa fija. */
  await pagina.waitForFunction(() => {
    const m = document.querySelector('.ficha-menu:not(.oculto)');
    return Array.from(m.querySelectorAll('.ficha-menu-opcion:not([hidden])')).map((b) => b.textContent.trim()).filter((t) => /^(Asunto|NIE|DNI|Nombre)$/.test(t)).length >= 4;
  });
  await comprobar(etiqueta + ': «Copiar» ofrece, a la vista, Asunto, NIE, DNI y Nombre',
    opciones(), ['Asunto', 'NIE', 'DNI', 'Nombre']);
  await comprobar(etiqueta + ': sin desplazamiento lateral',
    pagina.evaluate(() => { const h = document.documentElement; return h.scrollWidth <= h.clientWidth + 1; }), true);
  await comprobar(etiqueta + ': «DNI» copia el DNI y avisa',
    (async () => {
      await pagina.locator('.ficha-menu:not(.oculto) .ficha-menu-opcion', { hasText: /^DNI$/ }).click();
      await pagina.waitForFunction(() => Array.from(document.querySelectorAll('#mensajes .mensaje')).some((m) => /Copiado/.test(m.textContent)));
      return pagina.evaluate(() => navigator.clipboard.readText());
    })(), '12345678Z');
  await pagina.waitForFunction(() => !document.querySelector('.ficha-menu:not(.oculto)'));
  await pagina.waitForFunction(() => !Array.from(document.querySelectorAll('#mensajes .mensaje')).some((m) => /Copiado/.test(m.textContent)), null, { timeout: 15000 });
  await pagina.evaluate(() => { document.getElementById('trabajo-der').scrollTop = 0; });
}

await revisar('1920 px');
await pagina.setViewportSize({ width: 1366, height: 700 });
await revisar('1366 px (alto 700)');
await pagina.evaluate(() => {
  document.body.classList.add('con-visor');
  document.documentElement.style.setProperty('--ancho-visor', '520px');
});
await revisar('1366 px con el visor abierto');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
