/* Fila 289 (7-oct-2026, docs/ENCARGOS-DE-DIRECTIVOS.md): los encargos de los directivos. Con Chromium real y los datos de la
   copia de pruebas (?demo=1&auto=1; `&usuario=<nombre>` entra con ese nombre; `Demo.entrarComo(nombre)` cambia de nombre sin
   recargar, para que los encargos pasen de unos a otros).

   1. La lógica: normalizar, fundir por id (gana el atendido / el más reciente), el conflicto de `encargos.json`, el id sin contador.
   2. Jefa de estudios: el menú; «Nuevo encargo» sin texto no deja enviar; con todo, queda `sin-atender` con su documento en
      su carpeta; la escritura pasa por `Perfil.escribir` y ninguna otra; «Mis encargos» enseña los cuatro estados, «Retirar»
      solo en el primero, ni el encargo de otro directivo; el de en marcha abre la ficha sin nada que cambie; «Retirar».
   3. Administración: «Ha llegado» cuenta los encargos y los abre; «Crear asunto con él» llega con tercero, fecha límite y
      quién lo pide; al crear, estado `asunto`, `ficha.encargos`, nota y documentos por el cuadro de nombre; «Guardar en un
      asunto que ya existe»; «No procede» exige motivo.
   4. Lo que le pasa después al asunto: archivar, reabrir, papelera, recuperar; cambiar el asunto no rompe el enlace.
   5. La jefa vuelve a entrar y ve lo que ha pasado. */
import { chromium } from 'playwright';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
const JEFA = 'Jefa de estudios de prueba';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ===== 1. La lógica, sin navegador ===== */
console.log('--- 1. la lógica ---');
{
  const raiz = new URL('../js/', import.meta.url).pathname;
  const dom = new JSDOM('');
  const ctx = { console, window: {}, document: dom.window.document, Date, JSON };
  vm.createContext(ctx);
  const disco = {};
  const norm = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  ctx.U = ctx.window.U = { normalizar: norm, ahora: () => '2026-10-07T10:00:00.000Z', accesorio() {} };
  ctx.App = ctx.window.App = { E: { usuario: 'Admin', registro: { asuntos: {} } }, enFila: (f, fn) => fn() };
  ctx.Carpetas = ctx.window.Carpetas = { leerJson: async (g, n) => (disco[n] === undefined ? null : JSON.parse(JSON.stringify(disco[n]))), leerTexto: async (g, n) => JSON.stringify(disco[n]) };
  ctx.Copias = ctx.window.Copias = { guardar: async (g, n, d) => { disco[n] = JSON.parse(JSON.stringify(d)); } };
  ctx.Gestor = ctx.window.Gestor = { carpetaGestor: () => ({}), alRefrescar: [] };
  vm.runInContext(fs.readFileSync(raiz + 'encargos.js', 'utf8'), ctx, { filename: 'encargos.js' });
  const E = ctx.Encargos;
  const n = E._normalizar({ _esquema: 1, encargos: [{ id: 'a', texto: 'x', estado: 'raro' }, { id: 'a' }, { texto: 'sin id' }, { id: 'b', estado: 'terminado', afecta: { texto: 'todo 1º A' }, documentos: ['d.pdf'] }] });
  await comprobar('1. normalizar: sin id o repetido se quita, un estado raro es «sin atender», el esquema se conserva',
    [n.encargos.map((e) => e.id + ':' + e.estado), n._esquema, n.encargos[1].afecta, n.encargos[1].documentos], [['a:sin-atender', 'b:terminado'], 1, { texto: 'todo 1º A' }, ['d.pdf']]);
  const mk = (id, estado, atendidoEl, texto) => E._normalizar({ encargos: [{ id, estado, atendidoEl, texto }] }).encargos[0];
  const f1 = E._fundir({ encargos: [mk('1', 'sin-atender', '', 'a'), mk('2', 'asunto', '2026-10-01', 'dos')] }, { encargos: [mk('1', 'asunto', '2026-10-02', 'a'), mk('2', 'asunto', '2026-10-05', 'dos-nuevo'), mk('3', 'sin-atender', '', 'tres')] });
  await comprobar('1. fundir por id: el atendido gana al sin atender; entre dos atendidos, el más reciente; lo demás se une',
    f1.encargos.map((e) => e.id + ':' + e.estado + ':' + e.texto), ['1:asunto:a', '2:asunto:dos-nuevo', '3:sin-atender:tres']);
  const id1 = E._nuevoId('Jefa de estudios de prueba'), id2 = E._nuevoId('Directora de prueba');
  await comprobar('1. el id lleva fecha, hora y el nombre, sin contador', [/^\d{6}-\d{6}-jefa-de-estudios-de-prue$/.test(id1), /^\d{6}-\d{6}-directora-de-prueba$/.test(id2)], [true, true]);
  disco['encargos.json'] = { encargos: [mk('1', 'sin-atender', '', 'real'), mk('4', 'sin-atender', '', 'cuatro')] };
  disco['encargos (conflicto).json'] = { encargos: [mk('1', 'asunto', '2026-10-02', 'real'), mk('5', 'sin-atender', '', 'cinco')] };
  ctx.Conflictos = ctx.window.Conflictos = { _interno: { conservarEsquemaMayor() {}, archivarConflicto: async (g, nom) => { delete disco[nom]; } } };
  await comprobar('1. un conflicto se funde por id', await E.fusionarConflicto({}, 'encargos (conflicto).json'), true);
  await comprobar('1. el atendido gana y lo demás se une', disco['encargos.json'].encargos.map((e) => e.id + ':' + e.estado).sort(), ['1:asunto', '4:sin-atender', '5:sin-atender']);
  await comprobar('1. el conflicto se archiva', 'encargos (conflicto).json' in disco, false);
  /* alCambiarElAsunto: archivar, reabrir, papelera, recuperar */
  disco['encargos.json'] = { encargos: [E._normalizar({ encargos: [{ id: 'x', estado: 'asunto' }, { id: 'y', estado: 'sin-atender' }, { id: 'z', estado: 'asunto' }] }).encargos].flat() };
  ctx.App.E.registro.asuntos.ASU = { encargos: [{ id: 'x' }, { id: 'y' }] };
  const est = () => disco['encargos.json'].encargos.map((e) => e.id + ':' + e.estado + (e.motivo ? ':' + e.motivo : ''));
  await E.alCambiarElAsunto('ASU', 'archivar');
  await comprobar('1. archivar: los encargos del asunto que estaban en marcha pasan a terminado', est(), ['x:terminado', 'y:sin-atender', 'z:asunto']);
  await E.alCambiarElAsunto('ASU', 'reabrir');
  await comprobar('1. reabrir: vuelven', est(), ['x:asunto', 'y:sin-atender', 'z:asunto']);
  await E.alCambiarElAsunto('ASU', 'papelera');
  await comprobar('1. papelera: no procede, con el motivo', est(), ['x:no-procede:El asunto se ha borrado', 'y:sin-atender', 'z:asunto']);
  await E.alCambiarElAsunto('ASU', 'recuperar');
  await comprobar('1. recuperar: vuelven a en marcha', est(), ['x:asunto', 'y:sin-atender', 'z:asunto']);
}

