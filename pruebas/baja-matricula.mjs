/* Prueba de la fila 592 (11-nov-2026, docs/592-BAJA-MATRICULA.md): el tipo BAJA MATRICULA.
   Chromium real con los datos de la copia de pruebas (?demo=1&auto=1&baja=1), que lleva el tipo «BAJA» de antes con un asunto abierto.

   1. El tipo: «BAJA» pasa a «Baja de matrícula» (BAJA MATRICULA), con el nombre de antes de alias; el asunto de antes se sigue
      abriendo como de ese tipo; BAJA MEDICA no se toca.
   2. Los datos: seis campos propios (el motivo se pide al crear, los otros cinco no), el curso y la fecha de nacimiento del alumno.
   3. La guía: seis hitos en orden, los dos primeros «Solo si» el motivo, las tareas de cada uno, «Solo si» protocolo = Sí en la
      de Servicios Sociales; «Pedir datos» pide los cinco datos; las tareas citan las plantillas del tipo.
   4. Las plantillas: resolución, anexo I, anexo II y dos correos, colgadas del tipo.
   5. Una sola vez: otra pasada no corre sola; forzada, no duplica nada.
   6. Un asunto nuevo tiene los seis hitos (los de «Solo si» en amarillo con el motivo vacío); el asunto de antes conserva los suyos.
   7. La resolución: los párrafos según protocolo, acreditación y matrícula, sin marcas sueltas; el correo a la familia cambia igual.
   8. «Campos del asunto»: un dato de lista vacío sale con su desplegable y se guarda ahí. */
import { chromium } from 'playwright';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1&baja=1';
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
await pagina.waitForFunction(() => window.Demo && !Demo.montando && window.BajaMatricula, null, { timeout: 60000 });
await pagina.waitForFunction(() => window.Demo && !Demo.montando && App.E.tipos.some((t) => t.nombreCorto === 'BAJA MATRICULA'), null, { timeout: 120000 });
await pagina.waitForTimeout(1500);

const TIPO = 'Baja de matrícula';

console.log('--- 1. el tipo ---');
await comprobar('«BAJA» pasa a «Baja de matrícula» con nombre corto BAJA MATRICULA y el nombre de antes de alias',
  pagina.evaluate((T) => { const t = App.E.tipos.filter((x) => x.tipo === T); return [t.length, t[0].nombreCorto, t[0].alias, t[0].categoria, !!t[0].desactivado]; }, TIPO),
  [1, 'BAJA MATRICULA', ['BAJA', 'Baja del alumnado'], 'ALUMNADO', false]);
await comprobar('ya no queda un tipo «BAJA» aparte, y BAJA MEDICA sigue como estaba',
  pagina.evaluate(() => [App.E.tipos.filter((x) => x.tipo === 'BAJA').length, App.E.tipos.filter((x) => x.tipo === 'BAJA MEDICA').length]), [0, 1]);
await comprobar('el asunto de antes (carpeta «… BAJA Pardo Vega…») se sigue abriendo como de ese tipo',
  pagina.evaluate(() => { const a = App.E.listaAbiertos.filter((x) => / BAJA /.test(x.nombre) && /Pardo Vega/.test(x.nombre))[0]; return a ? [a.leido.reconocido, a.leido.tipo] : null; }),
  [true, TIPO]);
await comprobar('una carpeta nueva con el nombre corto también se reconoce',
  pagina.evaluate(() => { const l = Nombres.leer('261111 A26-0001 BAJA MATRICULA Perez Gil, Ana 12345', App.E.tipos); return [l.reconocido, l.tipo]; }), [true, TIPO]);

console.log('--- 2. los datos ---');
const propios = await pagina.evaluate(() => (App.E.campos.propios || []).map((p) => [p.nombre, p.clase, p.valores]));
for (const [n, c, v] of [['Motivo de la baja', 'lista', ['Traslado al extranjero']], ['País de destino', 'texto', []], ['Fecha de efectos de la baja', 'fecha', []],
  ['Protocolo de absentismo iniciado', 'lista', ['Sí', 'No']], ['Cómo se acredita el traslado', 'lista', ['Declaración de la familia', 'Diligencia de Dirección']],
  ['Aporta matrícula del país de destino', 'lista', ['Sí', 'No']]]) {
  await comprobar('campo «' + n + '»', Promise.resolve(propios.filter((p) => p[0] === n)), [[n, c, v]]);
}
await comprobar('solo el motivo se pide al crear; el curso y la fecha de nacimiento vienen del alumno',
  pagina.evaluate((T) => App.E.campos.porTipo[T].map((c) => (c.id ? (App.E.campos.propios.filter((p) => p.id === c.id)[0] || {}).nombre || c.id : c.columna) + (c.sinPedirAlCrear ? ' (no al crear)' : '')), TIPO),
  ['Motivo de la baja', 'País de destino (no al crear)', 'Fecha de efectos de la baja (no al crear)', 'Protocolo de absentismo iniciado (no al crear)',
   'Cómo se acredita el traslado (no al crear)', 'Aporta matrícula del país de destino (no al crear)', 'curso', 'Fecha de nacimiento']);

