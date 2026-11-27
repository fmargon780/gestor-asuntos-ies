/* Fila 747 (docs/747-CAMPO-UNA-PERSONA-DEL-ASUNTO.md): el campo «Una persona del asunto».
   Copia de pruebas (demo), Chromium real. */
import { chromium } from 'playwright';

const BASE = process.env.DIRECCION || 'http://localhost:8123/index.html';
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
const p = await navegador.newPage({ viewport: { width: 1600, height: 1000 } });
p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); } catch (e) {}");
await p.goto(BASE + '?demo=1&auto=1');
await p.waitForSelector('#franja-demo', { timeout: 30000 });
await p.waitForTimeout(2500);

const T = 'Recibe {campo:Quién recibe}.';
const T2 = 'Otra: {campo:Quién recibe} y {campo:Quién recibe (teléfono)}.';
const VALORES = { nombreNatural: 'Alumna Uno', dni: '11111111H', tutor1: 'Tutor, Uno', tutor1dni: '22222222J', tutor2: 'Tutor, Dos', tutor2dni: '', custodiaDeSeneca: 'Tutor, Dos' };

await comprobar('1. «Una persona del asunto» es una clase de dato que se puede crear', p.evaluate(async () => {
  App.E.campos = await Campos.guardarPropios(App.E.gestor, (ps) => ps.concat([{ id: 'pq747', nombre: 'Quién recibe', clase: 'personaAsunto', valores: [], grupo: 'Asunto' }]));
  return [CamposClases.esValida('personaAsunto'), CamposClases.nombreDe('personaAsunto')];
}), [true, 'Una persona del asunto']);

await comprobar('2. la lista: tercero, quien lo pide, relacionados y tutores, con Tutor legal y custodia', p.evaluate(([v]) => {
  const a = App.E.listaAbiertos[0];
  const f = { categoria: 'ALUMNADO', tercero: 'Alumna Uno', loPide: { nombre: 'Abuela Pérez', relacion: 'abuela' }, relacionados: [{ categoria: 'PERSONAL', nombre: 'Profe Ana' }] };
  const b = { nombre: 'sin-ficha-en-el-registro', ficha: f, leido: {} };
  return PersonaDelAsunto.etiquetas(b, v);
}, [VALORES]), ['Alumna Uno · el tercero', 'Abuela Pérez · abuela, quien lo pide', 'Profe Ana', 'Uno Tutor · Tutor legal 1', 'Dos Tutor · Tutor legal 2 · tiene la custodia']);

await comprobar('3. el desplegable de «Faltan datos» ofrece esas personas, sin reglas de edad', p.evaluate(([v]) => {
  const a = App.E.listaAbiertos[0];
  const info = DatosDelAsunto.infoDe('Quién recibe', a, v);
  return [info.clase, info.valores.length > 0];
}, [VALORES]), ['lista', true]);

await comprobar('4. elegir una persona la guarda en el asunto y el documento lleva su nombre y su DNI', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const v0 = await Plantillas.valoresDeAsunto(a);
  const lista = PersonaDelAsunto.personas(a, v0);
  const quien = lista[0];
  const r = await DatosDelAsunto.guardar(a, 'Quién recibe', PersonaDelAsunto.etiqueta(quien));
  const v = await Plantillas.valoresDeAsunto(a);
  const f = App.E.registro.asuntos[a.nombre];
  const guardado = Object.values(f.campos).filter((c) => c.persona)[0];
  return [r.ok, r.valor === quien.nombre, !!guardado, Plantillas.rellenar('Recibe {campo:Quién recibe}.', v).texto.indexOf(quien.nombre) !== -1];
}), [true, true, true, true]);

await comprobar('5. otra plantilla con el mismo campo no vuelve a preguntar; el teléfono y el DNI están a mano', p.evaluate(async ([t2]) => {
  const a = App.E.listaAbiertos[0];
  const v = await Plantillas.valoresDeAsunto(a);
  const r = Plantillas.rellenar(t2, v);
  return [r.faltan.filter((x) => x === 'Quién recibe').length, 'Quién recibe (DNI)' in v.campos, 'Quién recibe (nombre)' in v.campos];
}, [T2]), [0, true, true]);

await comprobar('6. cambiar la elección: el siguiente documento usa la nueva persona', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const v0 = await Plantillas.valoresDeAsunto(a);
  const lista = PersonaDelAsunto.personas(a, v0);
  const otra = lista[lista.length - 1];
  await DatosDelAsunto.guardar(a, 'Quién recibe', PersonaDelAsunto.etiqueta(otra));
  const v = await Plantillas.valoresDeAsunto(a);
  return v.campos['Quién recibe (nombre)'] === otra.nombre;
}), true);

