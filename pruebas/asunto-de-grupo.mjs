/* Fila 293 (docs/TRABAJO-EN-BLOQUE.md): crear un asunto para un grupo de personas, y que no tenga una persona detrás.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. La lógica, sin pantalla: `esGrupo` (un texto «1ºA» en `ficha.grupo` no es un grupo), la categoría común u `OTROS`, el
      nombre que sale de un solo atajo.
   2. «Nuevo asunto»: el botón; con una sola persona señalada, apagado; desde una unidad con una persona quitada el nombre
      sale relleno; con una persona añadida a mano, vacío y obligatorio; «Grupo <nombre> · N personas» y «Cambiar».
   3. Crear: la carpeta termina en `GRUPO <nombre>`, `ficha.grupo` y los relacionados quedan guardados de una escritura, sin
      foto de contacto; la ficha dice «Grupo de N personas» y no «no encontrado»; el formulario vuelve a salir limpio.
   4. Una categoría mezclada da `OTROS`.
   5. `GRUPO …` no sale como persona en el buscador de «Nuevo asunto» ni en «Personas y empresas».
   6. En el asunto de grupo de la demostración: «Hacer este hito» no sale; Inicio dice «Grupo 2ºB · 8» y lo encuentra por el
      apellido de una persona; «Quién lo pide» no propone «el propio interesado»; «Cambiar el asunto» cambia el nombre del
      grupo y sigue siendo un grupo. */
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
pagina.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 4).join(' | ')));
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
await pagina.waitForTimeout(4000);

/* Escribe en el buscador del cuadro, espera a que salgan SUS resultados y señala el primero. */
async function señalar(texto) {
  await pagina.fill('#rel-buscar', texto);
  await pagina.waitForFunction((t) => [...document.querySelectorAll('#rel-resultados .resultado-marcable')].some((r) => r.textContent.toLowerCase().indexOf(t.toLowerCase()) !== -1), texto);
  await pagina.locator('#rel-resultados .resultado-marcable', { hasText: texto }).first().locator('input').check();
}

/* ================= 1. LA LÓGICA ================= */
console.log('--- 1. la lógica ---');
await comprobar('1. esGrupo: solo un objeto con nombre; un texto «1ºA» no es un grupo',
  pagina.evaluate(() => [AsuntoDeGrupo.esGrupo({ ficha: { grupo: { nombre: '2ºB' } } }), AsuntoDeGrupo.esGrupo({ ficha: { grupo: '1ºA' } }),
    AsuntoDeGrupo.esGrupo({ ficha: {} }), AsuntoDeGrupo.esGrupo(null)]), [true, false, false, false]);
await comprobar('1. la categoría: la de todas si es una sola; si se mezclan, OTROS',
  pagina.evaluate(() => [AsuntoDeGrupo._interno.categoriaDe([{ categoria: 'ALUMNADO' }, { categoria: 'ALUMNADO' }]),
    AsuntoDeGrupo._interno.categoriaDe([{ categoria: 'ALUMNADO' }, { categoria: 'PERSONAL' }])]), ['ALUMNADO', 'OTROS']);
await comprobar('1. el nombre sale de un solo atajo; sin atajo, o con alguien ajeno a él, vacío y «mano»',
  pagina.evaluate(() => {
    const m = (n) => ({ categoria: 'ALUMNADO', nombre: n });
    const atajo = { tipo: 'unidad', valor: '2º B', lista: [{ categoria: 'ALUMNADO', nombre: 'A', unidad: '2º B', curso: '2º de E.S.O.' }, { categoria: 'ALUMNADO', nombre: 'B' }] };
    const f = AsuntoDeGrupo._interno.origenYNombre;
    return [f([m('A')], [atajo]), f([m('A'), m('C')], [atajo]), f([m('A')], []), f([m('A')], [atajo, { tipo: 'nivel', valor: '2º', lista: [] }])];
  }), [{ origen: 'unidad', nombre: '2ºB' }, { origen: 'mano', nombre: '' }, { origen: 'mano', nombre: '' }, { origen: 'mano', nombre: '' }]);

