/* Prueba de la fila 562 (9-nov-2026, docs/562-RELACIONAR-DESDE-EL-AVISO.md): el aviso de Para, Copia y Copia oculta lleva el botón
   «Relacionar a alguien con el asunto». Chromium real con la copia de pruebas (?demo=1&auto=1).
   1. Lo escrito no encaja con nadie (un nombre o una dirección): el aviso lleva el botón; el botón del pie sigue.
   2. Una dirección: «+ Dar de alta» abre la ficha con esa dirección en la casilla de correo.
   3. Un nombre: el buscador de «Añadir un relacionado» sale con ese nombre escrito.
   4. Al volver al correo, lo que había (una pastilla en Para) sigue. */
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
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.CorreoPara && window.CorreoRelacionar, null, { timeout: 60000 });
await pagina.waitForTimeout(3000);

await pagina.evaluate(async () => {
  const f = await Datos.cargar(App.E.datos, 'ALUMNADO');
  const p = f.lista.filter((x) => App.textoTercero(x).indexOf('Jimenez Rubio, Mateo') === 0)[0];
  Object.assign(p.campos, { 'Nombre Primer tutor': 'Elena', 'Primer apellido Primer tutor': 'Rubio', 'Segundo apellido Primer tutor': 'Sanz', 'Correo Primer tutor': 'elena.rubio@correo-demo.es', 'Relación Primer tutor': 'Madre' });
});

async function abrir() {
  await pagina.evaluate(() => {
    const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('SANCION Jimenez Rubio') !== -1)[0];
    window.__asunto = a;
    CorreoNucleo.abrirCuadro(a, false, { plantilla: '' });
  });
  await pagina.waitForSelector('#capa:not(.oculto) #correo-formulario', { timeout: 15000 });
  await pagina.waitForTimeout(800);
}
async function escribir(campo, texto) { await pagina.fill('#correo-' + campo + '-escribir', texto); await pagina.waitForTimeout(150); }
const boton = (campo) => pagina.evaluate((c) => { const b = document.querySelector('#correo-' + c + ' .cdest-aviso .cdest-relacionar'); return b ? b.textContent : null; }, campo);
const pastillas = () => pagina.evaluate(() => [...document.querySelectorAll('#correo-para .cdest-pastilla strong')].map((e) => e.textContent));
async function elegirEmpresasYBuscar() {
  await pagina.waitForSelector('#rel-picker .categoria-mini-boton', { timeout: 10000 });
  await pagina.click('#rel-picker .categoria-mini-boton:text-is("EMPRESAS")');
  await pagina.waitForTimeout(400);
}

console.log('--- 1. el botón en el aviso ---');
await abrir();
await escribir('para', 'elena');
await pagina.keyboard.press('Enter');
await comprobar('1. con una persona del asunto no hay aviso ni botón', boton('copia'), null);
const antes = await pastillas();
await escribir('copia', 'Papeleria Nueva');
await comprobar('1. un nombre que no encaja: el aviso lleva «Relacionar a alguien con el asunto»', boton('copia'), 'Relacionar a alguien con el asunto');
await escribir('oculta', 'alguien@otro.es');
await comprobar('1. una dirección que no encaja: también', boton('oculta'), 'Relacionar a alguien con el asunto');
await comprobar('1. el botón del pie del cuadro sigue', pagina.evaluate(() => !!document.getElementById('correo-relacionar')), true);

console.log('--- 2. una dirección ---');
await pagina.click('#correo-oculta .cdest-relacionar');
await pagina.waitForSelector('#capa:not(.oculto) #rel-picker', { timeout: 10000 });
await comprobar('2. se abre «Añadir un relacionado»', pagina.evaluate(() => document.getElementById('cuadro-titulo').textContent), 'Añadir un relacionado');
await elegirEmpresasYBuscar();
await pagina.fill('#rel-buscar', 'zzqqxx');
await pagina.waitForSelector('#rel-resultados button', { timeout: 10000 });
await pagina.click('#rel-resultados button:has-text("Dar de alta")');
await pagina.waitForSelector('.alta-campo[data-campo="Correo"]', { timeout: 10000 });
await comprobar('2. la ficha de alta trae la dirección en su casilla de correo', pagina.inputValue('.alta-campo[data-campo="Correo"]'), 'alguien@otro.es');
await pagina.click('#cuadro-cancelar');
await pagina.waitForSelector('#capa:not(.oculto) #correo-formulario', { timeout: 15000 });
await pagina.waitForTimeout(500);
await comprobar('4. al volver al correo, las pastillas de Para siguen', pastillas(), antes);
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => document.getElementById('capa').classList.contains('oculto'));

console.log('--- 3. un nombre ---');
await abrir();
await escribir('copia', 'Papeleria Nueva');
await pagina.click('#correo-copia .cdest-relacionar');
await pagina.waitForSelector('#capa:not(.oculto) #rel-picker', { timeout: 10000 });
await elegirEmpresasYBuscar();
await comprobar('3. el buscador sale con el nombre ya escrito', pagina.inputValue('#rel-buscar'), 'Papeleria Nueva');
await pagina.evaluate(() => document.getElementById('cuadro-cancelar').onclick());   /* el cuadro de elegir no enseña «Cancelar»; se cierra como lo cierra la app */
await pagina.waitForSelector('#capa:not(.oculto) #correo-formulario', { timeout: 15000 });
await pagina.click('#cuadro-aceptar');

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallos' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