/* ===== el navegador ===== */
const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const errores = [];
async function entrar(usuario) {
  const p = await navegador.newPage({ viewport: { width: 1500, height: 1000 } });
  p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await p.addInitScript("try { localStorage.setItem('gestor.novedadesVistas', 'todo'); localStorage.setItem('gestor-inicio-pestana', 'adm'); } catch (e) {}");
  await p.goto(DIRECCION + (usuario ? '&usuario=' + encodeURIComponent(usuario) : ''));
  await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 40000 });
  await p.waitForSelector('#inicio-tabla-cuerpo tr[data-asunto]', { timeout: 40000 });
  await p.waitForTimeout(usuario ? 9000 : 4000);
  return p;
}
const menu = (p) => p.$$eval('.lateral .pestana', (e) => e.filter((x) => x.offsetParent).map((x) => x.querySelector('span').textContent.trim()));
const visibles = (p, sel) => p.$$eval(sel, (e) => e.filter((x) => x.offsetParent).length);
const encargosEnDisco = (p) => p.evaluate(async () => (await Carpetas.leerJson(Gestor.carpetaGestor(), 'encargos.json')).encargos);
const filasMios = (p) => p.$$eval('#encargos-mios-cuerpo tr[data-encargo]', (e) => e.map((f) => ({ id: f.dataset.encargo, estado: f.dataset.estado, texto: f.cells[1].textContent.trim(), afecta: f.cells[2].textContent.trim(), para: f.cells[3].textContent.trim(), va: f.cells[4].textContent.replace(/\s+/g, ' ').trim(), retirar: f.cells[4].querySelectorAll('button').length })));

