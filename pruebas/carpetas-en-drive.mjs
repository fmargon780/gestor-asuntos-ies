/* Prueba en navegador de verdad del otro ordenador, casa y la copia sin internet vieja, después de «Pasar a Drive».

   Fila 459 de docs/COLA.md (docs/PASAR-A-DRIVE.md, apartado «Fila 459»). Disco de mentira de pruebas/navegador.mjs.

     A. el otro ordenador (aún apunta a Dropbox, cuya raíz lleva PASADO-A-DRIVE.json): al entrar sale la franja y no se
        crea nada en Dropbox; una carpeta que no es la del traslado no se acepta; con las buenas entra y recuerda
        abiertos, archivo y entrada; la ruta de Dropbox apuntada se olvida y «Ruta» da una ruta de Drive;
     B. casa (sin Dropbox, con las carpetas de Drive señaladas como en una instalación nueva): entra sin franja y
        «Por clasificar» dice que solo se ve en el instituto; se puede guardar;
     C. la copia sin internet vieja (dirección con «NO USAR», o con «Dropbox» y las carpetas ya en Drive): lo dice,
        da la ruta nueva y no deja entrar; la nueva (en Drive) no sale como vieja;
     D. nada pasado a Drive: todo igual que antes (no sale ninguna franja). */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

const TEXTO_FRANJA = 'Las carpetas están ahora en Google Drive. Señálalas para seguir.';
const TEXTO_NO_ES = 'Esa no es la carpeta que se pasó a Drive. Si acabáis de hacer el traslado, puede que Google Drive aún no haya terminado de subirla: espera y vuelve a probar.';
const TEXTO_VIEJA = 'Esta copia es la vieja. Abre la que está en Google Drive.';
const FRASE = 'Los documentos por clasificar solo se ven en el instituto.';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
let fallos = 0;
const errores = [];

