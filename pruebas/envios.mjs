/* Prueba en navegador de verdad de mandar los documentos de un asunto
   en un correo (docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md, fila 13).

   Lo que se comprueba:

     1. Marcar dos documentos y preparar deja en la bandeja las dos
        copias y el `.envio.json`, y el `.json` es el último que se
        escribe.
     2. El encargo lleva el `hilo` del asunto cuando lo tiene, y cadena
        vacía cuando el asunto no tiene `hilos`.
     3. Si lo marcado suma más de 20 MB no se prepara nada y sale el
        aviso.
     4. Cuando aparece `<id>.listo.json`, la tarjeta pasa a "Abrir el
        borrador en Gmail" y el encargo sale de `envios.json`.
     5. Con `<id>.error.json` sale el motivo y el encargo desaparece.
     6. Un `.envio.json` en la carpeta no aparece como un correo en la
        bandeja.

   Reutiliza el disco de mentira de pruebas/navegador.mjs, igual que
   pruebas/correos.mjs. */
import { chromium } from 'playwright';
import fs from 'fs';

const fuente = fs.readFileSync(new URL('./navegador.mjs', import.meta.url), 'utf8');
const preparacion = fuente.slice(fuente.indexOf('const preparacion = `') + 'const preparacion = `'.length,
                                 fuente.indexOf('`;\n\nconst DIRECCION'));

/* CON_HILO ya tiene la huella de dos hilos (fila 11): el encargo se va
   con el último. SIN_HILO es de los de antes, sin `hilos`. */
const CON_HILO = '260903 FLEXIBILIDAD 26-27 Pacheco Pérez, Mercedes 019G';
const SIN_HILO = '260910 PERMISO 26-27 Ordóñez Gil, Rafael 677B';

const navegador = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pagina = await navegador.newPage({ viewport: { width: 1600, height: 950 } });
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

await pagina.click('#btn-abiertos');
await pagina.click('#btn-archivo');
await pagina.fill('#campo-usuario', 'Francisco');
await pagina.waitForSelector('#btn-entrar:not([disabled])');

await pagina.evaluate(async ([conHilo, sinHilo]) => {
  const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR', { create: true });
  g._hijos.set('asuntos.json', window.__disco.fich('asuntos.json', JSON.stringify({
    asuntos: {
      [conHilo]: {
        tercero: 'Pacheco Pérez, Mercedes 019G', categoria: 'PERSONAL',
        situacion: 'EN EL DEPARTAMENTO',
        hilos: [{ id: 'hilo-viejo', asunto: 'lo de antes', visto: 2 },
                { id: 'hilo-bueno', asunto: 'lo último', visto: 3 }]
      },
      [sinHilo]: {
        tercero: 'Ordóñez Gil, Rafael 677B', categoria: 'PERSONAL',
        situacion: 'EN EL DEPARTAMENTO'
      }
    }
  })));

  const uno = await window.__disco.abiertos.getDirectoryHandle(conHilo, { create: true });
  uno._hijos.set('260903 26EA0412 SOLICITUD.pdf',
    window.__disco.fich('260903 26EA0412 SOLICITUD.pdf', 'la solicitud'));
  uno._hijos.set('260910 CERTIFICADO.pdf',
    window.__disco.fich('260910 CERTIFICADO.pdf', 'el certificado'));

  const dos = await window.__disco.abiertos.getDirectoryHandle(sinHilo, { create: true });
  /* Un documento enorme, para el tope de los 20 MB. El doble trae su
     getFile(), como todos los demás. */
  const grande = window.__disco.fich('260910 GRANDE.pdf', 'pesa mucho');
  grande.getFile = async () => ({ size: 21 * 1024 * 1024, name: '260910 GRANDE.pdf',
                                  text: async () => 'pesa mucho' });
  dos._hijos.set('260910 GRANDE.pdf', grande);
  dos._hijos.set('260911 INFORME.pdf', window.__disco.fich('260911 INFORME.pdf', 'el informe'));

  const d = await g.getDirectoryHandle('datos', { create: true });
  const per = [
    '"Empleado/a","DNI/Pasaporte","Puesto","Fecha de toma de posesión","Fecha de cese","Cuenta Google/Microsoft"',
    '"Pacheco Pérez, Mercedes","12345019G","Lengua P.E.S.","01/09/2015","","mercedes@correo.es"',
    '"Ordóñez Gil, Rafael","44556677B","Ordenanza","01/09/2015","","rafael@correo.es"'
  ].join('\r\n') + '\r\n';
  d._hijos.set('RelPerCen 26-27.csv', window.__disco.fich('RelPerCen 26-27.csv', per));
}, [CON_HILO, SIN_HILO]);

