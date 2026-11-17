/* Prueba de la fila 698 (17-nov-2026, docs/698-RECORRIDO-DEL-TIPO-DE-DOCUMENTO.md): el recorrido de cada tipo de documento.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1).

   1. Los tipos se ponen de acuerdo: un solo RESOLUCION y un solo CERTIFICADO, y los seis añadidos; una sola vez.
   2. El ⋮ de un tipo ofrece «Recorrido» junto a los otros; un tipo sin recorrido lleva «sin recorrido».
   3. La ventana tiene las preguntas de la pantalla de prueba y cambia según «Lo hacemos nosotros» o «Nos llega».
   4. «Así saldrá en la tarea» cambia al momento.
   5. Guardar: el recorrido queda en el disco y sigue ahí tras recargar el módulo; la marca «sin recorrido» desaparece.
   6. `RecorridoTipo.de` y `.pasos` devuelven la forma acordada; un tipo sin recorrido sale «Nos llega · no se registra». */
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
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.RecorridoTipoAcuerdo, null, { timeout: 60000 });

/* Se siembran los tipos de antes y se pasa la pasada a mano (la de entrada corre a los 4 s; aquí no se espera). */
await pagina.evaluate(async () => {
  ['RESOLUCIÓN', 'CERTIFICACION'].forEach((t) => { if (App.E.tiposDocumento.indexOf(t) === -1) App.E.tiposDocumento.push(t); });
  ['RESOLUCION', 'CERTIFICADO'].forEach((t) => { if (App.E.tiposDocumento.indexOf(t) === -1) App.E.tiposDocumento.push(t); });
  await App.guardarTiposDocumento();
  await Plantillas.guardar(App.E.gestor, (a) => { (a.documentos = a.documentos || []).push({ id: 'pd-prueba698', tipo: 'X', categoria: 'ALUMNADO', nombre: 'Prueba 698', fichero: 'p698.docx', tipoDocumento: 'CERTIFICACION' }); return a; });
});

console.log('--- 1. los tipos se ponen de acuerdo ---');
const r1 = await pagina.evaluate(() => RecorridoTipoAcuerdo.pasada({ forzar: true }).then((r) => ({ unidos: r.unidos, anadidos: r.anadidos })));
await comprobar('se unen los dos de antes', r1.unidos.sort(), ['CERTIFICACION → CERTIFICADO', 'RESOLUCIÓN → RESOLUCION']);
const tipos = await pagina.evaluate(() => App.E.tiposDocumento.slice());
await comprobar('un solo RESOLUCION y un solo CERTIFICADO, sin los de antes',
  [tipos.filter((t) => t === 'RESOLUCION').length, tipos.filter((t) => t === 'CERTIFICADO').length, tipos.indexOf('RESOLUCIÓN'), tipos.indexOf('CERTIFICACION')], [1, 1, -1, -1]);
await comprobar('están los seis añadidos',
  ['ACUERDO', 'DILIGENCIA', 'CITACION', 'AUTORIZACION', 'RENUNCIA', 'FICHA ENTREGA LIBROS'].map((t) => tipos.indexOf(t) !== -1), [true, true, true, true, true, true]);
await comprobar('la plantilla que decía CERTIFICACION ahora dice CERTIFICADO',
  pagina.evaluate(async () => (await Plantillas.cargar(App.E.gestor)).documentos.filter((p) => p.id === 'pd-prueba698')[0].tipoDocumento), 'CERTIFICADO');
await comprobar('otra pasada no corre sola', pagina.evaluate(() => RecorridoTipoAcuerdo.pasada()), null);
await comprobar('forzada, no duplica nada', pagina.evaluate(() => RecorridoTipoAcuerdo.pasada({ forzar: true }).then((r) => r.unidos.length + r.anadidos.length)), 0);

console.log('--- 2. el menú y «sin recorrido» ---');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.evaluate(() => { document.querySelectorAll('#pantalla-ajustes details').forEach((d) => { d.open = true; }); App.pintarTiposDeDocumento(); });
const tarjeta = pagina.locator('#tabla-tipos-documento .tarjeta-tipo[data-tipo-doc="COMUNICACION"]');
await comprobar('COMUNICACION lleva «sin recorrido»', tarjeta.locator('.tarjeta-tipo-sin-recorrido').count(), 1);
await tarjeta.locator('.tarjeta-tipo-menu-btn').click();
await comprobar('el ⋮ ofrece Recorrido junto a los otros',
  tarjeta.locator('.tarjeta-tipo-menu button').allTextContents(),
  ['Campos del nombre', 'Texto por defecto', 'Nombre corto', 'Recorrido', 'Extracto de este tipo', 'Borrar']);