/* ================= 2. NUEVO ASUNTO ================= */
console.log('--- 2. «Nuevo asunto» ---');
await pagina.evaluate(() => App.ir('nuevo'));
await pagina.waitForTimeout(500);
await comprobar('2. debajo del buscador hay un botón «Es para un grupo de personas»',
  pagina.locator('#btn-grupo-nuevo').textContent(), 'Es para un grupo de personas');

/* Una sola persona señalada: apagado. */
await pagina.click('#btn-grupo-nuevo');
await pagina.click('#capa .categoria-mini-boton:text("ALUMNADO")');
await señalar('Klein');
await comprobar('2. con una sola persona señalada, «Usar los 1 señalados» está apagado',
  pagina.evaluate(() => { const b = document.getElementById('rel-marcados-anadir'); return [b.textContent, b.disabled]; }), ['Usar los 1 señalados', true]);
await señalar('Jimenez');
await comprobar('2. con dos, se enciende',
  pagina.evaluate(() => { const b = document.getElementById('rel-marcados-anadir'); return [b.textContent, b.disabled]; }), ['Usar los 2 señalados', false]);
await pagina.click('#rel-marcados-anadir');
await comprobar('2. sin atajo, el nombre del grupo sale vacío y no se puede aceptar',
  pagina.evaluate(() => [document.getElementById('grupo-nombre').value, document.getElementById('cuadro-aceptar').disabled]), ['', true]);
await pagina.fill('#grupo-nombre', 'Los de prueba');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await comprobar('2. el formulario dice «Grupo <nombre> · N personas», con «Cambiar»',
  pagina.locator('#tercero-elegido').evaluate((e) => [e.querySelector('strong').textContent, e.querySelector('button').textContent]), ['Grupo Los de prueba · 2 personas', 'Cambiar']);
await comprobar('2. el tercero del formulario es «GRUPO Los de prueba», de categoría ALUMNADO (las dos personas lo son)',
  pagina.evaluate(() => [App.textoTercero(App.E.nuevo.tercero), App.E.nuevo.tercero.categoria]), ['GRUPO Los de prueba', 'ALUMNADO']);

/* «Cambiar» vuelve al buscador con los mismos señalados. */
await pagina.click('#btn-cambiar-tercero');
await comprobar('2. «Cambiar» vuelve al cuadro con los mismos señalados',
  pagina.locator('.marcados-cuenta').textContent(), '2 señalados');
await pagina.click('#cuadro-cancelar');
await comprobar('2. y cancelar deja el grupo que había', pagina.locator('#tercero-elegido strong').textContent(), 'Grupo Los de prueba · 2 personas');

/* Desde una unidad, con una persona quitada: el nombre sale de la unidad. */
await pagina.evaluate(() => App.ir('nuevo'));
await pagina.waitForTimeout(400);
await comprobar('2. el formulario vuelve a salir limpio: sin grupo de la vez anterior',
  pagina.evaluate(() => [App.E.nuevo.tercero, document.getElementById('tercero-elegido').classList.contains('oculto')]), [null, true]);
await pagina.click('#btn-grupo-nuevo');
await pagina.click('#capa .categoria-mini-boton:text("ALUMNADO")');
await pagina.waitForSelector('#atajo-unidad');
await pagina.selectOption('#atajo-unidad', '4º A');
await comprobar('2. el atajo de la unidad señala a sus cuatro personas',
  pagina.locator('.marcados-cuenta').textContent(), '4 señalados');
await pagina.locator('.marcado-quitar').first().click();
await pagina.click('#rel-marcados-anadir');
await comprobar('2. quitar a una no quita el nombre: sale relleno con el de la unidad',
  pagina.inputValue('#grupo-nombre'), '4ºA');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await comprobar('2. «Grupo 4ºA · 3 personas»', pagina.locator('#tercero-elegido strong').textContent(), 'Grupo 4ºA · 3 personas');
await comprobar('2. la parrilla enseña los tipos de alumnado',
  pagina.evaluate(() => [...document.querySelectorAll('#tipos-lista .tipo-boton')].map((b) => b.dataset.categoria).filter((c, i, l) => l.indexOf(c) === i)), ['ALUMNADO']);