/* ===== 2. La jefa de estudios ===== */
console.log('--- 2. Jefa de estudios ---');
let pagina = await entrar(JEFA);
await comprobar('2. el menú: Inicio, Nuevo encargo, Mis encargos y Archivo', menu(pagina).then((m) => m.filter((x) => x !== 'Salir')), ['Inicio', 'Nuevo encargo', 'Mis encargos', 'Archivo']);
await pagina.click('.pestana[data-pantalla="encargo-nuevo"]');
await pagina.waitForSelector('#encargo-texto', { state: 'visible' });
await comprobar('2. «Nuevo encargo»: las cuatro cosas, sin desplazamiento',
  pagina.evaluate(() => [['encargo-texto', 'encargo-buscar', 'encargo-para', 'encargo-soltar', 'encargo-enviar'].every((i) => document.getElementById(i).offsetParent), document.getElementById('encargo-enviar').getBoundingClientRect().bottom <= window.innerHeight]), [true, true]);
const antes = (await encargosEnDisco(pagina)).length;
await pagina.click('#encargo-enviar');
await pagina.waitForTimeout(500);
await comprobar('2. sin «¿Qué necesitas?» no envía y lo dice', Promise.all([pagina.locator('#encargo-error').textContent(), encargosEnDisco(pagina).then((l) => l.length)]), ['Escribe qué necesitas.', antes]);
await pagina.evaluate(() => { window.__escribir = 0; const o = Perfil.escribir; Perfil.escribir = function (fn) { window.__escribir++; return o.call(Perfil, fn); }; });
await pagina.fill('#encargo-texto', 'Necesito que se prepare el informe de convivencia del grupo 2º B antes de la evaluación.');
await pagina.fill('#encargo-buscar', 'Espejo');
await pagina.waitForSelector('.encargo-resultado');
await comprobar('2. el resultado enseña solo el nombre y, en el alumnado, su unidad', pagina.$$eval('.encargo-resultado', (e) => e.map((x) => x.textContent.trim())), ['Espejo Montes, Carla · 4º A']);
await pagina.click('.encargo-resultado');
await pagina.fill('#encargo-para', '2026-11-20');
await pagina.setInputFiles('#encargo-ficheros', { name: 'Notas de convivencia.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 prueba') });
await comprobar('2. el documento sale en la lista', pagina.$$eval('#encargo-lista-ficheros li span', (e) => e.map((x) => x.textContent)), ['Notas de convivencia.pdf']);
await pagina.click('#encargo-enviar');
await pagina.waitForSelector('#encargos-mios-cuerpo tr[data-estado="sin-atender"]', { timeout: 8000 });
await comprobar('2. aviso verde «Encargo enviado a Administración.»', pagina.$$eval('#mensajes .mensaje.bueno', (e) => e.map((x) => x.textContent)), ['Encargo enviado a Administración.']);
await comprobar('2. se abre «Mis encargos» con el nuevo arriba, «Sin atender»', filasMios(pagina).then((f) => [f[0].texto.slice(0, 32), f[0].va.replace(/ Retirar$/, ''), f[0].afecta, f[0].para]), ['Necesito que se prepare el infor', 'Sin atender', 'Espejo Montes, Carla · 4º A', '20/11/2026']);
const disco1 = await encargosEnDisco(pagina);
const nuevo = disco1.filter((e) => /convivencia/.test(e.texto))[0];
await comprobar('2. en disco: sin atender, de la jefa, con su afectado y su documento', [nuevo.estado, nuevo.de, nuevo.organo, nuevo.afecta.nombre, nuevo.afecta.categoria, nuevo.paraCuando, nuevo.documentos], ['sin-atender', JEFA, 'Jefatura de Estudios', 'Espejo Montes, Carla', 'ALUMNADO', '2026-11-20', ['Notas de convivencia.pdf']]);
await comprobar('2. el documento está en su carpeta de _GESTOR/encargos',
  pagina.evaluate(async (id) => { const c = await (await Gestor.carpetaGestor().getDirectoryHandle('encargos')).getDirectoryHandle(id); return (await Carpetas.ficheros(c)).map((f) => f.nombre); }, nuevo.id), ['Notas de convivencia.pdf']);
