/* Prueba del HILO sin repetir (fila 210, docs/HILO-SIN-REPETIR.md):
   `soloLoNuevo` corta el texto citado, `hiloEnPdf` va del mensaje más
   nuevo al más antiguo sin repetirlos, y `guardarHilo` no vuelve a
   guardar los adjuntos de los mensajes que un hilo seguido ya había
   recogido.

   Mismo patrón que pruebas/envio-apps-script.mjs: `vm` con GmailApp,
   Utilities, PropertiesService, Session y DriveApp de mentira, porque
   Apps Script no se puede ejecutar de verdad fuera de Google.

   Lo que tiene que pasar:
     1. `soloLoNuevo` corta en la cita de Gmail en español, con el
        encabezado en una línea y en dos.
     2. Corta en la cita de Gmail en inglés.
     3. Corta en la cita de Outlook.
     4. Corta en un bloque final de líneas que empiezan por «>».
     5. No corta un reenvío.
     6. Si todo el mensaje es cita, devuelve el mensaje entero.
     7. `hiloEnPdf` pone los mensajes del más nuevo al más antiguo, y el
        texto del primer correo sale una sola vez.
     8. `guardarHilo` con `desde` solo guarda los adjuntos de los
        mensajes nuevos; con `desde = 0`, los de todos. */
import fs from 'node:fs';
import vm from 'node:vm';

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarQue(titulo, cond, detalle) {
  if (!cond) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

const fuente = fs.readFileSync(new URL('../apps-script/gestor-correos.gs', import.meta.url), 'utf8');

function crearBlob(contenido, nombre) {
  return {
    _html: contenido,
    nombre: nombre,
    getName: () => nombre,
    getAs: () => crearBlob(contenido, nombre),
    setName: (n) => crearBlob(contenido, n)
  };
}

function nuevoContexto() {
  const propiedades = {};
  const ctx = {
    console,
    Logger: { log: () => {} },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (Object.prototype.hasOwnProperty.call(propiedades, k) ? propiedades[k] : null),
        setProperty: (k, v) => { propiedades[k] = v; },
        getKeys: () => Object.keys(propiedades),
        deleteProperty: (k) => { delete propiedades[k]; }
      })
    },
    Utilities: {
      newBlob: (contenido, tipo, nombre) => crearBlob(contenido, nombre),
      formatDate: () => '260927',
      getUuid: () => 'uuid-' + Math.random().toString(36).slice(2)
    },
    Session: {
      getScriptTimeZone: () => 'Europe/Madrid',
      getEffectiveUser: () => ({ getEmail: () => 'francisco@centro.es' }),
      getActiveUser: () => ({ getEmail: () => 'francisco@centro.es' })
    },
    GmailApp: {},
    DriveApp: {}
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fuente, ctx, { filename: 'gestor-correos.gs' });
  return ctx;
}

function llamar(ctx, nombreFuncion, args) {
  ctx.__args = args;
  return vm.runInContext(nombreFuncion + '.apply(null, __args)', ctx);
}

/* ============================================================
   1-6. soloLoNuevo
   ============================================================ */
console.log('--- 1-6. soloLoNuevo ---');
{
  const c = nuevoContexto();

  const gmailEsUnaLinea = 'Vale, gracias.\n\n' +
    'El lun, 22 sept 2026 a las 10:15, Ana Pérez (<ana@correo.es>) escribió:\n' +
    '> Mensaje anterior\n> con dos líneas';
  comprobar('1. Gmail español, encabezado en una línea',
    llamar(c, 'soloLoNuevo', [gmailEsUnaLinea]), 'Vale, gracias.');

  const gmailEsDosLineas = 'Vale, gracias.\n\n' +
    'El lun, 22 sept 2026 a las\n' +
    '10:15, Ana Pérez (<ana@correo.es>) escribió:\n' +
    '> Mensaje anterior';
  comprobar('1. Gmail español, encabezado en dos líneas',
    llamar(c, 'soloLoNuevo', [gmailEsDosLineas]), 'Vale, gracias.');

  const gmailEn = 'Sure, thanks.\n\n' +
    'On Mon, Sep 22, 2026 at 10:15 AM Ana Pérez <ana@correo.es> wrote:\n' +
    '> Previous message';
  comprobar('2. Gmail inglés', llamar(c, 'soloLoNuevo', [gmailEn]), 'Sure, thanks.');

  const outlookMarca = 'De acuerdo.\n\n' +
    '-----Mensaje original-----\n' +
    'De: Ana Pérez [mailto:ana@correo.es]\n' +
    'Enviado: lunes, 22 de septiembre de 2026 10:15\n' +
    'Para: Francisco\n' +
    'Asunto: Re: Certificado\n\n' +
    'Texto anterior';
  comprobar('3. Outlook (marca «Mensaje original»)',
    llamar(c, 'soloLoNuevo', [outlookMarca]), 'De acuerdo.');

  const outlookSinMarca = 'De acuerdo.\n\n' +
    'De: Ana Pérez [mailto:ana@correo.es]\n' +
    'Enviado: lunes, 22 de septiembre de 2026 10:15\n' +
    'Para: Francisco\n' +
    'Asunto: Re: Certificado\n\n' +
    'Texto anterior';
  comprobar('3b. Outlook (bloque De:/Enviado: sin marca)',
    llamar(c, 'soloLoNuevo', [outlookSinMarca]), 'De acuerdo.');

  const bloqueCitas = 'Perfecto.\n\n> Cita anterior\n> más líneas citadas';
  comprobar('4. bloque final de «>»', llamar(c, 'soloLoNuevo', [bloqueCitas]), 'Perfecto.');

  const reenvio = '---------- Forwarded message ---------\n' +
    'From: Ana Pérez <ana@correo.es>\n' +
    'Date: mar, 22 sept 2026, 10:15\n' +
    'Subject: Certificado\n' +
    'To: Francisco <francisco@centro.es>\n\n' +
    'Aquí tienes el documento reenviado.';
  comprobar('5. no corta un reenvío', llamar(c, 'soloLoNuevo', [reenvio]), reenvio);

  const todoCita = '> Todo esto es una cita\n> de otro mensaje';
  comprobar('6. si todo es cita, el mensaje entero', llamar(c, 'soloLoNuevo', [todoCita]), todoCita);
}

