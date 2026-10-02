/* Prueba en navegador de verdad de la fila 260 de docs/COLA.md
   (docs/SOLO-CONSULTA-EN-ESTE-ORDENADOR.md): «En este ordenador, solo consultar».
   Con los datos de demostración y la marca puesta antes de cargar. */
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
const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
const errores = [];
pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); if (!sessionStorage.getItem('yaPuesta')) { localStorage.setItem('gestor.soloConsulta', '1'); sessionStorage.setItem('yaPuesta', '1'); } } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForSelector('#franja-solo-consulta', { timeout: 20000 });
await pagina.waitForTimeout(4000);   /* que acaben las tareas de fondo */
const escrituras = () => pagina.evaluate(() => Demo.escrituras());
const avisos = () => pagina.evaluate(() => Array.prototype.map.call(document.querySelectorAll('#mensajes .mensaje'), (m) => m.className + ':' + m.textContent));

/* 3 y 7. El aviso fijo, sin tapar nada, y ningún aviso por las tareas de fondo. */
await comprobar('3. el aviso fijo dice lo que tiene que decir',
  pagina.locator('#franja-solo-consulta span').textContent(), 'Solo consulta: en este ordenador no se puede cambiar nada.');
await comprobar('7. ningún aviso rojo ni ámbar al entrar', avisos().then((a) => a.filter((x) => /malo|ambar/.test(x))), []);
await comprobar('1. entrar no ha escrito nada', escrituras(), 0);

/* 1. Pasar por las pantallas. */
const abiertos = await pagina.evaluate(() => App.E.listaAbiertos.map((a) => a.nombre));
for (const pantalla of ['abiertos', 'archivo', 'personas', 'herramientas', 'ajustes']) {
  await pagina.evaluate((p) => App.ir(p), pantalla);
  await pagina.waitForTimeout(700);
}
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), abiertos[0]);
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(800);
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(500);
const h = await pagina.evaluate(async (n) => (await Hitos.hitosDe(n))[0].id, abiertos[0]);
await pagina.locator('#ficha-guia .hito[data-id="' + h + '"] .hito-titulo').click();
await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa');
await pagina.waitForTimeout(800);
await comprobar('1. tras pasear por las pantallas, la ficha y la mesa: cero escrituras', escrituras(), 0);
await comprobar('7. y ningún aviso rojo ni ámbar', avisos().then((a) => a.filter((x) => /malo|ambar/.test(x))), []);
await comprobar('3. el aviso sigue arriba en la ficha', pagina.locator('#franja-solo-consulta').isVisible(), true);

/* 4. Apagados, con su motivo. */
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(800);
await comprobar('4. «+ Nuevo asunto» apagado, con motivo',
  pagina.evaluate(() => { const b = document.getElementById('btn-nuevo-asunto'); return b ? [b.disabled, b.title] : null; }), [true, 'Solo consulta']);
await comprobar('4. la caja del tablón apagada',
  pagina.evaluate(() => { const t = document.getElementById('tablon-texto'); return t ? t.disabled : 'sin tablón'; }).then((x) => x === 'sin tablón' || x), true);
await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), abiertos[0]);
await pagina.waitForTimeout(800);
await comprobar('4. la ficha está en modo consulta (sin «Tomar el mando» ni aviso de presencia)',
  pagina.evaluate(() => ({ consulta: document.getElementById('ficha-asunto-cuerpo').classList.contains('ficha-consulta'),
    presencia: !!document.querySelector('#ficha-presencia.aviso') })), { consulta: true, presencia: false });
await comprobar('4. «Ver todo» solo mira: sigue encendido',
  pagina.evaluate(() => { const b = document.getElementById('tercero-ver-todo'); return b ? !b.disabled : 'sin botón'; }).then((x) => x === 'sin botón' || x), true);
await pagina.evaluate(() => App.ir('ajustes'));
await pagina.waitForTimeout(500);
await comprobar('4. en Ajustes se cambia nada salvo la casilla',
  pagina.evaluate(() => ({ casilla: !document.getElementById('ajustes-solo-consulta').disabled,
    otros: Array.prototype.filter.call(document.querySelectorAll('#ajustes-tab-tipos input, #ajustes-tab-centro input'), (i) => !i.disabled && i.type !== 'search').length })),
  { casilla: true, otros: 0 });

/* 2. El cierre aguanta. */
await comprobar('2. escribir un fichero, crear una carpeta y Copias.guardar se rechazan con SoloConsulta',
  pagina.evaluate(async () => {
    const fallo = async (f) => { try { await f(); return 'no falla'; } catch (e) { return e.name; } };
    return [
      await fallo(() => Carpetas.escribirTexto(App.E.gestor, 'x.txt', 'x')),
      await fallo(() => Carpetas.crear(App.E.abiertos, 'XX NUEVA')),
      await fallo(() => Copias.guardar(App.E.gestor, 'x.json', { a: 1 })),
      await fallo(() => App.E.abiertos.removeEntry('lo-que-sea'))
    ];
  }), ['SoloConsulta', 'SoloConsulta', 'SoloConsulta', 'SoloConsulta']);
await comprobar('2. y el contador sigue en 0', escrituras(), 0);

/* 5. Leer sigue funcionando: buscar y abrir. */
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(500);
await comprobar('5. se pueden leer ficheros y carpetas',
  pagina.evaluate(async () => (await Carpetas.subcarpetas(App.E.abiertos)).length > 0 && (await Carpetas.leerJson(App.E.gestor, 'campos.json')) !== undefined), true);

/* 6. Un intento de guardar sale en ámbar, nunca en rojo. */
await pagina.evaluate(() => document.querySelectorAll('#mensajes .mensaje').forEach((m) => m.remove()));
await pagina.evaluate(async () => { try { await Carpetas.escribirTexto(App.E.gestor, 'x.txt', 'x'); } catch (e) { U.fallo('No he podido guardarlo', e); } });
await comprobar('6. el aviso es ámbar y dice «Solo consulta: no se ha guardado nada.»',
  avisos(), ['mensaje ambar:Solo consulta: no se ha guardado nada.']);

/* 9. La casilla de la entrada se recuerda. */
await comprobar('9. la marca está en el navegador', pagina.evaluate(() => localStorage.getItem('gestor.soloConsulta')), '1');

/* 8. «Quitar»: pregunta, recarga y deja la entrada con la casilla sin marcar. */
await pagina.click('#franja-solo-consulta-quitar');
await pagina.waitForSelector('#capa:not(.oculto)');
await comprobar('8. «Quitar» pregunta antes',
  pagina.evaluate(() => document.getElementById('cuadro-cuerpo').textContent.indexOf('¿Quitar «solo consultar» en este ordenador?') === 0), true);
await Promise.all([pagina.waitForNavigation(), pagina.click('#cuadro-aceptar')]);
await pagina.waitForTimeout(500);
await comprobar('8. recarga y la marca ya no está', pagina.evaluate(() => localStorage.getItem('gestor.soloConsulta')), null);

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' FALLOS'); process.exit(1); }
console.log('\nTodo bien.');