await comprobar('7. una persona sin DNI: el documento lo pide (DNI de Quién recibe) y, escrito, lo lleva', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const clave = Campos.claveDeCampo({ origen: 'propio', id: 'pq747' });
  await CampoDesdeElAsuntoEscribir.escribirEnAsunto(a, clave, { valor: 'Vecina Sin Dni', persona: { dni: '', telefono: '', correo: '', relacion: '' }, anadir: { origen: 'propio', id: 'pq747' } });
  const v = await Plantillas.valoresDeAsunto(a);
  const antes = Plantillas.rellenar('{campo:Quién recibe}', v);
  v.aMano = { 'DNI de Quién recibe': '33333333P' };
  const despues = Plantillas.rellenar('{campo:Quién recibe}', v).texto;
  return [antes.faltan, despues];
}), [['DNI de Quién recibe'], 'Vecina Sin Dni, con DNI 33333333P']);

await comprobar('8. «DNI de Quién recibe» guardado en el asunto: ya no se pide', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const r = await DatosDelAsunto.guardar(a, 'DNI de Quién recibe', '33333333P');
  const v = await Plantillas.valoresDeAsunto(a);
  const t = Plantillas.rellenar('{campo:Quién recibe}', v);
  return [r.ok, t.faltan, t.texto];
}), [true, [], 'Vecina Sin Dni, con DNI 33333333P']);

await comprobar('8b. al cambiar de persona, el DNI escrito a mano de la anterior no se arrastra', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const v0 = await Plantillas.valoresDeAsunto(a);
  const lista = PersonaDelAsunto.personas(a, v0);
  await DatosDelAsunto.guardar(a, 'Quién recibe', PersonaDelAsunto.etiqueta(lista[0]));
  const v = await Plantillas.valoresDeAsunto(a);
  return v.campos['Quién recibe (DNI)'] !== '33333333P';
}), true);

await comprobar('9. «Tutor con custodia» sigue igual', p.evaluate(() => {
  const dos = DatosDelAsunto.completar({ tutor1: 'Ana', tutor2: 'Luis', campos: {} }).campos['Tutor con custodia'];
  return [dos || '', DatosDelAsunto.infoDe('Tutor con custodia', App.E.listaAbiertos[0], { tutor1: 'Ana', tutor2: 'Luis' }).valores];
}), ['', ['Ana', 'Luis']]);

await comprobar('9b. «Cambiar el asunto» no enseña la persona (un desplegable vacío la borraría)', p.evaluate(() => {
  const a = App.E.listaAbiertos[0];
  const tipo = DatosDelAsunto.tipoDe(a);
  const ficha = Object.assign({}, App.E.registro.asuntos[a.nombre], { camposPropiosDelAsunto: [{ origen: 'propio', id: 'pq747' }] });
  const r = App.pintarCamposEditar(tipo, {}, ficha, a.nombre);
  return r.items.some((i) => i.nombre === 'Quién recibe');
}), false);

await comprobar('9c. la persona elegida sale en «Campos de este asunto» con «Cambiar», que ofrece las personas y guarda la nueva', (async () => {
  const antes = await p.evaluate(async () => {
    const a = App.E.listaAbiertos[0];
    await CampoDesdeElAsuntoEscribir.escribirEnAsunto(a, Campos.claveDeCampo({ origen: 'propio', id: 'pq747' }), { valor: 'Vecina Sin Dni', persona: { dni: '', telefono: '', correo: '', relacion: '' }, anadir: { origen: 'propio', id: 'pq747' } });
    FichaNucleo.modoActual = 'abierto';
    const caja = document.createElement('div');
    caja.id = 'prueba-747';
    caja.innerHTML = FichaNucleo.datosDelAsunto(a) || '';
    document.body.appendChild(caja);
    window.CampoDesdeElAsunto.alPintar(caja, a);
    const b = caja.querySelector('.ficha-dato-cambiar[data-persona]');
    if (!b) return { hay: false };
    b.click();
    await new Promise((r) => setTimeout(r, 600));
    const sel = caja.querySelector('select.ficha-dato-elegir');
    const opciones = sel ? Array.from(sel.options).map((o) => o.value) : [];
    sel.value = opciones[1];
    sel.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 800));
    const v = await Plantillas.valoresDeAsunto(a);
    return { hay: true, opciones, cambiada: v.campos['Quién recibe (nombre)'] };
  });
  return [antes.hay, antes.opciones && antes.opciones.length > 1, antes.cambiada && antes.cambiada !== 'Vecina Sin Dni'];
})(), [true, true, true]);