/* ============================================================
   7. hiloEnPdf: del más nuevo al más antiguo, sin repetir
   ============================================================ */
console.log('--- 7. hiloEnPdf ---');
{
  const c = nuevoContexto();
  const textoOriginal = 'Hola, ¿podéis enviarme el certificado del curso?';
  const mensajes = [
    {
      getFrom: () => 'francisco@centro.es', getTo: () => 'ana@correo.es',
      getDate: () => 'lun, 27 sept 2026, 09:00', getPlainBody: () => textoOriginal
    },
    {
      getFrom: () => 'ana@correo.es', getTo: () => 'francisco@centro.es',
      getDate: () => 'lun, 27 sept 2026, 10:00',
      getPlainBody: () => 'Claro, ahí lo tienes.\n\n' +
        'El lun, 27 sept 2026 a las 09:00, Francisco (<francisco@centro.es>) escribió:\n' +
        '> ' + textoOriginal
    },
    {
      getFrom: () => 'francisco@centro.es', getTo: () => 'ana@correo.es',
      getDate: () => 'mar, 28 sept 2026, 08:00',
      getPlainBody: () => 'Gracias, recibido.\n\n' +
        'El lun, 27 sept 2026 a las 10:00, Ana (<ana@correo.es>) escribió:\n' +
        '> Claro, ahí lo tienes.\n' +
        '> \n' +
        '> El lun, 27 sept 2026 a las 09:00, Francisco (<francisco@centro.es>) escribió:\n' +
        '> > ' + textoOriginal
    }
  ];
  const hilo = { getFirstMessageSubject: () => 'Certificado', getId: () => 'hilo-1' };
  const pdf = llamar(c, 'hiloEnPdf', [hilo, mensajes]);
  const html = pdf._html;

  comprobarQue('7. el texto del primer correo sale una sola vez',
    (html.match(/podéis enviarme el certificado/g) || []).length === 1, html);
  const iNuevo = html.indexOf('Gracias, recibido.');
  const iMedio = html.indexOf('Claro, ahí lo tienes.');
  const iViejo = html.indexOf(textoOriginal);
  comprobarQue('7. va del más nuevo al más antiguo',
    iNuevo !== -1 && iMedio !== -1 && iViejo !== -1 && iNuevo < iMedio && iMedio < iViejo,
    JSON.stringify({ iNuevo, iMedio, iViejo }));
}

/* ============================================================
   8. guardarHilo: adjuntos solo de los mensajes nuevos
   ============================================================ */
console.log('--- 8. guardarHilo y los adjuntos ---');
{
  function adjunto(nombre) {
    return { getName: () => nombre, copyBlob: () => crearBlob('contenido', nombre) };
  }
  function mensaje(indice, nombreAdjunto) {
    return {
      getFrom: () => 'ana@correo.es', getTo: () => 'francisco@centro.es', getCc: () => '',
      getHeader: (h) => (h === 'Message-ID' ? ('<m' + indice + '>') : ''),
      getPlainBody: () => 'Mensaje ' + indice,
      getDate: () => new Date('2026-09-2' + (7 + indice) + 'T10:00:00'),
      getAttachments: () => [adjunto(nombreAdjunto)]
    };
  }
  function carpetaFalsa() {
    const creados = [];
    return {
      creados: creados,
      getFiles: () => ({ hasNext: () => false }),
      createFile: (a, b) => {
        if (typeof a === 'string') { creados.push({ nombre: a }); return { getName: () => a }; }
        creados.push({ nombre: a.getName ? a.getName() : a.nombre });
        return a;
      }
    };
  }
  const mensajes = [mensaje(0, 'a0.pdf'), mensaje(1, 'a1.pdf'), mensaje(2, 'a2.pdf')];
  const hilo = { getMessages: () => mensajes, getId: () => 'hilo-2', getFirstMessageSubject: () => 'Asunto' };

  const c1 = nuevoContexto();
  const carpeta1 = carpetaFalsa();
  llamar(c1, 'guardarHilo', [hilo, carpeta1, null, 2]);
  const adjuntosGuardados1 = carpeta1.creados.filter((f) => /a\d\.pdf$/.test(f.nombre));
  comprobar('8. con desde=2 (hilo seguido), solo el adjunto del tercer mensaje',
    adjuntosGuardados1.map((f) => f.nombre), ['hilo-2 - a2.pdf']);

  const c2 = nuevoContexto();
  const carpeta2 = carpetaFalsa();
  llamar(c2, 'guardarHilo', [hilo, carpeta2, null, 0]);
  const adjuntosGuardados2 = carpeta2.creados.filter((f) => /a\d\.pdf$/.test(f.nombre));
  comprobar('8. con desde=0 (recogido por etiqueta), los adjuntos de los tres',
    adjuntosGuardados2.length, 3);
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
