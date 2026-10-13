/* Prueba en navegador de verdad de la fila 336 (docs/AVISO-RECOGIDA-DE-CORREOS-PARADA.md): el aviso de
   que la recogida de correos está parada.

   1. Señal reciente (la demostración sin parámetro): ningún aviso.
   2. `latido=viejo`: aviso con fecha; pulsarlo abre el cuadro con los pasos y sus enlaces.
   3. `latido=ninguno`: aviso sin fecha.
   4. Un directivo, con `latido=viejo`, no ve el aviso.
   5. Cuando la señal vuelve a ser reciente, el aviso se quita sin recargar.
   6. La regla de la hora (59 minutos bien, 61 viejo) y la carpeta de la bandeja no la cuenta como correo.
   7. El script de Gmail escribe `latido.json` y lleva la versión de la fila 336. */
import { chromium } from 'playwright';
import fs from 'fs';

const BASE = (process.env.DIRECCION || 'http://localhost:8123/index.html');
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

async function abrir(parametros) {
  const contexto = await navegador.newContext({ viewport: { width: 1400, height: 900 } });
  const pagina = await contexto.newPage();
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
  const errores = [];
  pagina.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.goto(BASE + '?demo=1&auto=1' + parametros);
  await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 30000 });
  /* Espera a que la bandeja haya leído su carpeta, y mira la señal a la fuerza. */
  await pagina.waitForFunction(() => window.Bandeja && Bandeja.carpeta() && window.BandejaLatido, null, { timeout: 20000 });
  await pagina.waitForTimeout(500);
  return { contexto, pagina, errores };
}
const aviso = (p) => p.evaluate(async () => {
  await BandejaLatido.mirar(true);
  const t = document.querySelector('#avisos-linea [data-aviso="recogida-correos"]');
  return t ? t.textContent : null;
});

console.log('--- 1. señal reciente ---');
{
  const { contexto, pagina, errores } = await abrir('&latido=reciente');
  comprobar('1. sin aviso', await aviso(pagina), null);
  comprobar('1. sin errores', errores, []);
  await contexto.close();
}

console.log('--- 2 y 5. señal vieja ---');
{
  const { contexto, pagina, errores } = await abrir('&latido=viejo');
  const t = await aviso(pagina);
  comprobar('2. aviso con fecha', /^La recogida de correos está parada desde \d{2}-[a-z]{3}-\d{4} · \d{2}:\d{2}\. Los correos con la etiqueta GESTOR no llegan\.$/.test(t || ''), true);
  await pagina.click('#avisos-linea [data-aviso="recogida-correos"]');
  await pagina.waitForSelector('#capa:not(.oculto)');
  const cuadro = await pagina.evaluate(() => ({
    titulo: document.getElementById('cuadro-titulo').textContent,
    enlaces: Array.from(document.querySelectorAll('#cuadro-cuerpo a')).map((a) => a.href)
  }));
  comprobar('2. el cuadro lleva los tres enlaces', cuadro.enlaces, [
    'https://script.google.com/home', 'https://script.google.com/home/trash',
    'https://raw.githubusercontent.com/fmargon780/gestor-asuntos-ies/main/apps-script/gestor-correos.gs']);
  await pagina.click('#cuadro-aceptar');
  /* 5. la señal vuelve */
  await pagina.evaluate(async () => {
    await Carpetas.guardarJson(Bandeja.carpeta(), 'latido.json', { hora: new Date().toISOString(), version: 'x', cuenta: 'x' });
  });
  comprobar('5. el aviso desaparece sin recargar', await aviso(pagina), null);
  const correos = await pagina.evaluate(async () => { await Bandeja.mirarDeNuevo(true); return Bandeja.correos().map((c) => c.fichero).sort(); });
  comprobar('6. latido.json no cuenta como correo', correos, ['demo-correo-1.json', 'demo-correo-2.json']);
  comprobar('2. sin errores', errores, []);
  await contexto.close();
}

console.log('--- 3. sin fichero ---');
{
  const { contexto, pagina } = await abrir('&latido=ninguno');
  comprobar('3. aviso sin fecha', await aviso(pagina), 'La recogida de correos no da señales: puede estar parada o sin actualizar.');
  await contexto.close();
}

console.log('--- 4. un directivo ---');
{
  const { contexto, pagina } = await abrir('&latido=viejo&usuario=' + encodeURIComponent('Directora de prueba'));
  await pagina.waitForFunction(() => Perfil.esDirectivo(), null, { timeout: 30000 });   /* la demostración entra otra vez con ese nombre */
  comprobar('4. es directivo', await pagina.evaluate(() => Perfil.esDirectivo()), true);
  comprobar('4. sin aviso', await aviso(pagina), null);
  await contexto.close();
}

console.log('--- 6. la regla de la hora ---');
{
  const { contexto, pagina } = await abrir('&latido=reciente');
  const r = await pagina.evaluate(() => {
    const ahora = Date.now();
    const j = (min) => BandejaLatido._juzgar({ hora: new Date(ahora - min * 60000).toISOString() }, ahora).estado;
    return [j(59), j(61), BandejaLatido._juzgar(null, ahora).estado, BandejaLatido._juzgar({ hora: 'no es una hora' }, ahora).estado];
  });
  comprobar('6. 59 min bien, 61 viejo, sin fichero y roto: ninguno', r, ['reciente', 'viejo', 'ninguno', 'ninguno']);
  await contexto.close();
}

console.log('--- 7. el script de Gmail ---');
{
  const gs = fs.readFileSync(new URL('../apps-script/gestor-correos.gs', import.meta.url), 'utf8');
  comprobar('7. versión de la fila 336', /var VERSION_SCRIPT = '13-oct-2026 · fila 336';/.test(gs), true);
  comprobar('7. escribe latido.json al final de recogerCorreos', /finally \{\s*escribirLatido\(carpeta\);/.test(gs) && /FICHERO_LATIDO = 'latido\.json'/.test(gs), true);
  comprobar('7. cada 10 minutos', /MINUTOS_ENTRE_LATIDOS = 10/.test(gs), true);
}

await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