await pagina.click('#btn-entrar');
await pagina.waitForSelector('#aplicacion:not(.oculto)');

/* La bandeja de correos, del mismo molde que en pruebas/correos.mjs. */
await pagina.evaluate(async () => {
  window.__bandeja = await window.__disco.archivo.getDirectoryHandle('GESTOR-BANDEJA', { create: true });
  const antes = window.showDirectoryPicker;
  window.showDirectoryPicker = async function (opciones) {
    if (opciones && opciones.id === 'gestor-bandeja') return window.__bandeja;
    return antes(opciones);
  };
  /* Nada de pestañas nuevas mientras se prueba. */
  window.__abierto = '';
  window.open = function (u) { window.__abierto = String(u || ''); return null; };
});

await pagina.evaluate(() => App.ir('ajustes'));
await pagina.waitForSelector('#bloque-bandeja');
await pagina.evaluate(() => { document.getElementById('bloque-bandeja').open = true; });
await pagina.click('#botones-bandeja .boton');
await pagina.waitForTimeout(600);
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(600);

/* ---------- piezas ---------- */

async function ficherosDeLaBandeja() {
  return pagina.evaluate(() => Array.from(window.__bandeja._hijos.keys()));
}
async function encargo(id) {
  return pagina.evaluate(async (i) => {
    const f = await window.__bandeja.getFileHandle(i + '.envio.json');
    return JSON.parse(await (await f.getFile()).text());
  }, id);
}
async function enviosJson() {
  return pagina.evaluate(async () => {
    try {
      const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
      const f = await g.getFileHandle('envios.json');
      return JSON.parse(await (await f.getFile()).text());
    } catch (e) { return null; }
  });
}
async function elUltimoEnvio() {
  return pagina.evaluate(() => {
    const l = window.Envios.lista();
    return l.length ? l[l.length - 1].id : '';
  });
}
async function dejarRespuesta(id, cola, datos) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.evaluate(([n, d]) => {
    window.__bandeja._hijos.set(n, window.__disco.fich(n, JSON.stringify(d)));
  }, [id + cola, datos]);
  await pagina.evaluate(() => window.Envios.mirar());
  await pagina.waitForTimeout(400);
}

/* Abre la ficha de un asunto y pulsa su botón "Correo". */
async function abrirElCorreo(nombre) {
  await pagina.evaluate(() => App.ir('abiertos'));
  await pagina.evaluate(async () => { await App.verAbiertos(); });
  await pagina.waitForTimeout(400);
  await pagina.evaluate((n) => {
    const a = App.E.listaAbiertos.filter(x => x.nombre === n)[0];
    App.abrirFicha(a, 'abierto');
  }, nombre);
  await pagina.waitForSelector('#pantalla-asunto:not(.oculto)');
  await pagina.waitForTimeout(400);
  await pagina.click('.boton-correo');
  await pagina.waitForSelector('#correo-adjuntos .correo-doc');
}

/* El cuadro es más alto que la ventana, así que el botón de cerrar se
   pulsa por código: Playwright no lo alcanza con el ratón. */
async function cerrarElCuadro() {
  await pagina.evaluate(() => document.getElementById('cuadro-aceptar').click());
  await pagina.waitForTimeout(800);
}

/* ============================================================
   1 y 2. EL ENCARGO
   ============================================================ */
console.log('--- preparar el borrador con dos documentos ---');

const antesDeNada = await ficherosDeLaBandeja();

await abrirElCorreo(CON_HILO);

await comprobar('el bloque enseña los dos documentos del asunto',
  pagina.locator('#correo-adjuntos .correo-fila').allTextContents(),
  ['260903 26EA0412 SOLICITUD.pdf · 12 B', '260910 CERTIFICADO.pdf · 14 B']);
await comprobar('de partida no hay ninguno marcado',
  pagina.locator('#correo-adjuntos .correo-doc:checked').count(), 0);
await comprobar('y el botón de preparar está apagado',
  pagina.locator('#correo-preparar').isDisabled(), true);