console.log('--- 3. la guía ---');
const guia = await pagina.evaluate((T) => GuiasDelCentro.todas()[T].map((p) => [p.titulo, p.responsable, p.soloSi ? p.soloSi.campo + '=' + p.soloSi.valores.join('|') : '',
  p.guion.map((g) => [g.texto, g.accion, g.soloSi ? g.soloSi.campo + '=' + g.soloSi.valores.join('|') : ''])]), TIPO);
await comprobar('seis hitos, en este orden, con sus tareas', Promise.resolve(guia), [
  ['Recibir el encargo de Dirección', 'yo', 'Motivo de la baja=Traslado al extranjero', [['Añadir la declaración de la familia o la diligencia de Dirección', 'anadir', ''], ['Pedir los datos de la baja', 'pedir', '']]],
  ['Preparar la resolución', 'yo', 'Motivo de la baja=Traslado al extranjero', [['Generar la resolución de baja', 'generar', '']]],
  ['Firma de Dirección', 'direccion', '', [['Firmar un documento', 'firmar', '']]],
  ['Registro de salida', 'yo', '', [['Registrar de salida el documento', 'registrar', '']]],
  ['Baja en Séneca', 'yo', '', [['Grabar la baja en Séneca con su fecha', '', '']]],
  ['Comunicar', 'yo', '', [['Comunicar la resolución a la familia', 'comunicar', ''], ['Comunicar la resolución a Servicios Sociales', 'comunicar', 'Protocolo de absentismo iniciado=Sí']]]]);
await comprobar('«Pedir los datos» pide los cinco datos', pagina.evaluate((T) => {
  const g = GuiasDelCentro.todas()[T][0].guion[1];
  return g.receta.campos.map((c) => App.E.campos.propios.filter((p) => p.id === c.id)[0].nombre);
}, TIPO), ['País de destino', 'Fecha de efectos de la baja', 'Protocolo de absentismo iniciado', 'Cómo se acredita el traslado', 'Aporta matrícula del país de destino']);
await comprobar('las tareas citan las plantillas del tipo y comunican a quien toca', pagina.evaluate(async (T) => {
  const pl = await Plantillas.cargar(App.E.gestor), g = GuiasDelCentro.todas()[T];
  const nombre = (id) => (pl.documentos.concat(pl.lista).filter((p) => p.id === id)[0] || {}).nombre;
  const f = g[5].guion[0].receta, s = g[5].guion[1].receta;
  return [nombre(g[1].guion[0].receta.plantilla), nombre(f.plantilla), f.a, f.via, nombre(s.plantilla), s.a, s.via, g[3].guion[0].receta.sentido, g.every((p) => p.comun)];
}, TIPO), ['Resolución de baja por traslado al extranjero', 'Resolución de baja · familia', 'tutores', 'correo', 'Resolución de baja · Servicios Sociales', 'relacionados', 'correo', 'salida', true]);
await comprobar('las listas comunes llevan sus hitos y tareas', pagina.evaluate(async () => {
  const l = await ComunesGuardado.leer();
  const h = (n) => l.hitos.filter((x) => x.nombre === n).length;
  return [h('Recibir el encargo de Dirección'), h('Preparar la resolución'), h('Firma de Dirección'), h('Registro de salida'), h('Baja en Séneca'), h('Comunicar'),
          l.tareas.filter((x) => x.nombre === 'Firmar un documento').length];
}), [1, 1, 1, 1, 1, 1, 1]);

