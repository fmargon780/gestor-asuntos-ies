/* Fila 287 (7-oct-2026, docs/PERFIL-DIRECTIVO.md): el perfil directivo. Con Chromium real y los datos de la copia de pruebas
   (?demo=1&auto=1; `&usuario=<nombre>` entra con ese nombre después de montarlos).

   1. Un nombre sin perfil es Administración y nada cambia (menú completo, tablón, avisos, todas las pestañas).
   2. Ajustes → El centro → «Quién usa la aplicación»: los nombres con su perfil y su correo, el resumen, el cambio se
      guarda al cambiar, «+ Añadir persona».
   3. «Jefa de estudios de prueba»: la línea fija de arriba; el menú, solo Inicio y Archivo; una sola lista con los asuntos
      de Jefatura (y el reservado, con candado); el buscador no encuentra los de otro órgano; el Archivo, solo los suyos;
      la ficha, sin nada que cambie; ni una escritura al entrar ni al pasear.
   4. «Directora de prueba»: los de Dirección y no los de Jefatura. Los de «Varios» y sin asignar no los ve ninguno.
   5. Una escritura fuera de `Perfil.escribir` se rechaza con la frase del perfil; dentro, pasa.
   6. La lógica: `veAsunto`, el fichero y la fusión de un conflicto por nombre. */