await pagina.fill('#correo-otro', 'madre@correo.es');
await pagina.locator('#correo-adjuntos .correo-doc').nth(0).check();
await pagina.locator('#correo-adjuntos .correo-doc').nth(1).check();
await comprobar('con algo marcado, el botón se enciende',
  pagina.locator('#correo-preparar').isDisabled(), false);

await pagina.click('#correo-preparar');
await pagina.waitForTimeout(1200);

const primerEnvio = await elUltimoEnvio();
await comprobar('el encargo tiene un identificador que empieza por envio-',
  /^envio-\d{6}-\d{6}-\d{4}$/.test(primerEnvio), true);

const enLaBandeja = await ficherosDeLaBandeja();
await comprobar('1. en la bandeja están las dos copias y el encargo',
  enLaBandeja.filter(n => n.indexOf(primerEnvio) === 0),
  [primerEnvio + ' - 260903 26EA0412 SOLICITUD.pdf',
   primerEnvio + ' - 260910 CERTIFICADO.pdf',
   primerEnvio + '.envio.json']);
await comprobar('1. y el .envio.json es el último que se escribe',
  enLaBandeja[enLaBandeja.length - 1], primerEnvio + '.envio.json');

const elEncargo = await encargo(primerEnvio);
await comprobar('el encargo lleva el Para del cuadro: lo marcado y el "Otro correo"',
  elEncargo.para, 'mercedes@correo.es, madre@correo.es');
await comprobar('y el asunto, que es el nombre de la carpeta', elEncargo.asunto, CON_HILO);
await comprobar('y el nombre de la carpeta del asunto', elEncargo.asuntoCarpeta, CON_HILO);
await comprobar('y el cuerpo empieza por el saludo',
  elEncargo.cuerpo.indexOf('Hola, Pacheco Pérez, Mercedes:'), 0);
await comprobar('y los dos adjuntos con el identificador delante', elEncargo.adjuntos,
  [primerEnvio + ' - 260903 26EA0412 SOLICITUD.pdf',
   primerEnvio + ' - 260910 CERTIFICADO.pdf']);
await comprobar('2. el encargo se va con el último hilo del asunto',
  elEncargo.hilo, 'hilo-bueno');

await comprobar('el encargo vivo está en envios.json',
  enviosJson().then(l => l && l.map(e => [e.id, e.asunto])),
  [[primerEnvio, CON_HILO]]);

/* El rastro que queda en el asunto, con los documentos (2.4). */
await comprobar('la nota del asunto dice qué documentos van',
  pagina.evaluate(async (n) => {
    const g = await window.__disco.abiertos.getDirectoryHandle('_GESTOR');
    const f = await g.getFileHandle('asuntos.json');
    const ficha = JSON.parse(await (await f.getFile()).text()).asuntos[n] || {};
    return (ficha.notas || []).map(x => x.texto);
  }, CON_HILO),
  ['Correo a mercedes@correo.es, madre@correo.es — asunto: "' + CON_HILO + '" · con 2 documentos: ' +
   '260903 26EA0412 SOLICITUD.pdf, 260910 CERTIFICADO.pdf']);

await cerrarElCuadro();

/* La tarjeta se ve aunque el cuadro esté cerrado y estemos en otra
   pantalla: vive encima de la bandeja de correos. */
await comprobar('sale la tarjeta de borrador en camino',
  pagina.locator('#envios-en-camino .envio-tarjeta strong').textContent(),
  'Borrador en camino — ' + CON_HILO);

/* ============================================================
   6. UN ENCARGO NO ES UN CORREO
   ============================================================ */
await pagina.evaluate(() => App.ir('ajustes'));
await pagina.waitForSelector('#bloque-bandeja');
await pagina.evaluate(() => { document.getElementById('bloque-bandeja').open = true; });
await pagina.click('#botones-bandeja .boton');
await pagina.waitForTimeout(700);
await pagina.evaluate(() => App.ir('abiertos'));
await pagina.waitForTimeout(700);

await comprobar('6. el .envio.json no sale como un correo de la bandeja',
  pagina.locator('#bandeja-correos .tarjeta-correo').count(), 0);

/* ============================================================
   4. CUANDO EL SCRIPT CONTESTA QUE ESTÁ LISTO
   ============================================================ */
console.log('--- el borrador ya está ---');
const ENLACE = 'https://mail.google.com/mail/u/?authuser=paco%40g.educaand.es#drafts';
await dejarRespuesta(primerEnvio, '.listo.json',
  { id: primerEnvio, hecho: '2026-09-16T10:35:00', enlace: ENLACE });

