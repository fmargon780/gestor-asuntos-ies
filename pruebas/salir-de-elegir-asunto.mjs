/* Fila 230 (docs/SALIR-DE-ELEGIR-ASUNTO.md): salir de «Guardar en un
   asunto» cuando el asunto no está: ✕ y Cancelar siempre a la vista,
   Escape que cierra solo el cuadro y botón «No está: crear un asunto
   nuevo». Vale para el documento suelto y para el correo (es el mismo
   cuadro). Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const ASUNTO = '260903 FLEXIBILIDAD 26-27 Pacheco Pérez, Mercedes 019G';
const OTRO = '260910 PERMISO 26-27 Ordóñez Gil, Rafael 677B';

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

/* Dos asuntos abiertos, y tres documentos sueltos en la raíz de
   asuntos abiertos: lo que deja ahí el equipo directivo. */
await pagina.evaluate(async ([nombre, otro]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: {
      [nombre]: { tercero: 'Pacheco Pérez, Mercedes 019G', categoria: 'PERSONAL',
                  situacion: 'A LA ESPERA DEL TERCERO' },
      [otro]: { tercero: 'Ordóñez Gil, Rafael 677B', categoria: 'PERSONAL',
                situacion: 'EN EL DEPARTAMENTO' }
    }
  })));
  await window.__disco.abiertos.getDirectoryHandle(nombre, { create: true });
  await window.__disco.abiertos.getDirectoryHandle(otro, { create: true });

  const raiz = window.__disco.abiertos._hijos;
  raiz.set('Escrito de Ordóñez Gil, Rafael.pdf',
    window.__disco.fich('Escrito de Ordóñez Gil, Rafael.pdf', 'el escrito'));
  raiz.set('Conciliación FL.pdf', window.__disco.fich('Conciliación FL.pdf', 'el impreso'));
  raiz.set('Otro papel cualquiera.pdf',
    window.__disco.fich('Otro papel cualquiera.pdf', 'un papel'));
}, [ASUNTO, OTRO]);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

await pagina.click('.panel[data-vista="clasificar"]');
await pagina.waitForSelector('#lista-sueltos .tarjeta-suelto');

const tarjeta = pagina.locator('#lista-sueltos .tarjeta-suelto').filter({ hasText: 'Conciliación FL.pdf' });
const abierto = () => pagina.evaluate(() => !document.getElementById('capa').classList.contains('oculto'));
const vistaActual = () => pagina.evaluate(() => (document.querySelector('.pantalla:not(.oculto)') || {}).id || '');
async function abrirDelSuelto() {
  await tarjeta.locator('.acciones .boton', { hasText: 'Guardar en un asunto' }).click();
  await pagina.waitForSelector('#capa:not(.oculto) #elegir-cerrar');
}
async function abrirDelCorreo() {
  await pagina.evaluate(() => {
    window.__nuevoConCorreo = 0;
    window.Bandeja.llevarANuevo = function () { window.__nuevoConCorreo++; };
    window.__promesa = App.elegirAsuntoDelCorreo({ datos: { asunto: 'Prueba', texto: '', de: { correo: 'a@b.es' } } });
  });
  await pagina.waitForSelector('#capa:not(.oculto) #elegir-cerrar');
}
async function visibles() {
  return pagina.evaluate(() => {
    const dentro = (el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; };
    return { equis: dentro(document.getElementById('elegir-cerrar')),
             cancelar: dentro(document.getElementById('cuadro-cancelar')) };
  });
}
async function conMuchosAsuntos() {
  await pagina.evaluate(() => {
    const a = App.E.registro.asuntos;
    for (let i = 0; i < 60; i++) a['2609' + String(i).padStart(2, '0') + ' PERMISO 26-27 Relleno ' + i + ', Ana ' + i + 'X'] = { tercero: 'Relleno ' + i + ', Ana', categoria: 'PERSONAL' };
  });
}
await conMuchosAsuntos();
await pagina.setViewportSize({ width: 1200, height: 520 });

for (const entrada of [['documento suelto', abrirDelSuelto], ['correo', abrirDelCorreo]]) {
  const [nombre, abrir] = entrada;
  await abrir();
  await comprobar(nombre + ': ✕ y Cancelar a la vista sin bajar, con muchos asuntos',
    visibles(), { equis: true, cancelar: true });

  const antes = await vistaActual();
  await pagina.click('#elegir-cerrar');
  await comprobar(nombre + ': la ✕ cierra el cuadro', abierto(), false);
  await comprobar(nombre + ': la vista de debajo sigue igual', vistaActual(), antes);

  await abrir();
  await pagina.fill('#enlace-buscar', 'Pacheco');
  await pagina.keyboard.press('Escape');
  await comprobar(nombre + ': un Escape con el buscador escrito cierra el cuadro', abierto(), false);
  await comprobar(nombre + ': y no cierra la vista de debajo', vistaActual(), antes);

  await abrir();
  await pagina.evaluate(() => document.activeElement && document.activeElement.blur());
  await pagina.keyboard.press('Escape');
  await comprobar(nombre + ': Escape sin cursor en el buscador también cierra', abierto(), false);

  await abrir();
  await pagina.click('#cuadro-cancelar');
  await comprobar(nombre + ': Cancelar cierra', abierto(), false);
  await comprobar(nombre + ': el cuadro queda como estaba (Aceptar visible, sin ✕)',
    pagina.evaluate(() => !document.getElementById('cuadro-aceptar').classList.contains('oculto') &&
      !document.getElementById('elegir-cerrar') && !document.getElementById('elegir-crear')), true);
}

/* Elegir un asunto sigue funcionando (correo: guarda con el gancho de la bandeja). */
await pagina.setViewportSize({ width: 1600, height: 950 });
await abrirDelCorreo();
await comprobar('elegir de la lista devuelve ese asunto',
  pagina.evaluate(async (a) => {
    window.Bandeja.guardarEnAsunto = async function (item, e) { window.__elegido = e.nombre; };
    document.querySelector('#enlace-todos .enlace-asunto[data-nombre="' + a + '"]').click();
    await window.__promesa;
    return window.__elegido;
  }, ASUNTO), ASUNTO);

/* «No está»: el del correo llama a Bandeja.llevarANuevo. */
await abrirDelCorreo();
await comprobar('correo: el botón «No está» dice lo suyo',
  pagina.locator('#elegir-crear').textContent(), 'No está: crear un asunto nuevo con este correo');
await pagina.click('#elegir-crear');
await comprobar('correo: cierra y hace lo mismo que «Crear el asunto»',
  pagina.evaluate(async () => { await window.__promesa; return [window.__nuevoConCorreo, !document.getElementById('capa').classList.contains('oculto')]; }),
  [1, false]);

/* «No está»: el del documento abre Nuevo asunto con el documento. */
await abrirDelSuelto();
await comprobar('documento: el botón «No está» dice lo suyo',
  pagina.locator('#elegir-crear').textContent(), 'No está: crear un asunto nuevo con él');
await pagina.click('#elegir-crear');
await pagina.waitForSelector('#pantalla-nuevo:not(.oculto)');
await comprobar('documento: abre «Nuevo asunto»', vistaActual(), 'pantalla-nuevo');
await comprobar('documento: el cuadro queda cerrado', abierto(), false);

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\nTodo bien.');