async function comprobar(titulo, real, esperado) {
  const r = await real;
  const ok = JSON.stringify(r) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(r) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* Una página con el disco de mentira; `antes` (texto de código) prepara las carpetas; `inicio` va antes de cargar. */
async function pagina(inicio) {
  const p = await navegador.newPage({ viewport: { width: 1500, height: 950 } });
  p.on('console', (m) => { if (m.type() === 'error' && m.text().indexOf('favicon') === -1) errores.push(m.text()); });
  p.on('pageerror', (e) => errores.push('EXCEPCIÓN: ' + e.message));
  await p.addInitScript(preparacion);
  if (inicio) await p.addInitScript(inicio);
  await p.goto(process.env.DIRECCION || 'http://localhost:8123/index.html');
  return p;
}

async function prepararEntrada(p, antes) {
  await p.click('#btn-abiertos');
  await p.click('#btn-archivo');
  await p.fill('#campo-usuario', 'Diego');
  await p.waitForSelector('#btn-entrar:not([disabled])');
  await p.evaluate(async (texto) => {
    const w = window;
    w.__nombres = (d) => { const n = []; return (async () => { for await (const x of d.entries()) n.push(x[0]); return n.sort(); })(); };
    // eslint-disable-next-line no-new-func
    await (new Function('window', 'return (async () => {' + texto + '})()'))(w);
  }, antes);
}

/* El traslado ya hecho: Drive tiene «asuntos vivos» (con su _GESTOR y la marca) y «ARCHIVO»; la raíz de «Dropbox» (la
   que este ordenador tiene guardada) lleva la marca, sin _GESTOR (se arrastró a «NO USAR»). */
const TRASLADO = (conMarcaEnDropbox = true) => `
  const id = 'T-prueba-1';
  const marca = { id, fecha: new Date().toISOString(), quien: 'Francisco', abiertos: 'asuntos vivos', archivo: 'ARCHIVO', copia: 'Gestor de Asuntos - aplicación', noUsar: 'NO USAR – pasado a Drive el 01-11-2026' };
  const f = window.__disco.fich;
  window.__drive = { raiz: null };
  const raiz = await window.__disco.abiertos.getDirectoryHandle('__tmp', { create: true });   /* solo para tener un dir() */
  await window.__disco.abiertos.removeEntry('__tmp');
  const nuevo = async (nombre) => { const t = await window.__disco.archivo.getDirectoryHandle('__tmp_' + nombre, { create: true }); return t; };
  const vivos = await nuevo('vivos'); vivos.name = 'asuntos vivos';
  const g = await vivos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('PASADO-A-DRIVE.json', f('PASADO-A-DRIVE.json', JSON.stringify(marca)));
  g._hijos.set('rutas.json', f('rutas.json', JSON.stringify({ nube: 'drive', abiertos: 'asuntos vivos', archivo: 'ARCHIVO' })));
  const arch = await nuevo('archivo'); arch.name = 'ARCHIVO';
  const otra = await nuevo('otra'); otra.name = 'asuntos vivos';
  const og = await otra.getDirectoryHandle('_GESTOR', { create: true });
  og._hijos.set('PASADO-A-DRIVE.json', f('PASADO-A-DRIVE.json', JSON.stringify({ ...marca, id: 'OTRO-TRASLADO' })));
  const mal = await nuevo('mal'); mal.name = 'Fotos';
  window.__drive = { vivos, arch, otra, mal };
  if (${conMarcaEnDropbox}) window.__disco.abiertos._hijos.set('PASADO-A-DRIVE.json', f('PASADO-A-DRIVE.json', JSON.stringify(marca)));
`;

/* ---------- A. el otro ordenador ---------- */
{
  const p = await pagina();
  await prepararEntrada(p, TRASLADO() + `
    window.localStorage.setItem('gestor-ruta-nube', 'C:\\\\Users\\\\Propietario\\\\Dropbox');
    window.__eleccion = [];
    window.showDirectoryPicker = async function (o) { return window.__eleccion.shift(); };
  `);
  await p.click('#btn-entrar');
  await p.waitForSelector('#franja-drive-nuevas');
  await comprobar('A. al entrar sale la franja de señalar las carpetas de Drive', p.locator('#franja-drive-nuevas .franja-drive-texto').innerText(), TEXTO_FRANJA);
  await comprobar('A. la app no entra', p.locator('#aplicacion.oculto').count(), 1);
  await comprobar('A. no se crea _GESTOR ni nada en Dropbox (solo está la marca)', p.evaluate(() => __nombres(__disco.abiertos)), ['PASADO-A-DRIVE.json']);

  /* una carpeta de asuntos que no es la del traslado: otro identificador */
  await p.evaluate(() => { window.__eleccion = [__drive.otra]; });
  await p.click('#franja-drive-senalar');
  await p.waitForSelector('#franja-drive-error:not(.oculto)');
  await comprobar('A. otra carpeta con otro identificador no se acepta', p.locator('#franja-drive-error').innerText(), TEXTO_NO_ES);
  await p.evaluate(() => { window.__eleccion = [__drive.mal]; });
  await p.click('#franja-drive-senalar');
  await comprobar('A. una carpeta sin _GESTOR tampoco', p.locator('#franja-drive-error').innerText(), TEXTO_NO_ES);

  await p.evaluate(() => { window.__eleccion = [__drive.vivos, __drive.mal]; });
  await p.click('#franja-drive-senalar');
  await p.waitForFunction(() => /ARCHIVO/.test(document.getElementById('franja-drive-senalar').textContent));
  await comprobar('A. con la buena pide ahora el ARCHIVO', p.locator('#franja-drive-senalar').innerText(), 'Señalar el ARCHIVO de Drive');
  await p.click('#franja-drive-senalar');
  await comprobar('A. un ARCHIVO con otro nombre no se acepta', p.locator('#franja-drive-error').innerText(), TEXTO_NO_ES);
  await p.evaluate(() => { window.__eleccion = [__drive.arch]; });
  await p.click('#franja-drive-senalar');
  await p.waitForSelector('#aplicacion:not(.oculto)', { timeout: 20000 });
  await comprobar('A. con las dos buenas entra en la aplicación', p.locator('#aplicacion:not(.oculto)').count(), 1);
  const estado = await p.evaluate(async () => ({
    abiertos: (await Almacen.leer('abiertos')).name, archivo: (await Almacen.leer('archivo')).name,
    entrada: (await Almacen.leer('entrada')).name, sesion: App.E.abiertos.name,
    dropbox: await __nombres(__disco.abiertos), drive: await __nombres(__drive.vivos),
    rutaVieja: [localStorage.getItem('gestor-ruta-nube'), localStorage.getItem('gestor-ruta-dropbox')]
  }));
  await comprobar('A. recuerda abiertos y archivo de Drive y deja la raíz de Dropbox como entrada',
    [estado.abiertos, estado.archivo, estado.entrada, estado.sesion], ['asuntos vivos', 'ARCHIVO', 'ASUNTOS ABIERTOS', 'asuntos vivos']);
  await comprobar('A. sigue sin crearse nada en Dropbox', estado.dropbox, ['PASADO-A-DRIVE.json']);
  await comprobar('A. trabaja sobre el _GESTOR de Drive', estado.drive.includes('_GESTOR') && estado.drive.includes('Pasado'), false);
  await comprobar('A. la ruta de Dropbox de este ordenador se olvida', estado.rutaVieja, [null, null]);

  /* «Ruta»: con la raíz de Drive apuntada, la ruta es de Drive y no de Dropbox */
  const ruta = await p.evaluate(async () => {
    localStorage.setItem('gestor-ruta-nube', 'C:\\Google Drive\\Mi unidad');
    await RutaCarpetas.cargarComun();
    return { texto: RutaCarpetas.de({ nombre: 'AAMMDD A26-0001 Prueba' }, 'abierto').texto, nube: RutaCarpetas.nombreNube() };
  });
  await comprobar('A. «Ruta» copia una ruta de Drive, no de Dropbox', [ruta.texto.indexOf('Mi unidad') !== -1, ruta.texto.indexOf('Dropbox') === -1, ruta.nube], [true, true, 'Google Drive']);
  await comprobar('A. y «Por clasificar» dice que solo se ve en el instituto no hace falta: la entrada de Dropbox se lee',
    p.evaluate(() => Entrada.estado()), 'propia');
  await p.close();
}

/* ---------- B. casa ---------- */
{
  const p = await pagina();
  await prepararEntrada(p, `
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
    g._hijos.set('rutas.json', window.__disco.fich('rutas.json', JSON.stringify({ nube: 'drive', abiertos: 'asuntos vivos', archivo: 'ARCHIVO' })));
    g._hijos.set('PASADO-A-DRIVE.json', window.__disco.fich('PASADO-A-DRIVE.json', JSON.stringify({ id: 'X', copia: 'Gestor' })));
  `);
  await p.click('#btn-entrar');
  await p.waitForSelector('#aplicacion:not(.oculto)');
  await comprobar('B. en casa no sale ninguna franja', p.locator('#franja-drive-nuevas').count(), 0);
  await p.click('.panel[data-vista="clasificar"]');
  await p.waitForSelector('#lista-sueltos .vacio');
  await comprobar('B. «Por clasificar» dice que solo se ve en el instituto', p.locator('#lista-sueltos .vacio').textContent(), FRASE);
  await comprobar('B. se puede guardar un documento en las carpetas de Drive',
    p.evaluate(async () => { await Carpetas.escribirTexto(App.E.abiertos, 'prueba-casa.txt', 'hola'); return (await __nombres(App.E.abiertos)).includes('prueba-casa.txt'); }), true);
  await p.close();
}

/* ---------- C. la copia sin internet vieja ---------- */
{
  /* en «NO USAR»: lo dice nada más abrir, con la ruta nueva si se conoce, y no deja entrar */
  const p = await pagina(`window.__DIRECCION_COPIA__ = { protocolo: 'file:', ruta: '/C:/Users/Propietario/Dropbox/asuntos vivos/NO USAR – pasado a Drive el 01-11-2026/Gestor de Asuntos - aplicación/index.html' };
    try { localStorage.setItem('gestor-ruta-nube', 'C:\\\\Google Drive\\\\Mi unidad'); } catch (e) {}`);
  await p.waitForSelector('#franja-drive-nuevas');
  await comprobar('C. en «NO USAR» dice que es la vieja', p.locator('#franja-drive-nuevas .franja-drive-texto').innerText(), TEXTO_VIEJA);
  await p.close();
}
{
  /* en Dropbox, con las carpetas ya en Drive (este ordenador, rutas.json dice drive) */
  const p = await pagina(`window.__DIRECCION_COPIA__ = { protocolo: 'file:', ruta: '/C:/Users/Usuario/Dropbox/Gestor de Asuntos - aplicación/index.html' };
    try { localStorage.setItem('gestor-ruta-nube', 'C:\\\\Google Drive\\\\Mi unidad'); } catch (e) {}`);
  await prepararEntrada(p, TRASLADO(false) + `
    window.__eleccion = [];`);
  await p.evaluate(async () => {
    /* este ordenador ya trabaja sobre Drive: sus carpetas recordadas son las de Drive */
    App.E.abiertos = __drive.vivos; App.E.archivo = __drive.arch;
  });
  await p.click('#btn-entrar');
  await p.waitForSelector('#franja-drive-nuevas');
  await comprobar('C. en Dropbox con las carpetas ya en Drive, dice que es la vieja', p.locator('#franja-drive-nuevas .franja-drive-texto').innerText(), TEXTO_VIEJA);
  await comprobar('C. da la ruta de la copia nueva, de Drive', p.locator('#franja-drive-nuevas code').innerText(), 'C:\\Google Drive\\Mi unidad\\Gestor de Asuntos - aplicación');
  await comprobar('C. y no deja entrar', p.locator('#aplicacion.oculto').count(), 1);
  await p.close();
}
{
  /* la copia nueva, en Drive: no es la vieja */
  const p = await pagina(`window.__DIRECCION_COPIA__ = { protocolo: 'file:', ruta: '/C:/Google Drive/Mi unidad/Gestor de Asuntos - aplicación/index.html' };`);
  await comprobar('C. la copia nueva (en Drive) no sale como vieja', p.evaluate(() => [CarpetasEnDrive.esCopiaVieja(null, true), CarpetasEnDrive.esCopiaVieja(null, false)]), [false, false]);
  await comprobar('C. en la web (https) nunca es una copia vieja', p.evaluate(() => CarpetasEnDrive.esCopiaVieja({ protocolo: 'https:', ruta: '/Dropbox/NO USAR/' }, true)), false);
  await comprobar('C. en Dropbox sin traslado hecho tampoco', p.evaluate(() => CarpetasEnDrive.esCopiaVieja({ protocolo: 'file:', ruta: '/C:/Users/Usuario/Dropbox/Gestor/index.html' }, false)), false);
  await p.close();
}

/* ---------- D. sin traslado: como antes ---------- */
{
  const p = await pagina();
  await prepararEntrada(p, '');
  await p.click('#btn-entrar');
  await p.waitForSelector('#aplicacion:not(.oculto)');
  await comprobar('D. sin traslado hecho entra sin franja', p.locator('#franja-drive-nuevas').count(), 0);
  await p.close();
}

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