/* ================= 3. CREAR ================= */
console.log('--- 3. crear ---');
await pagina.click('#tipos-lista .tipo-boton:text("CERTIFICADO DE NOTAS")');
await pagina.waitForTimeout(400);
await pagina.click('#btn-crear');
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)', { timeout: 15000 });
await pagina.waitForTimeout(2500);
const nombre = await pagina.evaluate(() => App.E.listaAbiertos.filter((a) => /GRUPO 4ºA$/.test(a.nombre))[0].nombre);
await comprobar('3. la carpeta se llama «… GRUPO 4ºA»', /^\d{6} A26-\d{4} CERTIFICADO DE NOTAS GRUPO 4ºA$/.test(nombre), true);
await comprobar('3. `ficha.grupo` y los relacionados, guardados; sin foto de contacto',
  pagina.evaluate((n) => { const f = App.E.registro.asuntos[n]; return [f.grupo.nombre, f.grupo.origen, !!f.grupo.creado, f.relacionados.length, f.relacionados.every((r) => r.categoria === 'ALUMNADO'), f.tercero, f.categoria, f.contacto === undefined]; }, nombre),
  ['4ºA', 'unidad', true, 3, true, 'GRUPO 4ºA', 'ALUMNADO', true]);
await comprobar('3. «Datos y contacto» dice «Grupo de 3 personas», sin «no encontrado»',
  pagina.locator('#ficha-contacto-caja').textContent().then((t) => [t.indexOf('Grupo de 3 personas') !== -1, /no encontrado|no aparece/i.test(t)]), [true, false]);
await comprobar('3. la tarjeta se llama «Personas del grupo (3)»',
  pagina.locator('.ficha-tarjeta[data-tarjeta="relacionados"] .ficha-titulo').first().textContent().then((t) => t.trim()), 'Personas del grupo (3)');
await comprobar('3. al crear, el formulario vuelve a salir limpio',
  pagina.evaluate(() => { App.ir('nuevo'); return [App.E.nuevo.tercero, document.getElementById('tercero-elegido').classList.contains('oculto'), document.getElementById('buscar-tercero').value]; }), [null, true, '']);

/* ================= 4. CATEGORÍA MEZCLADA ================= */
console.log('--- 4. categoría mezclada ---');
await pagina.click('#btn-grupo-nuevo');
await pagina.click('#capa .categoria-mini-boton:text("ALUMNADO")');
await señalar('Klein');
await pagina.click('#capa .categoria-mini-boton:text("PERSONAL")');
await señalar('Otero');
await pagina.click('#rel-marcados-anadir');
await pagina.fill('#grupo-nombre', 'Mezcla');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(500);
await comprobar('4. alumnado y personal juntos: la categoría del asunto es OTROS',
  pagina.evaluate(() => [App.E.nuevo.tercero.categoria, App.E.nuevo.categoria]), ['OTROS', 'OTROS']);

/* ================= 5. GRUPO NO ES UNA PERSONA ================= */
console.log('--- 5. «GRUPO» no sale como persona ---');
await pagina.evaluate(() => App.ir('nuevo'));
await pagina.waitForTimeout(300);
await pagina.fill('#buscar-tercero', 'GRUPO');
await pagina.waitForTimeout(900);
await comprobar('5. en el buscador de «Nuevo asunto», «GRUPO» no encuentra a nadie',
  pagina.locator('#resultados-tercero .resultado').count(), 0);
await pagina.evaluate(() => App.ir('personas'));
const sale = [];
for (const cat of ['ALUMNADO', 'PERSONAL', 'EMPRESAS', 'OTROS']) {
  await pagina.selectOption('#filtro-personas', cat);
  await pagina.fill('#buscar-personas', 'GRUPO');
  await pagina.waitForTimeout(500);
  sale.push(await pagina.locator('#lista-personas .resultado').count());
}
await comprobar('5. ni en «Personas y empresas», en ninguna categoría', sale, [0, 0, 0, 0]);