/* ---------- fila 773: la persona elegida, completa en las plantillas ---------- */

await comprobar('11. «en calidad de» por defecto: alumna, padre, madre, la relación de quien lo pide y personal del centro', p.evaluate(() => {
  const f = { categoria: 'ALUMNADO', tercero: 'Alumna Uno', loPide: { nombre: 'Abuela Pérez', relacion: 'Abuela' }, relacionados: [{ categoria: 'PERSONAL', nombre: 'Profe Ana' }] };
  const b = { nombre: 'sin-ficha-en-el-registro', ficha: f, leido: {} };
  const v = { nombreNatural: 'Alumna Uno', tutor1: 'Tutor, Uno', tutor2: 'Tutor, Dos', sexos: { tercero: 'M', tutor1: 'H', tutor2: 'M' } };
  const sin = { nombreNatural: 'Alumna Uno', tutor1: 'Tutor, Uno', sexos: { tercero: '', tutor1: '' } };
  return [PersonaDelAsunto.personas(b, v).map((x) => x.calidad), PersonaDelAsunto.personas(b, sin).map((x) => x.calidad)];
}), [['alumna', 'abuela', 'personal del centro', 'padre', 'madre'], ['alumno/a', 'abuela', 'personal del centro', 'tutor/a legal']]);

const SOLO_HERMANOS = 'Nombre: {campo:Quién recibe (Nombre)} · DNI: {campo:Quién recibe (DNI)} · Tel: {campo:Quién recibe (teléfono)} · Como: {campo:Quién recibe (en calidad de)}.';

await comprobar('12. una plantilla con solo campos hermanos (sin el campo entero) pregunta la persona, una sola vez', p.evaluate(async ([t]) => {
  const a = App.E.listaAbiertos[0];
  const clave = Campos.claveDeCampo({ origen: 'propio', id: 'pq747' });
  await CampoDesdeElAsuntoEscribir.escribirEnAsunto(a, clave, { valor: '', anadir: undefined });
  const v = await Plantillas.valoresDeAsunto(a);
  return Plantillas.rellenar(t, v).faltan;
}, [SOLO_HERMANOS]), ['Quién recibe']);

await comprobar('13. elegida la persona, sale su nombre, DNI, teléfono y «en calidad de»; mayúsculas y tildes dan igual', p.evaluate(async ([t]) => {
  const a = App.E.listaAbiertos[0];
  const clave = Campos.claveDeCampo({ origen: 'propio', id: 'pq747' });
  await CampoDesdeElAsuntoEscribir.escribirEnAsunto(a, clave, { valor: 'Padre Ejemplo', persona: { dni: '55555555B', telefono: '600111222', correo: '', relacion: 'Tutor legal 1', calidad: 'padre' }, anadir: { origen: 'propio', id: 'pq747' } });
  const v = await Plantillas.valoresDeAsunto(a);
  const r = Plantillas.rellenar(t, v);
  const minus = Plantillas.rellenar('{campo:QUIEN RECIBE (NOMBRE)} {campo:quién recibe (En Calidad De)}', v);
  return [r.texto, minus.texto, r.faltan, minus.faltan];
}, [SOLO_HERMANOS]), ['Nombre: Padre Ejemplo · DNI: 55555555B · Tel: 600111222 · Como: padre.', 'Padre Ejemplo padre', [], []]);

await comprobar('14. una persona sin «en calidad de» por defecto: la plantilla lo pide («En calidad de Quién recibe») y escrito lo lleva', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const clave = Campos.claveDeCampo({ origen: 'propio', id: 'pq747' });
  await CampoDesdeElAsuntoEscribir.escribirEnAsunto(a, clave, { valor: 'Vecina Sin Calidad', persona: { dni: '44444444A', telefono: '', correo: '', relacion: '' }, anadir: { origen: 'propio', id: 'pq747' } });
  let v = await Plantillas.valoresDeAsunto(a);
  const antes = Plantillas.rellenar('{campo:Quién recibe (en calidad de)}', v);
  v.aMano = { 'En calidad de Quién recibe': 'tutora legal' };
  const mano = Plantillas.rellenar('{campo:Quién recibe (en calidad de)}', v).texto;
  const g = await DatosDelAsunto.guardar(a, 'En calidad de Quién recibe', 'tutora legal');
  v = await Plantillas.valoresDeAsunto(a);
  const despues = Plantillas.rellenar('{campo:Quién recibe (en calidad de)} / {campo:Quién recibe}', v);
  return [antes.faltan, mano, g.ok, despues.faltan, despues.texto];
}), [['En calidad de Quién recibe'], 'tutora legal', true, [], 'tutora legal / Vecina Sin Calidad, con DNI 44444444A']);

