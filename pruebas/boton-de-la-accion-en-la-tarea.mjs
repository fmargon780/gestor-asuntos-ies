/* Fila 410 (22-oct-2026, docs/BOTON-DE-LA-ACCION-EN-LA-TAREA.md): dentro de cada tarea pendiente del hito, el botón de su acción.
   Con Chromium real y los datos inventados de la copia de pruebas (?demo=1&auto=1): «Vidal Soto, Irene» tiene un primer hito
   con tres tareas (generar con plantilla, registrar en Séneca, comunicar por correo con la plantilla del acuse).

   1. «Generar documento» y «Enviar correo» salen en sus tareas; la de registrar no lleva botón; la cabecera no cambia.
   2. «Enviar correo» abre el cuadro de Correo con el destinatario y la plantilla de la receta; al enviar, esa tarea queda
      marcada y su botón desaparece.
   3. «Generar documento» genera el documento y marca esa tarea; su botón desaparece.
   4. Solo consulta: los botones salen apagados, con su título. */
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
async function paginaNueva(consulta) {
  const pagina = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
  pagina.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'todos'); " +
    (consulta ? "if (!sessionStorage.getItem('yaPuesta')) { localStorage.setItem('gestor.soloConsulta', '1'); sessionStorage.setItem('yaPuesta', '1'); }" : '') + " } catch (e) {}");
  await pagina.goto(DIRECCION);
  await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
  await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
  if (consulta) await pagina.waitForSelector('#franja-solo-consulta', { timeout: 20000 });
  await pagina.waitForTimeout(consulta ? 5000 : 3000);
  return pagina;
}
async function abrirMesa(pagina, frag) {
  await pagina.click('button.pestana[data-pantalla="abiertos"]');
  await pagina.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]');
  await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto*="' + frag + '"] .tarjeta-nombre').first().click();
  await pagina.waitForTimeout(1200);
  await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
  await pagina.waitForTimeout(400);
  if (!(await pagina.locator('#ficha-guia.con-mesa').count())) await pagina.locator('#ficha-guia .hito .hito-titulo').first().click();
  await pagina.waitForSelector('#ficha-guia.con-mesa', { timeout: 10000 });
  await pagina.waitForTimeout(600);
}
const botonesDeTareas = (pagina) => pagina.$$eval('.hito-en-mesa .mesa-guion .guion-paso', (l) =>
  l.map((p) => p.dataset.id + ':' + Array.from(p.querySelectorAll('.guion-accion-tarea')).map((b) => b.textContent.trim()).join('|')));

let pagina = await paginaNueva(false);
await abrirMesa(pagina, 'Vidal Soto');

console.log('--- 1. los botones en sus tareas ---');
await comprobar('1. generar y comunicar llevan botón; registrar no',
  botonesDeTareas(pagina), ['g-hacer-generar:Generar documento', 'g-hacer-registrar:', 'g-hacer-comunicar:Enviar correo']);
await comprobar('1. la cabecera no cambia',
  pagina.locator('.hito-en-mesa .mesa-abrir-panel').allTextContents(), ['Generar documento ▾', 'Comunicar ▾']);
await comprobar('1. el botón va delante del «⋮», en la misma línea',
  pagina.evaluate(() => { const f = document.querySelector('.guion-paso[data-id="g-hacer-comunicar"] .guion-paso-fila');
    const c = Array.from(f.children).map((x) => x.matches('.guion-accion-tarea') ? 'accion' : (x.querySelector('.guion-tarea-menu-boton') ? 'menu' : ''));
    return c.indexOf('accion') > -1 && c.indexOf('accion') < c.indexOf('menu'); }), true);

console.log('--- 2. Enviar correo ---');
await pagina.locator('.guion-paso[data-id="g-hacer-comunicar"] .guion-accion-tarea').click();
await pagina.waitForSelector('#capa:not(.oculto) #correo-caja', { timeout: 15000 });
await pagina.waitForTimeout(1500);
await comprobar('2. el cuadro de Correo trae el destinatario y el texto de la plantilla',
  pagina.evaluate(() => { const c = document.getElementById('correo-caja'); const t = c.innerText + ' ' + Array.from(c.querySelectorAll('input,textarea')).map((x) => x.value).join(' ');
    return [/@/.test(t), /certificado de notas que nos solicit/i.test(t)]; }), [true, true]);
await pagina.locator('#correo-caja button:text-is("Enviar")').click();
await pagina.waitForTimeout(600);
await pagina.locator('#cuadro-cuerpo button:visible', { hasText: /^(Sí|Mandar|Enviar ahora|Enviar|Confirmar)/ }).last().click();
await pagina.waitForTimeout(3000);
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(2500);
await comprobar('2. la tarea de comunicar queda marcada y sin botón',
  pagina.evaluate(async () => { const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
    const h = (await Hitos.hitosDe(a.nombre))[0];
    return Hitos.guionDe(a, h).filter((g) => g.hecho).map((g) => g.id); }), ['g-hacer-comunicar']);
await comprobar('2. su botón desaparece y el de generar sigue', botonesDeTareas(pagina),
  ['g-hacer-generar:Generar documento', 'g-hacer-registrar:', 'g-hacer-comunicar:']);

console.log('--- 3. Generar documento ---');
await pagina.locator('.guion-paso[data-id="g-hacer-generar"] .guion-accion-tarea').click();
await pagina.waitForSelector('#word-visor:not(.oculto)', { timeout: 30000 });
await pagina.waitForTimeout(1500);
await pagina.evaluate(() => WordVisor.cerrar());
await pagina.waitForTimeout(1500);
await comprobar('3. la tarea de generar queda marcada y sin botón',
  pagina.evaluate(async () => { const a = Gestor.asuntos().filter((x) => x.nombre.indexOf('Vidal Soto') !== -1)[0];
    const h = (await Hitos.hitosDe(a.nombre))[0];
    return Hitos.guionDe(a, h).filter((g) => g.hecho).map((g) => g.id).sort(); }), ['g-hacer-comunicar', 'g-hacer-generar']);
await comprobar('3. ya no queda ningún botón', botonesDeTareas(pagina),
  ['g-hacer-generar:', 'g-hacer-registrar:', 'g-hacer-comunicar:']);
await pagina.close();

console.log('--- 4. solo consultar ---');
const consulta = await paginaNueva(true);
await abrirMesa(consulta, 'Vidal Soto');
await comprobar('4. los botones salen apagados, con su título',
  consulta.$$eval('.hito-en-mesa .guion-accion-tarea', (l) => l.map((b) => [b.disabled, AyudaRaton.ayuda(b).motivo])),
  [[true, 'Este ordenador está en «solo consulta»: se puede mirar, pero no cambiar nada.'], [true, 'Este ordenador está en «solo consulta»: se puede mirar, pero no cambiar nada.']]);
await consulta.close();

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' fallo(s).' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
