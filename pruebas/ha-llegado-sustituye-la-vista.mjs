/* Prueba en navegador de verdad de la fila 214 (28-sep-2026,
   docs/HA-LLEGADO-SUSTITUYE-LA-VISTA.md): los enlaces «N correos · N
   documentos por clasificar» de Inicio (fila 212) abrían "Ver todo"
   (#zona-clasificar) a la vez que la tabla de asuntos, y la lista
   quedaba abajo del todo, fuera de la pantalla: parecía que el enlace
   no hacía nada.

   1. Pulsar «N documentos por clasificar»: la tabla de asuntos
      (#inicio-cuerpo) y la fila de "Ha llegado"/avisos
      (#inicio-fila-superior) se esconden; la lista queda arriba, y la
      página sube hasta el principio.
   2. Con la pestaña "Todos los abiertos" y la página bajada, volver a
      "clasificar" (guarda ese punto) y pulsar «← Volver a Inicio»:
      se vuelve a esa misma pestaña y a ese mismo punto de la página
      (con margen de pocos píxeles). El punto de partida se deja con
      App.irVista, no con un clic real: un clic de verdad, sobre un
      botón fuera de la pantalla, hace que el propio navegador lo suba
      a la vista antes de disparar el evento (le pasaría lo mismo a
      cualquier botón, también al de compatibilidad de más abajo, que
      es fijo), lo que taparía la propia comprobación.
   3. Lo mismo con el botón de compatibilidad
      (.panel[data-vista="clasificar"]), pulsado con un clic real (ya
      está en la esquina, siempre a la vista, así que no hace falta
      subir la página a mano para pulsarlo).
   4. Si deja de haber nada que clasificar estando dentro, la pantalla
      se queda en "clasificar" (no salta sola a Inicio).
   5. Cambiar de pantalla desde el menú y volver a Inicio deja Inicio
      normal, sin la zona de clasificar a la vista, aunque se hubiera
      dejado a medias; volver desde una ficha no lo toca.

   Reutiliza el disco de mentira de pruebas/navegador.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 900 } });
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

const visible = (sel) => pagina.locator(sel).isVisible();

/* --- entrar, con dos documentos sueltos ("2 documentos por clasificar") --- */
await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');
await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

await pagina.evaluate(async () => {
  const abiertos = window.__disco.abiertos;
  abiertos._hijos.set('260926 escaneo del director.pdf',
    window.__disco.fich('260926 escaneo del director.pdf', 'un papel'));
  abiertos._hijos.set('260927 otro escaneo.pdf',
    window.__disco.fich('260927 otro escaneo.pdf', 'otro papel'));

  /* Sesenta asuntos de relleno, para que "Todos los abiertos" tenga
     lista de sobra para bajar de verdad (mismo truco que
     pruebas/tras-cada-accion.mjs, sección 3). */
  for (let i = 10; i < 70; i++) {
    await abiertos.getDirectoryHandle('2609' + i + ' CONSULTA Relleno Número ' + i, { create: true });
  }
  App.ir('abiertos');
  await App.verAbiertos();
});
await pagina.click('#btn-recargar');
await pagina.waitForSelector('#inicio-ha-llegado-linea .inicio-ha-llegado-trozo');

/* La pestaña "Todos los abiertos" (la única con filas de sobra), y
   esperar a que la tabla (InicioTabla.pintar(), asíncrono) termine de
   pintar las 62 filas de relleno de verdad: si no, su propio "queda a
   la misma altura" (js/inicio-tabla.js) puede pisar el scroll de esta
   prueba más tarde, cuando por fin termine. */
await pagina.click('.inicio-pestana[data-pestana="todos"]');
await pagina.waitForFunction(() => document.querySelectorAll('#inicio-tabla-cuerpo tr').length >= 60);
await pagina.waitForTimeout(300);

/* ================= 1. "N DOCUMENTOS POR CLASIFICAR" SUSTITUYE LA VISTA ================= */

console.log('--- 1. pulsar "2 documentos por clasificar" sustituye la vista, arriba ---');
await pagina.locator('#inicio-ha-llegado-linea .inicio-ha-llegado-trozo').nth(0).click();
await pagina.waitForTimeout(300);
await comprobar('la tabla de asuntos se esconde', visible('#inicio-cuerpo'), false);
await comprobar('la fila de "Ha llegado"/avisos se esconde', visible('#inicio-fila-superior'), false);
await comprobar('"Ver todo" está a la vista', visible('#zona-clasificar'), true);
await comprobar('la lista de documentos está', visible('#lista-sueltos'), true);
await comprobar('la página ha subido del todo', pagina.evaluate(() => window.scrollY), 0);
await comprobar('el botón dice «← Volver a Inicio»',
  pagina.locator('#btn-ha-llegado-volver').textContent(), '← Volver a Inicio');

