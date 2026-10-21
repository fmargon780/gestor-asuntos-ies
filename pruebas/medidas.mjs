/* Prueba en navegador de verdad de la fila 332 (docs/DATOS-1-MEDIDAS.md): el Gestor se mide solo.

   1. Al entrar se apunta `entrar.total` (una vez), y al abrir y al archivar un asunto, sus tiempos;
      las lecturas y escrituras de ficheros llevan el nombre del fichero y su peso.
   2. Rótulos: solo nombres de la lista fija; un nombre de persona o de documento sale como «otro».
   3. Privacidad: nada de lo que se podría enviar lleva un nombre de persona, de asunto, de tipo ni
      de documento de la demostración.
   4. Envío: sin `medidas=1` ninguna petición al buzón; con `medidas=1`, `ok:false` conserva el día
      sin avisar y `ok:true, medidas:true` borra un día pasado y no el de hoy.
   5. Un `localStorage` que lanza no rompe nada.
   6. La tarjeta «Medidas» de Herramientas se pinta. */
import { chromium } from 'playwright';

const BASE = (process.env.DIRECCION || 'http://localhost:8123/index.html');
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

async function abrir(parametros, contestar, antes) {
  const contexto = await navegador.newContext({ viewport: { width: 1400, height: 900 } });
  const pagina = await contexto.newPage();
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  if (antes) await pagina.addInitScript(antes);
  const peticiones = [], cuerpos = [], errores = [];
  await pagina.route('https://script.google.com/**', async (ruta) => {
    peticiones.push(ruta.request().url()); cuerpos.push(ruta.request().postData() || '');
    await (contestar ? contestar(ruta) : ruta.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":false}' }));
  });
  pagina.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.goto(BASE + '?demo=1&auto=1' + parametros);
  await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
  return { contexto, pagina, peticiones, cuerpos, errores };
}
const hoy = (p) => p.evaluate(() => Medidas.leerDia(Medidas.hoy()));

/* ========== 1 y 2. tiempos, pesos y rótulos ========== */
console.log('--- 1 y 2. lo que se apunta ---');
{
  const { contexto, pagina, errores } = await abrir('');
  await pagina.waitForFunction(() => window.Medidas && Medidas.leerDia(Medidas.hoy()).tiempos['entrar.total'], null, { timeout: 15000 });
  const sinEntrar = await pagina.evaluate(() => typeof window.Medidas);
  comprobar('1. existe Medidas', sinEntrar, 'object');
  let d = await hoy(pagina);
  const sumaEntrar = (t) => (t ? Object.values(t.cubos || t.n !== undefined ? [t.n] : t.cubos || []).reduce((a, b) => a + b, 0) : 0);
  comprobar('1. «entrar.total» apuntado una vez', d.tiempos['entrar.total'].n, 1);
  /* abrir y archivar un asunto (uno de mentira: solo importa que se mida) */
  await pagina.evaluate(() => {
    window.__a = { nombre: 'Asunto Fantasma', ficha: { categoria: 'ALUMNADO', tercero: 'Nadie De Nadie 0000000' }, leido: { categoria: 'ALUMNADO' } };
    window.__r = App.cerrarAsunto(window.__a).catch(() => null);
  });
  await pagina.waitForSelector('#capa:not(.oculto)');
  await pagina.click('#cuadro-aceptar');
  await pagina.evaluate(() => window.__r);
  await pagina.evaluate(async () => { try { await App.abrirFicha(App.E.listaAbiertos[0]); } catch (e) { /* sin asuntos en la demostración: solo cuenta que se midió */ } });
  await pagina.waitForTimeout(800);
  d = await hoy(pagina);
  comprobar('1. «asunto.archivar» y «asunto.abrir» apuntados', [!!(d.tiempos['asunto.archivar'] && d.tiempos['asunto.archivar'].n >= 1), !!(d.tiempos['asunto.abrir'] && d.tiempos['asunto.abrir'].n >= 1)], [true, true]);
  const claves = Object.keys(d.tiempos).concat(Object.keys(d.cuentas), Object.keys(d.pesos));
  const raros = claves.filter((k) => !/^(entrar|lista|asunto|archivo|leer|escribir|reintento|sin-remedio|tarde|conflicto|fallo|accesorio|cola|guardar)[.:]/.test(k) && k !== 'entrar.total');
  comprobar('2. ningún rótulo fuera de las familias conocidas', raros, []);
  comprobar('2. rótulos de ficheros', await pagina.evaluate(() => [
    Medidas.rotuloDeFichero({ name: 'x' }, 'asuntos.json'),
    Medidas.rotuloDeFichero({ name: 'presencia' }, 'Garcia Lopez Ana.json'),
    Medidas.rotuloDeFichero({ name: 'x' }, 'Garcia Lopez Ana.pdf'),
    Medidas.rotuloDeFichero({ name: 'x' }, 'Garcia Lopez Ana')
  ]), ['asuntos.json', 'presencia', 'otro.pdf', 'otro']);
  comprobar('1. sin excepciones', errores, []);
  /* ========== 3. privacidad ========== */
  /* La demostración arranca vacía: se buscan el asunto de mentira, su tercero y quien entra, y un fichero con nombre de persona. */
  await pagina.evaluate(async () => {
    Medidas.fichero('leer', async () => 'x')({ name: 'ALUMNADO' }, 'Nadie De Nadie 0000000.pdf');
    Medidas.fichero('escribir', async () => 'x')({ name: 'Perez Gomez, Juan 1234567' }, '260101 MATRICULA Perez Gomez, Juan.docx', 'abc');
  });
  const nombres = ['Fantasma', 'Nadie', 'Revisor', 'Perez', 'Gomez', 'MATRICULA', '1234567'];
  const todo = await pagina.evaluate(() => JSON.stringify(Medidas.leerDia(Medidas.hoy())) + JSON.stringify(MedidasEnviar.cuerpoDe(Medidas.hoy(), Medidas.leerDia(Medidas.hoy()))));
  const colados = nombres.filter((n) => todo.toLowerCase().indexOf(n.toLowerCase()) !== -1);
  comprobar('3. ' + nombres.length + ' nombres de la demostración buscados; ninguno en lo enviable', colados, []);
  /* ========== 6. tarjeta ========== */
  const tarjeta = await pagina.evaluate(() => !!document.querySelector('#bloque-medidas, [data-bloque="medidas"], .tarjeta-medidas') || !!window.MedidasPantalla);
  comprobar('6. la pantalla de medidas existe', tarjeta, true);
  /* La tarjeta abierta se refresca sola (el revisor la vio quieta al volver a Herramientas con el bloque ya abierto). */
  await pagina.click('button.pestana[data-pantalla="herramientas"]');
  await pagina.waitForSelector('#bloque-medidas', { state: 'visible' });
  await pagina.evaluate(() => { document.querySelector('#bloque-medidas').open = true; MedidasPantalla.pintar(); });
  await pagina.evaluate(() => Medidas.cuenta('prueba:refresco'));
  await pagina.waitForFunction(() => /refresco/.test(document.getElementById('medidas-cuerpo').textContent), null, { timeout: 8000 }).catch(() => {});
  comprobar('6. la tarjeta abierta se pone al día sola', await pagina.evaluate(() => /refresco/.test(document.getElementById('medidas-cuerpo').textContent)), true);
  await contexto.close();
}

/* ========== 4. envío ========== */
console.log('--- 4. el envío ---');
{
  const { contexto, pagina, peticiones } = await abrir('');
  await pagina.evaluate(() => MedidasEnviar.pasada());
  await pagina.waitForTimeout(500);
  comprobar('4. sin medidas=1 ninguna petición al buzón', peticiones.length, 0);
  await contexto.close();
}
{
  /* un día pasado guardado de antes */
  const f = new Date(Date.now() - 3 * 86400000);
  const PASADO = f.getFullYear() + '-' + String(f.getMonth() + 1).padStart(2, '0') + '-' + String(f.getDate()).padStart(2, '0');
  const antes = `try { localStorage.setItem('gestor-medidas-${PASADO}', JSON.stringify({ tiempos: { 'entrar.total': { n: 1, ms: 500, max: 500, cubos: [0,1,0,0,0,0,0] } }, cuentas: {}, pesos: {}, foto: null })); } catch (e) {}`;
  let modo = 'no';
  const { contexto, pagina, peticiones, cuerpos, errores } = await abrir('&medidas=1', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: modo === 'si' ? '{"ok":true,"medidas":true}' : '{"ok":false}' }), antes);
  await pagina.evaluate(() => { localStorage.removeItem('gestor-medidas-envio'); });
  const dias0 = await pagina.evaluate(() => Medidas.diasGuardados());
  comprobar('4. el día pasado está guardado', dias0.indexOf(PASADO) !== -1, true);
  await pagina.evaluate(() => MedidasEnviar.pasada());
  await pagina.waitForTimeout(800);
  comprobar('4. con ok:false se manda y el día pasado se conserva', [peticiones.length >= 1, (await pagina.evaluate(() => Medidas.diasGuardados())).indexOf(PASADO) !== -1], [true, true]);
  comprobar('4. el cuerpo es de tipo medidas', JSON.parse(cuerpos[0]).tipo, 'medidas');
  modo = 'si';
  await pagina.evaluate(() => { localStorage.removeItem('gestor-medidas-envio'); return MedidasEnviar.pasada(); });
  await pagina.waitForTimeout(800);
  const dias1 = await pagina.evaluate(() => Medidas.diasGuardados());
  comprobar('4. con ok y medidas se borra el día pasado y no el de hoy', [dias1.indexOf(PASADO) === -1, dias1.indexOf(await pagina.evaluate(() => Medidas.hoy())) !== -1], [true, true]);
  comprobar('4. nunca un aviso en pantalla ni error', [errores.length, await pagina.evaluate(() => document.querySelectorAll('.mensaje').length)], [0, 0]);
  await contexto.close();
}

/* ========== 5. localStorage que lanza ========== */
console.log('--- 5. localStorage roto ---');
{
  const roto = `(function(){ var s = Storage.prototype.setItem; Storage.prototype.setItem = function(k, v) { if (String(k).indexOf('gestor-medidas') === 0) throw new Error('lleno'); return s.apply(this, arguments); }; })();`;
  const { contexto, pagina, errores } = await abrir('', null, roto);
  await pagina.evaluate(() => { Medidas.cuenta('prueba'); Medidas.leerDia(Medidas.hoy()); });
  comprobar('5. con localStorage que lanza, la app entra y no hay excepciones', errores, []);
  await contexto.close();
}

await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
