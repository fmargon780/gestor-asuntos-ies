/* Fila 528 (5-nov-2026, docs/528-LISTA-DE-CAMPOS.md): la lista única de campos y la ventana de elegir.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. La función pura: reúne huecos, datos de tablas, columnas de ficheros, calculados, propios y {campo:…} a mano.
   2. La sección «Campos» de Ajustes → El centro: columnas, grupos, filtros, buscador, detalle con el camino.
   3. Campo manual: se crea sin ajuste de «cuándo se pide»; en uso no se quita, sin usar sí.
   4. La ventana de «Campo variable»: grupos, más usados, buscador, de otra clase plegados, ejemplo y tabla.
   5. Crear un campo manual desde la ventana lo inserta en la plantilla. */
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
await pagina.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await pagina.goto(DIRECCION);
await pagina.waitForTimeout(7000);

console.log('--- 1. la función pura ---');
const pura = await pagina.evaluate(() => {
  const l = CamposLista.reunir({
    huecos: [{ clave: 'nombre', etiqueta: 'Nombre del tercero' }, { clave: 'centro', etiqueta: 'Nombre del centro' }, { clave: 'tutor1', etiqueta: 'Nombre del primer tutor' }, { clave: 'hoy', etiqueta: 'Fecha de hoy' }],
    bd: [{ clave: '{DATO ALUMNADO BD: PIL}', etiqueta: 'PIL' }],
    cabeceras: { ALUMNADO: ['Nº Id. Escolar', 'Unidad'] },
    config: { propios: [{ id: 'p1', nombre: 'País de destino', clase: 'texto', valores: [], grupo: 'Asunto' }, { id: 'p2', nombre: 'Trimestre', clase: 'lista', valores: ['1º', '2º'], grupo: 'Persona' }],
      calculados: [{ id: 'curso', nombre: 'Curso', categorias: ['ALUMNADO'], origen: { clase: 'grupo' }, operacion: 'quitarFinal', parametros: {} }], porTipo: { T1: [{ origen: 'propio', id: 'p2' }] } },
    textos: [{ donde: 'Correo «A»', tipo: 'T1', texto: 'Hola {nombre}, {campo:País de destino} y {campo:Escrito a mano}' }]
  });
  const por = (n) => l.find((c) => c.nombre === n);
  return {
    n: l.length,
    grupos: [...new Set(l.map((c) => c.grupo))].sort(),
    origenes: [...new Set(l.map((c) => c.origen))].sort(),
    nombre: [por('Nombre del tercero').origen, por('Nombre del tercero').grupo],
    tutor: por('Nombre del primer tutor').grupo,
    centro: [por('Nombre del centro').origen, por('Nombre del centro').grupo],
    manual: [por('País de destino').origen, por('País de destino').usos.length, CamposLista.sePuedeQuitar(por('País de destino'))],
    enTipo: [por('Trimestre').dondeSePide, CamposLista.sePuedeQuitar(por('Trimestre'))],
    aMano: por('Escrito a mano') ? por('Escrito a mano').origen : null,
    columna: por('Nº Id. Escolar').tabla,
    camino: CamposLista.camino(por('Nº Id. Escolar'))
  };
});
await comprobar('1. cinco grupos como mucho y ninguno «Calculados», «Manuales» ni «Tablas»', pura.grupos, ['Asunto', 'Centro', 'Persona', 'Tutores']);
await comprobar('1. los orígenes', pura.origenes, ['Ajustes del centro', 'Calculado', 'Centro de datos', 'El asunto', 'Manual', 'Tabla de datos']);
await comprobar('1. el nombre del tercero sale del Centro de datos, grupo Persona', pura.nombre, ['Centro de datos', 'Persona']);
await comprobar('1. el primer tutor es del grupo Tutores', pura.tutor, 'Tutores');
await comprobar('1. el centro sale de Ajustes del centro', pura.centro, ['Ajustes del centro', 'Centro']);
await comprobar('1. un manual usado en una plantilla no se puede quitar', pura.manual, ['Manual', 1, false]);
await comprobar('1. un manual puesto en un tipo no se puede quitar', pura.enTipo, [['T1'], false]);
await comprobar('1. un {campo:…} escrito a mano entra en la lista', pura.aMano, 'Manual');
await comprobar('1. el camino de una columna del RegAlum', pura.camino, 'Centro de datos → RegAlum → columna Nº Id. Escolar');