import { chromium } from 'playwright';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const DIRECCION = (process.env.DIRECCION || 'http://localhost:8123/index.html') + '?demo=1&auto=1';
let fallos = 0;
async function comprobar(titulo, promesa, esperado) {
  const real = await promesa;
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ===== 6. La lógica, sin navegador ===== */
console.log('--- 6. la lógica ---');
{
  const raiz = new URL('../js/', import.meta.url).pathname;
  const dom = new JSDOM('');
  const ctx = { console, window: {}, document: dom.window.document };
  vm.createContext(ctx);
  const disco = {};
  ctx.App = ctx.window.App = { E: {}, tipoDeAsunto: (a) => a.tipo };
  ctx.TiposOrgano = ctx.window.TiposOrgano = { deNombre: (t) => ({ T_JEF: 'JEFATURA', T_SEC: 'SECRETARIA', T_VAR: 'VARIOS' }[t] || '') };
  ctx.Carpetas = ctx.window.Carpetas = { leerJson: async (g, n) => (disco[n] === undefined ? null : JSON.parse(JSON.stringify(disco[n]))), permiso: async () => true,
    leerTexto: async (g, n) => JSON.stringify(disco[n]) };
  ctx.Copias = ctx.window.Copias = { guardar: async (g, n, d) => { disco[n] = JSON.parse(JSON.stringify(d)); } };
  ctx.Gestor = ctx.window.Gestor = { carpetaGestor: () => ({}) };
  vm.runInContext(fs.readFileSync(raiz + 'perfil.js', 'utf8'), ctx, { filename: 'perfil.js' });
  const P = ctx.Perfil;
  const carpetaFalsa = (contenido) => ({ getDirectoryHandle: async () => ({ getFileHandle: async () => ({ getFile: async () => ({ text: async () => contenido }) }) }) });
  await P.leerAntes(carpetaFalsa(JSON.stringify({ perfiles: { 'Ana': { perfil: 'JEFATURA', correo: 'a@x.es' }, 'Raro': { perfil: 'INVENTADO' } } })), 'Ana');
  comprobar('6. un nombre con perfil JEFATURA es directivo, con su órgano y su correo', [P.esDirectivo(), P.organo(), P.correo()], [true, 'JEFATURA', 'a@x.es']);
  comprobar('6. un perfil que no existe es Administración', P.perfilDe('Raro'), 'ADMIN');
  comprobar('6. un nombre que no está, también', P.perfilDe('Nadie'), 'ADMIN');
  comprobar('6. veAsunto: el de su órgano sí; el de otro, no; «Varios» y sin asignar, no',
    [P.veAsunto({ tipo: 'T_JEF' }), P.veAsunto({ tipo: 'T_SEC' }), P.veAsunto({ tipo: 'T_VAR' }), P.veAsunto({ tipo: 'T_NO' })], [true, false, false, false]);
  comprobar('6. un encargo suyo lo deja ver aunque sea de otro órgano',
    [P.veAsunto({ tipo: 'T_SEC', ficha: { encargos: [{ de: 'Ana' }] } }), P.veAsunto({ tipo: 'T_SEC', ficha: { encargos: [{ de: 'Otra' }] } })], [true, false]);
  comprobar('6. la frase de entrada', P.textoDeEntrada(), 'Entras como Jefatura de Estudios. Ves los asuntos de tu órgano.');
  await P.leerAntes(carpetaFalsa('no es json'), 'Ana');
  comprobar('6. un fichero roto o ausente: Administración, y ve todo', [P.esDirectivo(), P.veAsunto({ tipo: 'T_SEC' })], [false, true]);
  await P.leerAntes({ getDirectoryHandle: async () => { throw new Error('no está'); } }, 'Ana');
  comprobar('6. sin carpeta: Administración', P.esDirectivo(), false);
  await P.guardar('Luis', { perfil: 'DIRECCION', correo: 'l@x.es' });
  comprobar('6. guardar: queda en el fichero', disco['perfiles.json'].perfiles.Luis, { perfil: 'DIRECCION', correo: 'l@x.es' });
  await P.guardar('Luis', { perfil: 'ADMIN', correo: '' });
  comprobar('6. un nombre vuelto a Administración sin correo sale del fichero', 'Luis' in disco['perfiles.json'].perfiles, false);
  comprobar('6. el resumen', P.resumen(['Luis', 'Ana', 'Pedro']), '3 de Administración · 0 directivos');
  disco['perfiles.json'] = { perfiles: { A: { perfil: 'DIRECCION', correo: '' }, B: { perfil: 'JEFATURA', correo: '' } } };
  disco['perfiles (conflicto).json'] = { perfiles: { A: { perfil: 'SECRETARIA', correo: '' }, C: { perfil: 'SECRETARIA', correo: 'c@x.es' } } };
  ctx.Conflictos = ctx.window.Conflictos = { _interno: { conservarEsquemaMayor() {}, archivarConflicto: async (g, n) => { delete disco[n]; } } };
  comprobar('6. un conflicto se funde por nombre', await P.fusionarConflicto({}, 'perfiles (conflicto).json'), true);
  comprobar('6. si los dos cambian el mismo nombre, gana el fichero real; lo demás se une',
    Object.entries(disco['perfiles.json'].perfiles).map(([n, e]) => n + ':' + e.perfil).sort(), ['A:DIRECCION', 'B:JEFATURA', 'C:SECRETARIA']);
  comprobar('6. el conflicto se archiva', 'perfiles (conflicto).json' in disco, false);
}

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
const filas = (p) => p.$$eval('#inicio-tabla-cuerpo tr[data-asunto]', (e) => e.map((x) => x.dataset.asunto));
const visibles = (p, sel) => p.$$eval(sel, (e) => e.filter((x) => x.offsetParent).length);

/* ===== 1 y 2. Administración ===== */
console.log('--- 1. Administración ---');
let pagina = await entrar('');
await comprobar('1. el menú completo', menu(pagina).then((m) => m.filter((x) => x !== 'Salir')), ['Inicio', 'Nuevo asunto', 'Archivo', 'Personas y empresas', 'Impresos', 'Cuentas', 'Herramientas', 'Ajustes']);
await comprobar('1. sin línea de perfil y con las pestañas de Inicio', Promise.all([pagina.locator('#franja-perfil').count(), visibles(pagina, '.inicio-pestana').then((n) => n >= 4)]), [0, true]);
await comprobar('1. «+ Nuevo asunto» y el tablón están', Promise.all([visibles(pagina, '#btn-nuevo-asunto'), visibles(pagina, '#tablon')]), [1, 1]);
console.log('--- 2. Ajustes: quién usa la aplicación ---');
await pagina.click('.pestana[data-pantalla="ajustes"]');
await pagina.waitForTimeout(800);
await pagina.evaluate(() => { if (App.cambiarPestanaAjustes) App.cambiarPestanaAjustes('centro'); });
await pagina.waitForSelector('#bloque-perfiles', { timeout: 10000 });
await pagina.evaluate(() => { document.getElementById('bloque-perfiles').open = true; });
await pagina.evaluate(() => PerfilAjustes.pintar());
await pagina.waitForTimeout(800);
await comprobar('2. la sección existe, con su resumen', pagina.locator('#perfiles-pie').textContent(), '1 de Administración · 3 directivos');
await comprobar('2. una fila por nombre, con su perfil y su correo',
  pagina.$$eval('.perfil-fila', (e) => e.map((f) => [f.dataset.nombre, f.querySelector('.perfil-elegir').value, f.querySelector('.perfil-correo').value])),
  [['Revisor', 'ADMIN', ''], ['Directora de prueba', 'DIRECCION', 'directora@correo-demo.es'], ['Secretario de prueba', 'SECRETARIA', 'secretario@correo-demo.es'], ['Jefa de estudios de prueba', 'JEFATURA', 'jefatura@correo-demo.es']]);
await pagina.locator('.perfil-fila[data-nombre="Directora de prueba"] .perfil-elegir').selectOption('SECRETARIA');
await pagina.waitForTimeout(1500);
await pagina.evaluate(() => PerfilAjustes.pintar());
await pagina.waitForTimeout(800);
await comprobar('2. el cambio sigue ahí al repintar la sección, sin «Guardar»', pagina.locator('.perfil-fila[data-nombre="Directora de prueba"] .perfil-elegir').inputValue(), 'SECRETARIA');
await comprobar('2. y está en el fichero', pagina.evaluate(async () => (await Carpetas.leerJson(Gestor.carpetaGestor(), 'perfiles.json')).perfiles['Directora de prueba'].perfil), 'SECRETARIA');
await pagina.locator('.perfil-fila[data-nombre="Directora de prueba"] .perfil-elegir').selectOption('DIRECCION');
await pagina.waitForTimeout(1200);
await pagina.fill('#nueva-persona-perfil', 'Persona nueva de prueba');
await pagina.click('#btn-anadir-persona-perfil');
await pagina.waitForTimeout(1500);
await comprobar('2. «+ Añadir persona»: sale con perfil Administración',
  pagina.locator('.perfil-fila[data-nombre="Persona nueva de prueba"] .perfil-elegir').inputValue(), 'ADMIN');
await pagina.close();

/* ===== 3. Jefa de estudios ===== */
console.log('--- 3. Jefa de estudios ---');
pagina = await entrar('Jefa de estudios de prueba');
const escrituras = () => pagina.evaluate(() => Demo.escrituras());
await comprobar('3. la línea fija de arriba', pagina.locator('#franja-perfil').textContent(), 'Entras como Jefatura de Estudios. Ves los asuntos de tu órgano.');
await comprobar('3. sin la franja de «solo consultar»', pagina.locator('#franja-solo-consulta').count(), 0);
await comprobar('3. el menú, solo Inicio y Archivo', menu(pagina).then((m) => m.filter((x) => x !== 'Salir')), ['Inicio', 'Archivo']);
await comprobar('3. sin tablón, ni «Ha llegado», ni avisos, ni «+ Nuevo asunto», ni las otras pestañas',
  Promise.all([visibles(pagina, '#btn-nuevo-asunto, #tablon, #inicio-ha-llegado-linea, #avisos-linea, #inicio-fila-superior'), visibles(pagina, '.inicio-pestana')]), [0, 1]);
await comprobar('3. una sola lista, solo asuntos de Jefatura (MATRICULA), con el reservado', filas(pagina).then((f) => [f.length, f.every((n) => /MATRICULA/.test(n))]), [3, true]);
await comprobar('3. el reservado sale tapado, con su candado', pagina.locator('#inicio-tabla-cuerpo tr.inicio-tabla-fila-tapada').count(), 1);
await pagina.fill('#buscar-abiertos', 'Espejo Montes');
await pagina.waitForTimeout(800);
await comprobar('3. el buscador no encuentra un tercero que solo tiene asuntos de Secretaría', filas(pagina), []);
await pagina.fill('#buscar-abiertos', '');
await pagina.waitForTimeout(600);
await comprobar('3. sin «Lo encarga» entre los filtros', visibles(pagina, 'label.filtro:has(#filtro-organo)'), 0);
await pagina.locator('#inicio-tabla-cuerpo tr[data-asunto*="Aguilar Ponce, Marina"] .tarjeta-nombre').first().click();
await pagina.waitForTimeout(1500);
await comprobar('3. la ficha: sin «Tomar el mando» y sin «Archivar el asunto» encendido',
  pagina.evaluate(() => [document.querySelectorAll('.boton-presencia-tomar').length, [...document.querySelectorAll('#ficha-asunto-cuerpo button, #ficha-archivar button')].filter((b) => /Archivar/.test(b.textContent) && !b.disabled).length]), [0, 0]);
await comprobar('3. la ficha: la zona «Suelta aquí el PDF» no se ve', visibles(pagina, '.guion-soltar'), 0);
await pagina.click('#ficha-volver');
await pagina.click('.pestana[data-pantalla="archivo"]');
await pagina.waitForTimeout(2500);
await comprobar('3. el Archivo, solo asuntos de Jefatura', pagina.$$eval('#lista-archivo [data-asunto], #lista-archivo .tarjeta-nombre', (e) => e.map((x) => (x.dataset.asunto || x.textContent))).then((l) => l.every((n) => /MATRICULA/i.test(n))), true);
await comprobar('3. en el Archivo no hay «Reabrir» a la vista', visibles(pagina, '#lista-archivo .accion-de-administracion'), 0);
await comprobar('3. en el menú ⋮ del Archivo, «Reconstruir el índice» no se ve', visibles(pagina, '#btn-reconstruir-indice'), 0);
await comprobar('3. en el Archivo, un solo asunto archivado', pagina.evaluate(() => App.E.listaArchivo.length), 1);
await comprobar('3. ni una escritura al entrar ni al pasear', escrituras(), 0);
/* 5. la puerta */
console.log('--- 5. la puerta para escribir ---');
await comprobar('5. crear un fichero fuera de la puerta se rechaza, con la frase del perfil',
  pagina.evaluate(async () => { try { await App.E.gestor.getFileHandle('intruso.json', { create: true }); return 'creado'; } catch (e) { return [e.name, U.mensajeDeError(e)]; } }),
  ['SoloConsulta', 'Con tu perfil no se puede cambiar esto.']);
await comprobar('5. dentro de Perfil.escribir sí pasa',
  pagina.evaluate(async () => Perfil.escribir(async (gestor) => { await gestor.getFileHandle('puerta.json', { create: true }); return 'creado'; })), 'creado');
await pagina.evaluate(async () => Perfil.escribir(async (gestor) => { await gestor.removeEntry('puerta.json'); }));
await comprobar('5. y fuera otra vez se rechaza', pagina.evaluate(async () => { try { await App.E.gestor.getFileHandle('otro.json', { create: true }); return 'creado'; } catch (e) { return e.name; } }), 'SoloConsulta');
await pagina.close();

/* ===== 4. Directora ===== */
console.log('--- 4. Directora ---');
pagina = await entrar('Directora de prueba');
await comprobar('4. los asuntos son los de Dirección (BAJA MEDICA), y no los de Jefatura', filas(pagina).then((f) => [f.length, f.every((n) => /BAJA MEDICA/.test(n)), f.some((n) => /MATRICULA/.test(n))]), [2, true, false]);
await comprobar('4. ni «Varios» (seguro escolar) ni sin asignar (consejo escolar)', filas(pagina).then((f) => f.some((n) => /SEGURO|CERTCONSESC/.test(n))), false);
await pagina.close();

await comprobar('sin errores en la consola', errores, []);
await navegador.close();
if (fallos) { console.log('\n' + fallos + ' fallo(s).'); process.exit(1); }
console.log('\nTodo bien.');
