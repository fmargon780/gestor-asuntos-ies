/* Prueba en navegador de verdad de los botones de copiar al bajar
   (20-oct-2026, fila 382, docs/BOTONES-DE-COPIAR-AL-BAJAR.md): con la
   cabecera de la ficha encogida, la fila de copiar (Asunto, Ruta, NIE,
   Nombre, DNI) sigue a la vista y funciona; solo se esconde la línea
   gris. Si no caben en el renglón de la barra de acciones, bajan juntos
   a una línea debajo, sin partirse ni desplazamiento lateral. Se mira a
   1920 y a 1366 px, y con el visor de PDF abierto al lado. */
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
  await pagina.waitForSelector('.ficha-copiar-fila');
}

/* "Nombre" y DNI/CIF viven en el DOM desde el primer pintado, ocultos
   con `hidden` hasta que responde el fichero de datos (18-sep-2026,
   fila 58: así revelarlos no mete un nodo nuevo, y no le hace repintar
   de más al panel de hitos, js/hitos-panel.js). Por eso todo lo de
   aquí filtra `:not([hidden])`: un botón sin dato sigue en el DOM,
   pero no debe contar como "puesto". */
function etiquetas() {
  return pagina.evaluate(() => Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila:not([hidden])'))
    .map((b) => b.textContent.trim()));
}

async function esperarBotones(n) {
  await pagina.waitForFunction((minimo) =>
    document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila:not([hidden])').length >= minimo, n);
}

async function copiarYLeer(etiqueta) {
  await pagina.click('.ficha-copiar-fila .boton-copiar-fila:has-text("' + etiqueta + '")');
  await pagina.waitForFunction((et) => {
    const b = Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila'))
      .find((x) => x.textContent.trim() === 'Copiado');
    return !!b;
  }, etiqueta);
  return pagina.evaluate(() => navigator.clipboard.readText());
}


await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(150);
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto="' + ALUMNO + '"] .nombre-pulsable').first().click();
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForSelector('.ficha-copiar-fila');
/* Una lista larga de verdad: el hueco de la guía se alarga para tener por dónde bajar. */
await pagina.addStyleTag({ content: '#ficha-guia { min-height: 2500px; }' });
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));

const visibles = () => pagina.evaluate(() => {
  const dentro = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= window.innerWidth + 1; };
  return Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila:not([hidden])'))
    .map((b) => b.textContent.trim() + (dentro(b) ? '' : ' (fuera)'));
});

async function bajar() {
  await pagina.evaluate(() => window.scrollTo(0, 600));
  await pagina.waitForFunction(() => document.querySelector('.ficha-cabecera').classList.contains('encogida'));
  /* Nombre y DNI llegan después de medir: se espera a que salgan, no una pausa fija. */
  await pagina.waitForFunction(() =>
    document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila:not([hidden])').length >= 5);
}

async function revisar(etiqueta) {
  console.log('--- ' + etiqueta + ' ---');
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await pagina.waitForFunction(() => !document.querySelector('.ficha-cabecera').classList.contains('encogida'));
  await bajar();
  await comprobar(etiqueta + ': los cinco botones a la vista',
    visibles(), ['Asunto', 'Ruta', 'NIE', 'Nombre', 'DNI']);
  await comprobar(etiqueta + ': la línea gris se esconde y la fila de copiar no',
    pagina.evaluate(() => {
      const s = document.querySelector('.ficha-subtitulo');
      const f = document.querySelector('.ficha-copiar-fila');
      return [!s || getComputedStyle(s).display === 'none', getComputedStyle(f).display !== 'none'];
    }), [true, true]);
  await comprobar(etiqueta + ': fila en un solo renglón y sin desplazamiento lateral',
    pagina.evaluate(() => {
      const bs = Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila:not([hidden])'));
      const tops = new Set(bs.map((b) => Math.round(b.getBoundingClientRect().top)));
      const h = document.documentElement;
      return [tops.size, h.scrollWidth <= h.clientWidth + 1];
    }), [1, true]);
  await comprobar(etiqueta + ': la fila de copiar queda dentro de la cabecera',
    pagina.evaluate(() => {
      const c = document.querySelector('.ficha-cabecera').getBoundingClientRect();
      const f = document.querySelector('.ficha-copiar-fila').getBoundingClientRect();
      return f.bottom <= c.bottom + 1 && f.top >= c.top - 1;
    }), true);
  await comprobar(etiqueta + ': «DNI» copia el DNI',
    (async () => {
      await pagina.click('.ficha-copiar-fila .boton-copiar-fila:has-text("DNI")');
      await pagina.waitForFunction(() => Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila'))
        .some((x) => x.textContent.trim() === 'Copiado'));
      return pagina.evaluate(() => navigator.clipboard.readText());
    })(), '12345678Z');
  await pagina.waitForFunction(() => !Array.from(document.querySelectorAll('.ficha-copiar-fila .boton-copiar-fila'))
    .some((x) => x.textContent.trim() === 'Copiado'));
  await pagina.evaluate(() => window.scrollTo(0, 0));
  await pagina.waitForFunction(() => !document.querySelector('.ficha-cabecera').classList.contains('encogida'));
  await comprobar(etiqueta + ': al subir del todo vuelve la línea gris',
    pagina.evaluate(() => { const s = document.querySelector('.ficha-subtitulo'); return !s || getComputedStyle(s).display !== 'none'; }), true);
}

await revisar('1920 px');
await pagina.setViewportSize({ width: 1366, height: 700 });
await revisar('1366 px (alto 700)');
await pagina.evaluate(() => {
  document.body.classList.add('con-visor');
  document.documentElement.style.setProperty('--ancho-visor', '520px');
});
await revisar('1366 px con el visor abierto');

/* Sin que tiemble: encogida y desplegada no se alternan solas. */
await pagina.evaluate(() => window.scrollTo(0, 600));
await pagina.waitForFunction(() => document.querySelector('.ficha-cabecera').classList.contains('encogida'));
const estados = await pagina.evaluate(() => new Promise((res) => {
  const r = []; let n = 0;
  const t = setInterval(() => { r.push(document.querySelector('.ficha-cabecera').classList.contains('encogida')); if (++n >= 10) { clearInterval(t); res(r); } }, 100);
}));
await comprobar('quieta abajo, la cabecera no tiembla', estados.every((x) => x === true), true);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