console.log('--- 4. las plantillas ---');
await comprobar('resolución, anexo I, anexo II y dos correos, colgados del tipo', pagina.evaluate(async (T) => {
  const pl = await Plantillas.cargar(App.E.gestor);
  return pl.documentos.concat(pl.lista).filter((p) => p.tipo === T).map((p) => p.nombre).sort();
}, TIPO), ['Anexo I · Declaración de traslado de residencia al extranjero', 'Anexo II · Diligencia de la Dirección', 'Resolución de baja por traslado al extranjero',
  'Resolución de baja · Servicios Sociales', 'Resolución de baja · familia']);

await comprobar('los correos proponen a quien toca: la familia a los tutores legales; Servicios Sociales a los relacionados, con su saludo',
  pagina.evaluate(async () => { const pl = await Plantillas.cargar(App.E.gestor); const f = (n) => pl.lista.filter((p) => p.nombre === n)[0];
    return [f('Resolución de baja · familia').para, f('Resolución de baja · Servicios Sociales').para, f('Resolución de baja · Servicios Sociales').saludo]; }),
  [['legales'], ['relac'], 'Estimados señores:']);

console.log('--- 5. una sola vez ---');
const cuentas = () => pagina.evaluate(async (T) => {
  const pl = await Plantillas.cargar(App.E.gestor), l = await ComunesGuardado.leer(), c = await Campos.leer(App.E.gestor);
  return [App.E.tipos.length, pl.documentos.length + pl.lista.length, l.tareas.length, l.hitos.length, c.propios.length, c.porTipo[T].length, GuiasDelCentro.todas()[T].length];
}, TIPO);
const antes = await cuentas();
await comprobar('otra pasada no corre sola (la marca está puesta)', pagina.evaluate(() => BajaMatricula.pasada()), null);
await comprobar('forzada, no duplica tipos, plantillas, tareas, hitos, datos ni hitos de la guía', pagina.evaluate(async () => { await BajaMatricula.pasada({ forzar: true }); return true; }).then(async () => cuentas()), antes);

console.log('--- 6. los asuntos ---');
const hitosNuevo = await pagina.evaluate(async (T) => {
  const tipo = App.E.tipos.filter((x) => x.tipo === T)[0];
  const clave = await Demo.datos._interno.crearAsunto(tipo, 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Rubio Ortega, Marina', id: '2100071' }), Demo.datos._interno.hace(0), {});
  const hs = await Hitos.hitosDe(clave);
  return hs.map((h) => [h.titulo, h.faltaCampo || '']);
}, TIPO);
await comprobar('un asunto nuevo tiene los seis hitos; con el motivo vacío, los dos primeros dicen «Falta»', Promise.resolve(hitosNuevo), [
  ['Recibir el encargo de Dirección', 'Motivo de la baja'], ['Preparar la resolución', 'Motivo de la baja'], ['Firma de Dirección', ''], ['Registro de salida', ''],
  ['Baja en Séneca', ''], ['Comunicar', '']].map((x) => x));
await comprobar('el asunto de antes conserva sus tres hitos', pagina.evaluate(async () => {
  const a = App.E.listaAbiertos.filter((x) => / BAJA /.test(x.nombre) && /Pardo Vega/.test(x.nombre))[0];
  App.abrirFicha(a);   /* la red de seguridad de abrir la ficha tampoco le trae los hitos nuevos */
  await new Promise((r) => setTimeout(r, 3000));
  return (await Hitos.hitosDe(a.nombre)).map((h) => h.titulo);
}), ['Registrar el motivo de la baja', 'Dar la baja en Séneca', 'Comunicar a la tutoría']);

console.log('--- 7. la resolución y el correo ---');
const textos = await pagina.evaluate(async (T) => {
  await App.verAbiertos();
  const a = App.E.listaAbiertos.filter((x) => /Rubio Ortega/.test(x.nombre) && x.leido.tipo === T)[0];
  const poner = async (n, v) => { const r = await DatosDelAsunto.guardar(a, n, v); if (!r.ok) throw new Error(n); };
  const pl = await Plantillas.cargar(App.E.gestor);
  const doc = pl.documentos.filter((p) => p.nombre === 'Resolución de baja por traslado al extranjero')[0];
  const correo = pl.lista.filter((p) => p.nombre === 'Resolución de baja · familia')[0];
  async function sacar() {
    const buffer = await PlantillasDocumento._interno.leerConMembrete(doc);
    const valores = await Plantillas.valoresDeAsunto(a, { fecha: U.hoyIso(), plantilla: doc });
    const r = await Docx.rellenar(buffer, valores);
    const xml = await Docx.leerEntradaDeTexto(await r.blob.arrayBuffer(), 'word/document.xml');
    const texto = xml.replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '');
    const c = await Plantillas.rellenar(correo.texto, valores);
    return { texto, faltan: r.faltan, correo: typeof c === 'string' ? c : c.texto };
  }
  await poner('Motivo de la baja', 'Traslado al extranjero'); await poner('País de destino', 'Alemania'); await poner('Fecha de efectos de la baja', '2026-10-05');
  await poner('Protocolo de absentismo iniciado', 'Sí'); await poner('Cómo se acredita el traslado', 'Declaración de la familia'); await poner('Aporta matrícula del país de destino', 'Sí');
  const si = await sacar();
  await poner('Protocolo de absentismo iniciado', 'No'); await poner('Cómo se acredita el traslado', 'Diligencia de Dirección'); await poner('Aporta matrícula del país de destino', 'No');
  const no = await sacar();
  return { si, no };
}, TIPO);
const tiene = (t, x) => t.indexOf(x) !== -1;
await comprobar('con protocolo Sí, declaración y matrícula Sí: Tercero del Sí, Cuarto del anexo I y la frase del certificado',
  Promise.resolve([tiene(textos.si.texto, 'se inició el protocolo de absentismo escolar'), tiene(textos.si.texto, 'No llegó a iniciarse'), tiene(textos.si.texto, '(anexo I)'),
    tiene(textos.si.texto, '(anexo II)'), tiene(textos.si.texto, 'aporta además el certificado de matrícula')]), [true, false, true, false, true]);