console.log('--- 2. la sección «Campos» ---');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForTimeout(1500);
await pagina.click('.pestana-ajustes[data-ajustes-pestana="centro"]');
await pagina.evaluate(() => { document.getElementById('bloque-lista-campos').open = true; });
await pagina.waitForSelector('#lista-campos-cuerpo tbody tr[data-id]', { timeout: 20000 });
await comprobar('2. las seis columnas', pagina.$$eval('#lista-campos-cuerpo thead th', (t) => t.map((x) => x.textContent)), ['Campo', 'Grupo', 'De dónde sale', 'Ejemplo', 'Dónde se pide', 'Se usa en']);
await comprobar('2. las pastillas de grupo: Todos y los cinco', pagina.$$eval('.campos-lista-grupos .campos-pastilla', (t) => t.map((x) => x.textContent.replace(/ \(\d+\)/, ''))), ['Todos', 'Persona', 'Tutores', 'Asunto', 'Centro', 'Firmantes']);
await pagina.fill('#cl-buscar', 'regalum');
await pagina.waitForTimeout(600);
const filtroRegAlum = await pagina.$$eval('#lista-campos-cuerpo tbody tr[data-id]', (f) => f.length > 0 && f.every((x) => /RegAlum/.test(x.textContent)));
await comprobar('2. el buscador por «regalum» solo trae campos de esa tabla', filtroRegAlum, true);
await pagina.click('#lista-campos-cuerpo tbody tr[data-id]');
await pagina.waitForSelector('#cl-camino');
await comprobar('2. el detalle trae el camino entero', pagina.locator('#cl-camino').textContent().then((t) => /^Centro de datos → RegAlum.* → columna /.test(t)), true);
await pagina.fill('#cl-buscar', '');
await pagina.waitForTimeout(500);
await pagina.selectOption('#cl-origen', 'Ajustes del centro');
await pagina.waitForTimeout(500);
await comprobar('2. el filtro por origen', pagina.$$eval('#lista-campos-cuerpo tbody tr[data-id]', (f) => f.length > 0 && f.every((x) => x.children[2].textContent.indexOf('Ajustes del centro') === 0)), true);
await pagina.selectOption('#cl-origen', '');

console.log('--- 3. campo manual ---');
await pagina.click('#cl-nuevo-manual');
await comprobar('3. el formulario no tiene ningún ajuste de «cuándo se pide»', pagina.evaluate(() => /No se decide aquí|no se decide aquí/.test(document.getElementById('cl-detalle').textContent) && !document.querySelector('#cl-detalle select[id*="pide"]')), true);
await pagina.fill('#cmn-nombre', 'Motivo de la baja');
await pagina.selectOption('#cmn-clase', 'lista');
await pagina.fill('#cmn-opciones', 'Traslado, Enfermedad');
await pagina.click('#cmn-crear');
await pagina.waitForSelector('#cl-quitar', { timeout: 10000 });
await comprobar('3. el nuevo sale en la lista, con origen Manual, y se puede quitar', pagina.evaluate(() => { const r = document.querySelector('#lista-campos-cuerpo tr.sel'); return [r.children[0].textContent, r.children[2].textContent.indexOf('Manual') === 0, !!document.getElementById('cl-quitar')]; }), ['Motivo de la baja', true, true]);
await pagina.click('#cl-quitar');
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(1500);
await comprobar('3. quitado: ya no está', pagina.$$eval('#lista-campos-cuerpo tbody tr[data-id]', (f) => f.some((x) => x.children[0].textContent === 'Motivo de la baja')), false);