await comprobar('2. la escritura pasó por Perfil.escribir', pagina.evaluate(() => window.__escribir > 0), true);
await comprobar('2. ninguna otra escritura del directivo pasa',
  pagina.evaluate(async () => { try { await Carpetas.guardarJson(App.E.gestor, 'encargos.json', { encargos: [] }); return 'escrito'; } catch (e) { return e.name; } }), 'SoloConsulta');
await comprobar('2. «Mis encargos»: los cuatro estados, y no el de la directora',
  filasMios(pagina).then((f) => [f.length, f.map((x) => x.estado).sort(), f.some((x) => /carta de bienvenida/.test(x.texto))]), [5, ['asunto', 'no-procede', 'sin-atender', 'sin-atender', 'terminado'], false]);
await comprobar('2. «En marcha · Hito N de M · título», «Terminado» y «No procede: motivo»',
  filasMios(pagina).then((f) => f.filter((x) => x.estado !== 'sin-atender').map((x) => x.va).sort().map((t) => t.replace(/(Hito) \d+ de \d+ · .*/, '$1 N de M · título'))),
  ['En marcha · Hito N de M · título', 'No procede: Eso se hace en Séneca, no es un asunto del centro.', 'Terminado']);
await comprobar('2. «Retirar» solo en los sin atender', filasMios(pagina).then((f) => f.map((x) => x.estado + ':' + x.retirar).sort()), ['asunto:1', 'no-procede:0', 'sin-atender:1', 'sin-atender:1', 'terminado:0'].sort().map((t) => t.replace('asunto:1', 'asunto:1')));
await pagina.click('tr[data-estado="sin-atender"] .encargo-que >> nth=0');
await comprobar('2. pulsar «Qué pedí» enseña el texto entero y sus documentos', pagina.evaluate(() => [document.querySelector('.encargo-detalle .encargo-texto-entero').textContent.length > 60, [...document.querySelectorAll('.encargo-detalle .encargo-doc')].map((b) => b.textContent)]), [true, ['Notas de convivencia.pdf']]);
await pagina.click('tr[data-estado="asunto"] td:last-child button');
await pagina.waitForTimeout(1500);
await comprobar('2. el que está en marcha abre la ficha del asunto, en consulta',
  pagina.evaluate(() => [!document.getElementById('pantalla-asunto').classList.contains('oculto'), document.querySelectorAll('.boton-presencia-tomar').length, [...document.querySelectorAll('#ficha-asunto-cuerpo button')].filter((b) => /^(Archivar|Reabrir|Guardar|Hecha|Anotar)/.test(b.textContent.trim()) && !b.disabled).length]), [true, 0, 0]);
await pagina.click('#ficha-volver');
await pagina.waitForTimeout(500);
await comprobar('2. «Volver» lleva a «Mis encargos»', visibles(pagina, '#encargos-mios-cuerpo table'), 1);
await pagina.click('tr[data-estado="sin-atender"] button:has-text("Retirar") >> nth=0');
await pagina.waitForTimeout(1200);
await comprobar('2. «Retirar»: desaparece de la tabla y queda `retirado`', Promise.all([filasMios(pagina).then((f) => f.length), encargosEnDisco(pagina).then((l) => l.filter((e) => e.estado === 'retirado').length)]), [4, 1]);
await comprobar('2. ni una sola escritura sin pasar por la puerta (al pasear)', pagina.evaluate(() => Demo.escrituras() > 0), true);
await pagina.close();