await comprobar('con protocolo No, diligencia y matrícula No: los otros',
  Promise.resolve([tiene(textos.no.texto, 'se inició el protocolo de absentismo escolar'), tiene(textos.no.texto, 'No llegó a iniciarse'), tiene(textos.no.texto, '(anexo I)'),
    tiene(textos.no.texto, '(anexo II)'), tiene(textos.no.texto, 'aporta además el certificado de matrícula')]), [false, true, false, true, false]);
await comprobar('la resolución lleva el país y la fecha de efectos, y ninguna marca suelta',
  Promise.resolve([tiene(textos.si.texto, 'Alemania'), tiene(textos.si.texto, '2026'), /\{si:|\{\{|\{campo/.test(textos.si.texto), /\{si:|\{\{|\{campo/.test(textos.no.texto)]), [true, true, false, false]);
await comprobar('el correo a la familia cambia según protocolo y matrícula',
  Promise.resolve([tiene(textos.si.correo, 'protocolo de absentismo'), tiene(textos.si.correo, 'certificado de matrícula'), tiene(textos.no.correo, 'protocolo de absentismo'), tiene(textos.no.correo, 'certificado de matrícula'), /\{si:/.test(textos.no.correo)]),
  [true, false, false, true, false]);

console.log('--- 8. «Campos del asunto» ---');
await comprobar('un dato de lista vacío sale con su desplegable y se guarda ahí', pagina.evaluate(async (T) => {
  const tipo = App.E.tipos.filter((x) => x.tipo === T)[0];
  const clave = await Demo.datos._interno.crearAsunto(tipo, 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Lara Soto, Daniel', id: '2100072' }), Demo.datos._interno.hace(0), {});
  await App.verAbiertos();
  const a = App.E.listaAbiertos.filter((x) => x.nombre === clave)[0];
  App.abrirFicha(a);
  await new Promise((r) => setTimeout(r, 800));
  const sel = [...document.querySelectorAll('#ficha-datos-tramite .ficha-dato-elegir')].map((s) => s.dataset.nombre);
  const motivo = document.querySelector('#ficha-datos-tramite .ficha-dato-elegir[data-nombre="Motivo de la baja"]');
  motivo.value = 'Traslado al extranjero'; motivo.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 1200));
  const guardado = DatosDelAsunto.valorGuardado(a, Campos.claveDeCampo(DatosDelAsunto.camposDelAsunto(a).filter((c) => c.nombre === 'Motivo de la baja')[0].cfg));
  const quedan = [...document.querySelectorAll('#ficha-datos-tramite .ficha-dato-elegir')].map((s) => s.dataset.nombre);
  return [sel.indexOf('Motivo de la baja') !== -1, sel.length, guardado, quedan.indexOf('Motivo de la baja') === -1];
}, TIPO), [true, 4, 'Traslado al extranjero', true]);

await comprobar('sin errores en la consola', Promise.resolve(errores), []);
await navegador.close();
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