/* ================= 6. EL ASUNTO DE GRUPO DE LA DEMOSTRACIÓN ================= */
console.log('--- 6. el asunto de grupo de la demostración ---');
const demo = await pagina.evaluate(() => App.E.listaAbiertos.filter((a) => /GRUPO 2ºB$/.test(a.nombre))[0].nombre);
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(600);
await pagina.fill('#buscar-abiertos', 'Navarro');
await pagina.waitForTimeout(800);
await comprobar('6. Inicio encuentra el asunto de grupo por el apellido de una de sus personas; la columna «Tercero» dice «Grupo 2ºB · 8»',
  pagina.locator('.inicio-tabla-tercero').allTextContents().then((l) => l.map((t) => t.trim())), ['Grupo 2ºB · 8']);
await pagina.fill('#buscar-abiertos', '');

await pagina.evaluate((n) => App.abrirFicha(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], 'abierto'), demo);
await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
await pagina.waitForTimeout(1200);
await pagina.evaluate(() => FichaTarjetas.abrir('hitos'));
await pagina.waitForTimeout(400);
const h = await pagina.evaluate(async (n) => (await Hitos.hitosDe(n))[0].id, demo);
await pagina.locator('#ficha-guia .hito[data-id="' + h + '"] .hito-titulo').click();
await pagina.waitForSelector('#ficha-guia.con-mesa .hito-en-mesa');
await pagina.waitForTimeout(600);
await comprobar('6. en la mesa de su primer hito no hay «Hacer este hito» (el tipo sí lo tiene en un asunto de una persona)',
  pagina.evaluate(async (n) => [document.querySelectorAll('.mesa-hacer-hito').length, HacerEsteHito.tareasDe(App.E.listaAbiertos.filter((x) => x.nombre === n)[0], (await Hitos.hitosDe(n))[0]).length > 0], demo), [0, true]);
await comprobar('6. «Quién lo pide» no propone «el propio interesado» ni a ningún tutor',
  pagina.evaluate(() => { const c = document.createElement('div'); LoPide.controles(c, AsuntoDeGrupo.personaDelGrupo({ ficha: { categoria: 'ALUMNADO', tercero: 'GRUPO 2ºB', grupo: { nombre: '2ºB' } } }), null, null); return [...c.querySelectorAll('.lopide-quien option')].map((o) => o.textContent); }),
  ['— sin apuntar —', 'Otra persona…']);
await comprobar('6. ninguna búsqueda de «la persona» da una persona ni un error',
  pagina.evaluate(async (n) => { const a = App.E.listaAbiertos.filter((x) => x.nombre === n)[0]; const r = await FichaTercero._buscarPersona(a); return [r.persona, r.aviso, await HitosComunicar.buscarPersonaDelAsunto(a)]; }, demo),
  [null, 'Grupo de 8 personas.', null]);

/* Cambiar el asunto: el nombre del grupo, sin pasar a una persona. */
pagina.evaluate((n) => App.editarAsunto(App.E.listaAbiertos.filter((x) => x.nombre === n)[0]), demo);
await pagina.waitForSelector('#ed-grupo-nombre');
await comprobar('6. «Cambiar el asunto» enseña el nombre del grupo (no el buscador de personas) y lo dice',
  pagina.evaluate(() => [document.getElementById('ed-grupo-nombre').value, !document.getElementById('ed-tercero-buscar'), /no pasarlo a una sola persona/.test(document.getElementById('ed-tercero-caja').textContent)]), ['2ºB', true, true]);
await pagina.fill('#ed-grupo-nombre', 'Segundo B');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(2500);
await comprobar('6. el nombre cambia, sigue siendo un grupo y conserva a sus ocho personas',
  pagina.evaluate(() => App.E.listaAbiertos.filter((a) => /GRUPO Segundo B$/.test(a.nombre)).map((a) => [a.ficha.grupo.nombre, a.ficha.grupo.origen, a.ficha.tercero, a.ficha.relacionados.length, AsuntoDeGrupo.esGrupo(a)])),
  [['Segundo B', 'unidad', 'GRUPO Segundo B', 8, true]]);

await comprobar('sin errores de consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas de asunto-de-grupo pasan.');
process.exit(fallos ? 1 : 0);