console.log('--- 3 y 4. la ventana ---');
await tarjeta.locator('.tarjeta-tipo-menu button', { hasText: 'Recorrido' }).click();
await pagina.waitForSelector('#rt-cuerpo');
await comprobar('el título es «Recorrido: COMUNICACION»', pagina.locator('#cuadro-titulo').textContent(), 'Recorrido: COMUNICACION');
await comprobar('sin recorrido guardado sale «Nos llega»', pagina.locator('input[name="rt-entra"][value="si"]').isChecked(), true);
await comprobar('«Nos llega» solo pregunta el registro de entrada', pagina.locator('#rt-cuerpo').textContent().then((t) => [t.indexOf('Se registra de entrada') !== -1, t.indexOf('Quién lo firma') !== -1]), [true, false]);
await comprobar('«Así saldrá en la tarea» de un papel que llega', pagina.locator('#rt-pasos').textContent(), 'Recibido');
await pagina.locator('#rt-registro').check();
await comprobar('registrar de entrada cambia los pasos', pagina.locator('#rt-pasos').textContent(), 'Recibido › Registrado de entrada');
await pagina.locator('input[name="rt-entra"][value="no"]').check();
await comprobar('«Lo hacemos nosotros» pregunta firma, registro y envío',
  pagina.locator('#rt-cuerpo').textContent().then((t) => ['Quién lo firma', 'Se registra de salida', 'Se envía'].map((x) => t.indexOf(x) !== -1)), [true, true, true]);
await comprobar('la firma ofrece las seis opciones', pagina.locator('#rt-firma option').allTextContents(),
  ['Nadie', 'Administración', 'Secretaría', 'Secretaría, con visto bueno de Dirección', 'Dirección', 'Jefatura de Estudios']);
await pagina.selectOption('#rt-firma', 'Dirección');
await pagina.locator('#rt-registro').check();
await pagina.locator('#rt-envia').check();
await comprobar('«A quién» ofrece las cinco', pagina.locator('#rt-aquien option').allTextContents(),
  ['Familia', 'Interesado', 'Quien lo pide', 'Tutor/a del grupo', 'Personas relacionadas']);
await comprobar('«Por dónde» ofrece solo las vías de envío',
  pagina.locator('#rt-via option').allTextContents(), ['iPasen', 'Correo electrónico', 'Correo postal', 'En mano', 'Tablón']);
await pagina.selectOption('#rt-aquien', 'Tutor/a del grupo');
await pagina.selectOption('#rt-via', 'iPasen');
await comprobar('los pasos cambian al momento', pagina.locator('#rt-pasos').textContent(), 'Generado › Firmado › Registrado › Enviado');
await comprobar('el resumen en una frase', pagina.locator('#rt-resumen').textContent(),
  'Firma: Dirección · se registra de salida · a Tutor/a del grupo por iPasen.');

console.log('--- 5. guardar ---');
await pagina.click('#cuadro-aceptar');
await pagina.waitForFunction(() => RecorridoTipo.tiene('COMUNICACION'));
await comprobar('RecorridoTipo.de da la forma acordada', pagina.evaluate(() => RecorridoTipo.de('COMUNICACION')),
  { entra: false, firma: 'Dirección', registro: true, envia: true, aquien: 'Tutor/a del grupo', via: 'iPasen' });
await comprobar('en el disco queda en recorridos-tipos.json',
  pagina.evaluate(async () => (await Carpetas.leerJson(App.E.gestor, 'recorridos-tipos.json')).recorridos.COMUNICACION.via), 'iPasen');
await comprobar('tras volver a cargar sigue ahí', pagina.evaluate(async () => { await RecorridoTipo.cargar(); return RecorridoTipo.resumen('COMUNICACION'); }),
  'Firma: Dirección · se registra de salida · a Tutor/a del grupo por iPasen');
await comprobar('«sin recorrido» desaparece de su tarjeta', pagina.locator('#tabla-tipos-documento .tarjeta-tipo[data-tipo-doc="COMUNICACION"] .tarjeta-tipo-sin-recorrido').count(), 0);
await comprobar('otro tipo sigue «sin recorrido»', pagina.locator('#tabla-tipos-documento .tarjeta-tipo[data-tipo-doc="ACUERDO"] .tarjeta-tipo-sin-recorrido').count(), 1);

console.log('--- 6. un tipo sin recorrido ---');
await comprobar('sale «Nos llega · no se registra»', pagina.evaluate(() => [RecorridoTipo.de('ACUERDO'), RecorridoTipo.resumen('ACUERDO'), RecorridoTipo.pasos('ACUERDO').map((p) => p.t)]),
  [{ entra: true, firma: 'Nadie', registro: false, envia: false, aquien: '', via: '' }, 'Nos llega · no se registra', ['Recibido']]);
await comprobar('el recorrido de un tipo unido pasa al nombre que se queda',
  pagina.evaluate(async () => { await RecorridoTipo.poner('RESOLUCIÓN', { entra: false, firma: 'Dirección', registro: true, envia: false });
    await RecorridoTipo.mover('RESOLUCIÓN', 'RESOLUCION'); return [RecorridoTipo.tiene('RESOLUCION'), RecorridoTipo.de('RESOLUCION').firma]; }), [true, 'Dirección']);

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien.');
process.exit(fallos ? 1 : 0);