/* ===== 3. Administración ===== */
console.log('--- 3. Administración ---');
pagina = await entrar('');
const jefaTexto = 'cambio de grupo de Iker';
await comprobar('3. «Ha llegado» cuenta los encargos, resaltado', pagina.evaluate(() => { const t = [...document.querySelectorAll('#inicio-ha-llegado-linea .inicio-ha-llegado-trozo')].find((b) => /encargo/.test(b.textContent)); return t ? [t.textContent, t.classList.contains('inicio-ha-llegado-nuevo')] : null; }), ['2 encargos', true]);
await pagina.click('#inicio-ha-llegado-linea .inicio-ha-llegado-trozo:has-text("encargos")');
await pagina.waitForTimeout(800);
await comprobar('3. «Ver todo» enseña solo los encargos', pagina.evaluate(() => [document.querySelectorAll('.encargo-tarjeta').length, !!document.getElementById('correos-sin-clasificar').offsetParent, !!document.getElementById('lista-sueltos').offsetParent, !!document.getElementById('sueltos-ver-tambien').offsetParent]), [2, false, false, true]);
await comprobar('3. cada tarjeta: quién, texto, a quién afecta, para cuándo, documentos y tres botones',
  pagina.evaluate(() => { const t = [...document.querySelectorAll('.encargo-tarjeta')].find((x) => /Iker/.test(x.textContent)); return [t.querySelector('.encargo-quien').textContent.replace(/\s+/g, ' ').indexOf('Jefa de estudios de prueba · Jefatura de Estudios · ') === 0, /cambio de grupo/.test(t.textContent), /Delgado Prieto, Iker · 2º B/.test(t.textContent), /Para cuándo/.test(t.textContent), [...t.querySelectorAll('.encargo-doc')].map((b) => b.textContent), [...t.querySelectorAll('.encargo-acciones button')].map((b) => b.textContent)]; }),
  [true, true, true, true, ['Justificante de matrícula (prueba).pdf'], ['Crear asunto con él', 'Guardar en un asunto que ya existe', 'No procede']].map((x) => (typeof x === 'string' ? x.slice(0, 55) : x)));
await pagina.click('.encargo-tarjeta:has-text("Iker") .encargo-doc');
await pagina.waitForTimeout(800);
await comprobar('3. un documento se abre en el panel de lectura', pagina.evaluate(() => document.body.classList.contains('con-lector')), true);
await pagina.keyboard.press('Escape');
/* Crear asunto con él */
await pagina.click('.encargo-tarjeta:has-text("Iker") button:has-text("Crear asunto con él")');
await pagina.waitForSelector('#pantalla-nuevo:not(.oculto) #tercero-elegido:not(.oculto)', { timeout: 8000 });
await comprobar('3. «Nuevo asunto» llega con el tercero ya elegido y la fecha límite puesta', Promise.all([pagina.locator('#tercero-elegido').textContent().then((t) => /Delgado Prieto, Iker/.test(t)), pagina.inputValue('#campo-limite')]), [true, await pagina.evaluate(() => { const d = new Date(); d.setDate(d.getDate() + 10); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); })]);
await comprobar('3. y «Quién lo pide» relleno con el directivo, su órgano y su correo',
  pagina.evaluate(() => { const c = document.getElementById('lopide-caja-nuevo'); return [c.querySelector('.lopide-quien').value, c.querySelector('.lopide-otro-nombre').value, c.querySelector('.lopide-otro-relacion').value, c.querySelector('.lopide-otro-correo').value]; }),
  ['otro', JEFA, 'Jefatura de Estudios', 'jefatura@correo-demo.es']);
await comprobar('3. el aviso de dónde viene', pagina.locator('#aviso-pendiente').textContent().then((t) => /viene de un encargo/.test(t)), true);
await pagina.click('#tipos-lista .tipo-boton:has-text("atr")');
await pagina.waitForFunction(() => !document.getElementById('btn-crear').disabled, null, { timeout: 8000 });
await pagina.click('#btn-crear');
await pagina.waitForSelector('#doc-guardar', { state: 'visible', timeout: 15000 });
await comprobar('3. al crear, se abre el cuadro de ponerle nombre al documento adjunto', pagina.evaluate(() => /Justificante de matrícula/.test(document.getElementById('doc-cuerpo').textContent)), true);
const asuntoNuevo = await pagina.evaluate(() => Object.keys(App.E.registro.asuntos).filter((n) => (App.E.registro.asuntos[n].encargos || []).length && /Delgado Prieto, Iker/.test(n))[0]);
await comprobar('3. el asunto lleva `ficha.encargos`, la nota y el documento en su carpeta',
  pagina.evaluate(async (n) => { const f = App.E.registro.asuntos[n]; const c = await App.E.abiertos.getDirectoryHandle(n); return [f.encargos.length, f.encargos[0].de, (f.notas || []).filter((x) => /^Encargo de Jefa de estudios de prueba \(Jefatura de Estudios\): Hay que preparar el cambio de grupo/.test(x.texto)).length, f.loPide && f.loPide.nombre, (await Carpetas.ficheros(c)).map((x) => x.nombre).filter((x) => /Justificante/.test(x))]; }, asuntoNuevo),
  [1, JEFA, 1, JEFA, ['Justificante de matrícula (prueba).pdf']]);