console.log('--- 4. la ventana de «Campo variable» ---');
await pagina.evaluate(() => { try { const a = {}; ['datos', 'campos', 'pasos', 'correo', 'word', 'plazo', 'palabras', 'repite'].forEach((x) => { a['tipo:' + x] = true; }); localStorage.setItem('gestor-ajustes-plegado', JSON.stringify(a)); } catch (e) {} });
await pagina.click('.pestana-ajustes[data-ajustes-pestana="dia"]');
await pagina.waitForSelector('#tabla-tipos .tarjeta-tipo');
await pagina.locator('#tabla-tipos .tarjeta-tipo').first().locator('.tarjeta-tipo-nombre').click();
await pagina.waitForSelector('#pantalla-tipo-asunto:not(.oculto)');
await pagina.waitForSelector('#tipo-plantillas-nueva');
await pagina.click('#tipo-plantillas-nueva');
await pagina.waitForSelector('#pl-texto');
await pagina.fill('#pl-texto', 'Hola ');
await pagina.click('#pl-insertar-hueco');
await pagina.waitForSelector('.capa-campos #ce-buscar');
await comprobar('4. los cinco grupos a la izquierda, ninguno «Calculados» ni «Manuales»', pagina.$$eval('.campos-elegir-grupos .campos-grupo', (g) => g.map((x) => x.firstChild.textContent)), ['Persona', 'Tutores', 'Asunto', 'Centro', 'Firmantes']);
await comprobar('4. los más usados en este tipo cambian con el tipo (salen los que se usan o «todavía ninguno»)', pagina.locator('.campos-elegir-usados').textContent().then((t) => /Los más usados en este tipo/.test(t)), true);
await comprobar('4. cada campo lleva su ejemplo y su tabla', pagina.$$eval('.campos-fila-campo', (f) => f.length > 3 && f.every((x) => x.querySelector('.campos-fila-ej') && x.querySelector('.campos-etq'))), true);
await pagina.click('.campos-grupo[data-g="Centro"]');
await comprobar('4. el grupo filtra', pagina.$$eval('.campos-fila-campo', (f) => f.length > 0 && f.some((x) => /Nombre del centro/.test(x.textContent)) && !f.some((x) => /Nombre del tercero/.test(x.textContent))), true);
await pagina.fill('#ce-buscar', 'regalum');
await comprobar('4. el buscador mira en todos los grupos y por tabla', pagina.$$eval('.campos-fila-campo', (f) => f.length > 3 && f.some((x) => /Primer tutor/.test(x.textContent)) && f.some((x) => /Nombre del tercero/.test(x.textContent))), true);

console.log('--- 5. crear un campo manual desde la ventana ---');
await pagina.fill('#ce-buscar', '');
await pagina.click('#ce-nuevo-manual');
await pagina.fill('#cmn-nombre', 'Fecha de la visita');
await pagina.selectOption('#cmn-clase', 'fecha');
await pagina.click('#cmn-crear');
await pagina.waitForSelector('.capa-campos', { state: 'detached', timeout: 10000 });
await comprobar('5. queda insertado en la plantilla', pagina.inputValue('#pl-texto'), 'Hola {campo:Fecha de la visita}');
await comprobar('5. y queda en la lista para siempre, con origen Manual', pagina.evaluate(async () => { const l = await CamposListaDatos.lista(); const c = l.find((x) => x.nombre === 'Fecha de la visita'); return c ? [c.origen, c.clase] : null; }), ['Manual', 'fecha']);
await pagina.click('#pl-insertar-hueco');
await pagina.waitForSelector('.capa-campos #ce-buscar');
await pagina.fill('#ce-buscar', 'visita');
await comprobar('5. la segunda vez se elige de la lista', pagina.$$eval('.campos-fila-campo', (f) => f.some((x) => /Fecha de la visita/.test(x.textContent))), true);
await pagina.press('#ce-buscar', 'Escape');
await pagina.evaluate(async () => { const c = (await CamposListaDatos.lista()).find((x) => x.nombre === 'Fecha de la visita'); await Campos.guardarPropios(App.E.gestor, (l) => l.filter((x) => x.id !== c.propioId)); });

console.log('--- 6. una plantilla antigua con {campo:Nombre} a mano ---');
await comprobar('6. un {campo:…} escrito a mano en una plantilla entra en la lista, sin dejar de funcionar', pagina.evaluate(() => {
  const l = CamposLista.reunir({ huecos: [], textos: [{ donde: 'Correo «X»', texto: 'Hola {campo:Escrito a mano}' }] });
  return [l.length, l[0].nombre, l[0].origen, l[0].usos.length];
}), [1, 'Escrito a mano', 'Manual', 1]);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s)'); process.exit(1); }
console.log('\ntodo bien');