await comprobar('15. al cambiar de persona, el «en calidad de» escrito a mano de la anterior no se arrastra', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const v0 = await Plantillas.valoresDeAsunto(a);
  const lista = PersonaDelAsunto.personas(a, v0);
  await DatosDelAsunto.guardar(a, 'Quién recibe', PersonaDelAsunto.etiqueta(lista[0]));
  const v = await Plantillas.valoresDeAsunto(a);
  return [v.campos['Quién recibe (en calidad de)'], lista[0].calidad];
}).then(([real, defecto]) => [real === defecto, real !== 'tutora legal']), [true, true]);

await comprobar('16. el campo entero {campo:Quién recibe} sigue igual', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const v = await Plantillas.valoresDeAsunto(a);
  const r = Plantillas.rellenar('Recibe {campo:Quién recibe}.', v);
  return [r.faltan.filter((x) => x === 'Quién recibe').length, r.texto.indexOf('Recibe ') === 0];
}), [0, true]);

await comprobar('17. «En calidad de» sale en la ficha debajo de la persona, con «Cambiar», sin repetir el dato suelto', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  await DatosDelAsunto.guardar(a, 'En calidad de Quién recibe', 'tutora legal');
  FichaNucleo.modoActual = 'abierto';
  const caja = document.createElement('div');
  caja.id = 'prueba-773';
  caja.innerHTML = FichaNucleo.datosDelAsunto(a) || '';
  document.body.appendChild(caja);
  window.CampoDesdeElAsunto.alPintar(caja, a);
  const fila = caja.querySelector('.ficha-dato-calidad');
  const suelto = Array.from(caja.querySelectorAll('.ficha-dato > span:first-child')).filter((x) => /^En calidad de /.test(x.textContent)).length;
  return [!!fila, fila ? fila.textContent.indexOf('tutora legal') !== -1 : false, !!(fila && fila.querySelector('.ficha-calidad-cambiar')), suelto];
}), [true, true, true, 0]);

await comprobar('18. «Cambiar» de «En calidad de» guarda lo escrito, y vacío vuelve al valor de la app', p.evaluate(async () => {
  const a = App.E.listaAbiertos[0];
  const caja = document.getElementById('prueba-773');
  caja.querySelector('.ficha-calidad-cambiar').click();
  await new Promise((r) => setTimeout(r, 400));
  const entrada = document.getElementById('persona-calidad');
  entrada.value = 'madre de la alumna';
  document.getElementById('cuadro-aceptar').click();
  await new Promise((r) => setTimeout(r, 800));
  let v = await Plantillas.valoresDeAsunto(a);
  const escrito = v.campos['Quién recibe (en calidad de)'];
  await DatosDelAsunto.guardar(a, 'En calidad de Quién recibe', '');
  v = await Plantillas.valoresDeAsunto(a);
  return [escrito, v.campos['Quién recibe (en calidad de)'] !== 'madre de la alumna'];
}), ['madre de la alumna', true]);

await comprobar('19. elegida en «Faltan datos» con el documento a medias: los hermanos salen de lo escrito y «en calidad de» vacío se pide aparte', p.evaluate(async ([t]) => {
  const a = App.E.listaAbiertos[0];
  const clave = Campos.claveDeCampo({ origen: 'propio', id: 'pq747' });
  await CampoDesdeElAsuntoEscribir.escribirEnAsunto(a, clave, { valor: '', anadir: undefined });
  const v = await Plantillas.valoresDeAsunto(a);
  const aMano = { 'Quién recibe': 'Ana Gil, con DNI 66666666C' };
  PersonaDelAsunto.hermanosAMano(aMano, 'Quién recibe', { nombre: 'Ana Gil', dni: '66666666C', telefono: '', correo: '', calidad: '' });
  const sin = Plantillas.rellenar(t, Object.assign({}, v, { aMano: aMano }));
  aMano['En calidad de Quién recibe'] = 'tutora legal';
  const con = Plantillas.rellenar(t, Object.assign({}, v, { aMano: aMano }));
  return [sin.faltan, con.faltan, con.texto];
}, [SOLO_HERMANOS]), [['En calidad de Quién recibe'], [], 'Nombre: Ana Gil · DNI: 66666666C · Tel:  · Como: tutora legal.']);

await comprobar('10. no hay errores en la consola', Promise.resolve(errores), []);
await navegador.close();
if (fallos) { console.log(fallos + ' fallos'); process.exit(1); }
console.log('persona-del-asunto: todo bien');