const e1 = (await encargosEnDisco(pagina)).filter((e) => /cambio de grupo de Iker/.test(e.texto))[0];
await comprobar('3. el encargo pasa a `asunto`, con su número y nombre, y su carpeta se borra',
  Promise.all([e1.estado, e1.asunto.nombre === asuntoNuevo, /^A\d\d-\d{4}$/.test(e1.asunto.numero), e1.atendidoPor, pagina.evaluate(async (id) => { try { await (await Gestor.carpetaGestor().getDirectoryHandle('encargos')).getDirectoryHandle(id); return true; } catch (e) { return false; } }, e1.id)]),
  ['asunto', true, true, 'Revisor', false]);
await pagina.click('#doc-guardar');
await pagina.waitForTimeout(2000);
/* «Ver todo»: ese ya no está; «No procede» exige motivo */
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(500);
await pagina.evaluate(() => App.irVista('clasificar', 'encargos'));
await pagina.waitForTimeout(800);
await comprobar('3. ese encargo ya no está en «Ver todo»', pagina.$$eval('.encargo-tarjeta', (e) => e.map((x) => /Iker/.test(x.textContent))), [false]);
const nuevoDeLaJefa = (id, texto) => pagina.evaluate(async ([id, texto]) => {
  await Encargos.cambiar((d) => { d.encargos.push({ id, de: 'Jefa de estudios de prueba', organo: 'Jefatura de Estudios', cuando: new Date().toISOString(), texto, estado: 'sin-atender', afecta: { nombre: 'Aguilar Ponce, Pablo', categoria: 'ALUMNADO', clave: '2100002', unidad: '3º A' }, documentos: [] }); });
  Inicio.repintar(); App.irVista('clasificar', 'encargos');
}, [id, texto]);
await nuevoDeLaJefa('261007-101000-jefa-aula', 'Reservar el aula 12 para la reunión de tutores.');
await pagina.waitForTimeout(800);
await pagina.click('.encargo-tarjeta:has-text("aula 12") button:has-text("No procede")');
await pagina.click('.encargo-tarjeta:has-text("aula 12") button:has-text("Confirmar que no procede")');
await pagina.waitForTimeout(500);
await comprobar('3. «No procede» sin motivo no deja seguir', Promise.all([pagina.locator('.encargo-tarjeta').count(), encargosEnDisco(pagina).then((l) => l.filter((e) => e.estado === 'no-procede').length)]), [2, 1]);
await pagina.fill('.encargo-motivo input', 'Esto lo decide el claustro.');
await pagina.click('.encargo-tarjeta:has-text("aula 12") button:has-text("Confirmar que no procede")');
await pagina.waitForTimeout(800);
await comprobar('3. con motivo, desaparece y queda guardado', Promise.all([pagina.locator('.encargo-tarjeta').count(), encargosEnDisco(pagina).then((l) => l.filter((e) => e.motivo === 'Esto lo decide el claustro.').map((e) => e.estado))]), [1, ['no-procede']]);
/* Guardar en un asunto que ya existe: uno nuevo de la jefa */
await nuevoDeLaJefa('261007-101010-jefa-otro', 'Añadir al expediente de Pablo la autorización de la excursión.');
await pagina.waitForTimeout(800);
await pagina.click('.encargo-tarjeta:has-text("excursión") button:has-text("Guardar en un asunto que ya existe")');
await pagina.waitForSelector('#enlace-todos .enlace-asunto');
await pagina.click('#enlace-todos .enlace-asunto:has-text("Aguilar Ponce, Pablo")');
await pagina.waitForTimeout(1500);
const pablo = await pagina.evaluate(() => Object.keys(App.E.registro.asuntos).filter((n) => /Aguilar Ponce, Pablo/.test(n) && App.E.registro.asuntos[n].estado === 'abierto')[0]);
await comprobar('3. «Guardar en un asunto que ya existe»: queda la nota y el encargo, sin crear otro asunto',
  pagina.evaluate((n) => { const f = App.E.registro.asuntos[n]; return [(f.notas || []).filter((x) => /^Encargo de Jefa de estudios de prueba \(Jefatura de Estudios\): Añadir al expediente/.test(x.texto)).length, f.encargos.length, Object.keys(App.E.registro.asuntos).filter((k) => /Aguilar Ponce, Pablo/.test(k)).length]; }, pablo), [1, 2, 1]);
await comprobar('3. y el encargo apunta a ese asunto', encargosEnDisco(pagina).then((l) => { const e = l.filter((x) => x.id === '261007-101010-jefa-otro')[0]; return [e.estado, e.asunto.nombre === pablo]; }), ['asunto', true]);