await comprobar('4. la tarjeta pasa a borrador listo',
  pagina.locator('#envios-en-camino .envio-tarjeta strong').textContent(),
  'Borrador listo — ' + CON_HILO);
await comprobar('4. con el botón para abrirlo',
  pagina.locator('#envios-en-camino .envio-tarjeta .boton').textContent(),
  'Abrir el borrador en Gmail');

await pagina.click('#envios-en-camino .envio-tarjeta .boton');
await pagina.waitForTimeout(900);

await comprobar('4. el botón abre los borradores de Gmail',
  pagina.evaluate(() => window.__abierto), ENLACE);
await comprobar('4. el encargo sale de envios.json', enviosJson(), []);
await comprobar('4. y el .listo.json se borra de la bandeja',
  ficherosDeLaBandeja().then(l => l.filter(n => n.indexOf(primerEnvio) === 0)), []);
await comprobar('4. y la tarjeta desaparece',
  pagina.locator('#envios-en-camino .envio-tarjeta').count(), 0);

/* ============================================================
   3. EL TOPE DE LOS 20 MB
   ============================================================ */
console.log('--- el tope de los 20 MB ---');
await abrirElCorreo(SIN_HILO);

const antesDelTope = await ficherosDeLaBandeja();
await pagina.locator('#correo-adjuntos .correo-doc').nth(0).check();   /* el de 21 MB */
await pagina.waitForTimeout(200);

await comprobar('3. con más de 20 MB sale el aviso en rojo',
  pagina.locator('#correo-docs-aviso').getAttribute('class'), 'aviso aviso-rojo');
await comprobar('3. y el aviso dice el tamaño',
  pagina.locator('#correo-docs-aviso strong').textContent(),
  'Lo marcado son 21 MB: Gmail no admite tanto.');
await comprobar('3. y no se deja preparar nada',
  pagina.locator('#correo-preparar').isDisabled(), true);
await comprobar('3. en la bandeja no se ha escrito nada',
  ficherosDeLaBandeja(), antesDelTope);

/* ============================================================
   2 (segunda mitad) y 5. SIN HILO, Y CON ERROR
   ============================================================ */
await pagina.locator('#correo-adjuntos .correo-doc').nth(0).uncheck();
await pagina.locator('#correo-adjuntos .correo-doc').nth(1).check();
await pagina.waitForTimeout(200);
await comprobar('quitando el grande, el aviso se va',
  pagina.locator('#correo-docs-aviso').getAttribute('class'), 'oculto');

await pagina.click('#correo-preparar');
await pagina.waitForTimeout(1200);

const segundoEnvio = await elUltimoEnvio();
await comprobar('2. el asunto sin `hilos` manda el encargo con el hilo vacío',
  encargo(segundoEnvio).then(e => e.hilo), '');
await comprobar('y solo va el documento marcado',
  encargo(segundoEnvio).then(e => e.adjuntos), [segundoEnvio + ' - 260911 INFORME.pdf']);

await cerrarElCuadro();

console.log('--- el script no ha podido ---');
await dejarRespuesta(segundoEnvio, '.error.json',
  { id: segundoEnvio, motivo: 'El hilo ya no existe en Gmail.' });

await comprobar('5. sale el motivo del fallo',
  pagina.locator('#envios-en-camino .envio-tarjeta p').textContent(),
  'El hilo ya no existe en Gmail.');
await comprobar('5. con el botón de Entendido',
  pagina.locator('#envios-en-camino .envio-tarjeta .boton').textContent(), 'Entendido');

await pagina.click('#envios-en-camino .envio-tarjeta .boton');
await pagina.waitForTimeout(900);

await comprobar('5. el encargo desaparece de envios.json', enviosJson(), []);
await comprobar('5. y no se queda dando vueltas en la bandeja',
  ficherosDeLaBandeja().then(l => l.filter(n => n.indexOf(segundoEnvio) === 0)), []);
await comprobar('5. ni en pantalla',
  pagina.locator('#envios-en-camino .envio-tarjeta').count(), 0);

/* Lo que había antes de todo esto sigue igual: no se ha tocado nada más
   de la bandeja. */
await comprobar('la bandeja se queda como estaba', ficherosDeLaBandeja(), antesDeNada);

if (errores.length) { fallos++; console.log('ERRORES EN LA CONSOLA:\n' + errores.join('\n')); }
console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
await navegador.close();
process.exit(fallos ? 1 : 0);