await pagina.click('#btn-ha-llegado-volver');
await pagina.waitForTimeout(300);

/* ================= 2. VUELVE A LA MISMA PESTAÑA Y AL MISMO PUNTO ================= */

console.log('--- 2. «← Volver a Inicio» devuelve la misma pestaña y el mismo punto ---');
/* Bajar la página y entrar en "clasificar" en la misma llamada: hecho
   por separado, el propio navegador ya habría recortado scrollY a 0
   entre medias (al esconder #inicio-cuerpo la página se queda sin
   alto de sobra), antes incluso de que App.irVista tuviera ocasión de
   guardarlo. */
const resultado = await pagina.evaluate(() => {
  window.scrollTo(0, 900);
  var antes = window.scrollY;
  App.irVista('clasificar');
  return { antes: antes, guardado: App.E.scrollAlEntrarClasificar };
});
const alto = resultado.antes;
const cerca = (y) => Math.abs(y - alto) <= 12;
await pagina.waitForTimeout(300);
await comprobar('se guarda el punto de antes de entrar', resultado.guardado, alto);
await comprobar('con el punto de antes guardado ("clasificar" ya a la vista)',
  visible('#zona-clasificar'), true);

await pagina.click('#btn-ha-llegado-volver');
await pagina.waitForTimeout(300);
await comprobar('la tabla de asuntos vuelve', visible('#inicio-cuerpo'), true);
await comprobar('la fila de arriba vuelve', visible('#inicio-fila-superior'), true);
await comprobar('"Ver todo" se esconde', visible('#zona-clasificar'), false);
await comprobar('sigue en "Todos los abiertos"',
  pagina.locator('.inicio-pestana[data-pestana="todos"]').evaluate((b) => b.classList.contains('activa')), true);
await comprobar('el mismo punto de la página', pagina.evaluate(() => window.scrollY).then(cerca), true);

/* ================= 3. EL BOTÓN DE COMPATIBILIDAD, LO MISMO ================= */

console.log('--- 3. .panel[data-vista="clasificar"] hace lo mismo ---');
/* Este botón está siempre a la vista (posición fija, esquina), así
   que un clic de Playwright no debería tener que mover la página para
   pulsarlo; aun así, el propio navegador la sube al enfocarlo (le
   pasa a cualquier botón que no esté ya a la vista: aquí no importa,
   solo se comprueba que muestra y esconde lo que toca, no el punto de
   la página, ya cubierto en el punto 2). */
await pagina.click('.panel[data-vista="clasificar"]');
await pagina.waitForTimeout(300);
await comprobar('la tabla se esconde también así', visible('#inicio-cuerpo'), false);
await comprobar('"Ver todo" está a la vista', visible('#zona-clasificar'), true);

await pagina.click('#btn-ha-llegado-volver');
await pagina.waitForTimeout(300);
await comprobar('vuelve a la tabla', visible('#inicio-cuerpo'), true);
await comprobar('sigue en "Todos los abiertos"',
  pagina.locator('.inicio-pestana[data-pestana="todos"]').evaluate((b) => b.classList.contains('activa')), true);

/* ================= 4. NADA QUE CLASIFICAR: SE SIGUE DENTRO ================= */

console.log('--- 4. si deja de haber nada que clasificar, se sigue dentro ---');
await pagina.locator('#inicio-ha-llegado-linea .inicio-ha-llegado-trozo').nth(0).click();
await pagina.waitForTimeout(300);
await pagina.evaluate(() => {
  window.__disco.abiertos._hijos.delete('260926 escaneo del director.pdf');
  window.__disco.abiertos._hijos.delete('260927 otro escaneo.pdf');
  App.pintarSueltos();
});
await pagina.waitForTimeout(200);
await comprobar('no salta sola a Inicio: sigue en "clasificar"', pagina.evaluate(() => App.E.vista), 'clasificar');
await comprobar('"Ver todo" sigue a la vista', visible('#zona-clasificar'), true);
await comprobar('la tabla de asuntos sigue escondida', visible('#inicio-cuerpo'), false);

/* ================= 5. CAMBIAR DE PANTALLA Y VOLVER, INICIO NORMAL ================= */

console.log('--- 5. cambiar de pantalla y volver a Inicio, sin la zona de clasificar ---');
await pagina.evaluate(() => App.ir('archivo'));
await pagina.waitForTimeout(200);
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(200);
await comprobar('Inicio, normal (la tabla a la vista)', visible('#inicio-cuerpo'), true);
await comprobar('"clasificar" ya no está a la vista', visible('#zona-clasificar'), false);
await comprobar('la vista guardada vuelve a ser "departamento"', pagina.evaluate(() => App.E.vista), 'departamento');

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