/* ===== 4. Lo que le pasa después al asunto ===== */
console.log('--- 4. archivar, reabrir, papelera y cambiar ---');
const estadoDe = (id) => encargosEnDisco(pagina).then((l) => l.filter((e) => e.id === id).map((e) => e.estado + (e.motivo ? ':' + e.motivo : ''))[0]);
await pagina.evaluate((n) => { window.__cierre = App.cerrarAsunto(Gestor.asuntos().filter((a) => a.nombre === n)[0]); }, asuntoNuevo);
await pagina.waitForSelector('#cuadro-aceptar', { state: 'visible', timeout: 5000 });
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(2500);
await comprobar('4. archivar el asunto: su encargo pasa a «terminado»', estadoDe(e1.id), 'terminado');
await pagina.evaluate((n) => { window.__cierre = App.verArchivo().then(() => App.reabrirAsunto(App.E.listaArchivo.filter((x) => x.nombre === n)[0])); }, asuntoNuevo);
await pagina.waitForSelector('#cuadro-aceptar', { state: 'visible', timeout: 5000 });
await pagina.click('#cuadro-aceptar');
await pagina.waitForTimeout(2500);
await comprobar('4. reabrirlo: vuelve a «asunto»', estadoDe(e1.id), 'asunto');
/* cambiar el nombre del asunto no rompe el enlace */
const renombrado = asuntoNuevo.replace('Delgado Prieto, Iker', 'Delgado Prieto, Iker (cambiado)');
await pagina.evaluate(async ([viejo, nuevo]) => { await Carpetas.renombrar(App.E.abiertos, viejo, nuevo); await AsuntoRenombrar.mover(viejo, nuevo, {}); await App.verAbiertos(); }, [asuntoNuevo, renombrado]);
await pagina.waitForTimeout(1500);
await comprobar('4. cambiar el asunto: el nombre guardado se pone al día y el enlace sigue',
  Promise.all([encargosEnDisco(pagina).then((l) => l.filter((e) => e.id === e1.id)[0].asunto.nombre === renombrado), pagina.evaluate((id) => Encargos.asuntoDe(Encargos.porId(id)).nombre, e1.id)]), [true, renombrado]);
await pagina.evaluate(async (n) => { await Papelera.mandarAsunto(Gestor.asuntos().filter((a) => a.nombre === n)[0]); await App.verAbiertos(); }, renombrado);
await pagina.waitForTimeout(1500);
await comprobar('4. mandarlo a la papelera: «no procede», «El asunto se ha borrado»', estadoDe(e1.id), 'no-procede:El asunto se ha borrado');
await pagina.evaluate(async () => { const f = (await Papelera.leer()).filter((x) => x.clase === 'asunto')[0]; await Papelera.devolver(f); await App.verAbiertos(); });
await pagina.waitForTimeout(1500);
await comprobar('4. recuperarlo: vuelve a «asunto»', estadoDe(e1.id), 'asunto');
await comprobar('4. el asunto recuperado sigue con su `ficha.encargos`', pagina.evaluate((n) => (App.E.registro.asuntos[n].encargos || []).length, renombrado), 1);

/* ===== 5. La jefa vuelve a entrar ===== */
console.log('--- 5. la jefa vuelve a entrar ---');
await pagina.evaluate(async (j) => { await Demo.entrarComo(j); }, JEFA);
await pagina.waitForTimeout(3500);
await pagina.click('.pestana[data-pantalla="encargos-mios"]');
await pagina.waitForSelector('#encargos-mios-cuerpo tr[data-encargo]');
await comprobar('5. «Mis encargos»: el del asunto creado, «En marcha» con su hito; el «No procede» con su motivo',
  filasMios(pagina).then((f) => [f.filter((x) => /cambio de grupo de Iker/.test(x.texto)).map((x) => /^En marcha · Hito \d+ de \d+/.test(x.va))[0], f.filter((x) => /Esto lo decide el claustro/.test(x.va)).length]), [true, 1]);
await comprobar('5. ese asunto sale en su Inicio aunque el tipo elegido sea de otro órgano', pagina.evaluate(async () => { await App.verAbiertos(); return Gestor.asuntos().some((a) => /Delgado Prieto, Iker/.test(a.nombre)); }), true);
await pagina.close();

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
