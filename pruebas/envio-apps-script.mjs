/* Prueba del ENVÍO de correo del script de Apps Script
   (apps-script/gestor-correos.gs, `doPost`/`enviarCorreo`/
   `hiloParaResponder`/`prepararEnvio`), fila 115, 24-sep-2026,
   docs/ENVIAR-DESDE-EL-ASUNTO.md.

   Sin navegador, con `vm` (mismo patrón que pruebas/formularios-rellenar.mjs
   y pruebas/formularios.mjs): Apps Script no se puede ejecutar de
   verdad fuera de Google (no hay cuenta real en este entorno, ver
   docs/COMPROBAR-A-MANO.md), así que se cargan las funciones del
   fichero en un contexto con GmailApp, PropertiesService, Utilities,
   ContentService y Session de mentira, y se llama a `doPost` como lo
   llamaría Apps Script: con un `e` que trae `postData.contents`.

   Lo que tiene que pasar:
     1. `prepararEnvio` crea una clave la primera vez y la reutiliza
        después.
     2. `doPost` con la clave que toca manda de verdad (createDraft +
        send) y devuelve { ok: true, hilo, matricula }.
     3. Con la clave mal, o sin ninguna clave guardada todavía, no se
        manda nada.
     4. La clave también se acepta por `e.parameter.k` (el `?k=` de la
        propia dirección).
     5. Sin "para" ni "cco", no hay a quién mandarlo.
     6. Sin "para" pero con "cco", "para" pasa a ser la propia cuenta.
     7. `prueba: true` manda siempre a la propia cuenta, ignorando
        "para"/"cco".
     8. Más de 20 MB entre los adjuntos, ni se intenta mandar.
     9. Con un `hilo` cuyos destinatarios ya son destinatarios del
        hilo, se responde DENTRO (createDraftReply), no con un correo
        nuevo.
    10. Con un `hilo` al que se le añade alguien nuevo, correo nuevo
        (nunca se mezclan destinatarios sin que nadie lo haya
        decidido).
    11. Un `hilo` que no existe en este buzón: correo nuevo, sin
        reventar.
    12. (fila 117) Con getActiveUser() vacío y getEffectiveUser() con
        correo, «Probar» y un envío solo con copia oculta van a la
        cuenta efectiva.
    13. (fila 117) `prepararEnvio` con getUrl() terminado en /dev:
        registra la clave y de dónde copiar la /exec, nunca la /dev. */
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

/* Un contexto nuevo por cada bloque de pruebas, para que las
   propiedades del script (la clave, "visto:...") no se contaminen
   entre pruebas distintas. */
function nuevoContexto(opciones) {
  opciones = opciones || {};
  const propiedades = {};
  const logs = [];
  const enviados = [];   /* cada createDraft()/createDraftReply().send() de verdad */

  const hilos = opciones.hilos || {};  /* id -> { mensajes: [{de,para,cc,messageId}] } */

  function mensajeFalso(m) {
    return {
      getFrom: () => m.de || '',
      getTo: () => m.para || '',
      getCc: () => m.cc || '',
      getHeader: (h) => (h === 'Message-ID' ? (m.messageId || '') : ''),
      getPlainBody: () => m.texto || '',
      getDate: () => new Date('2026-09-24T09:00:00')
    };
  }

  function hiloFalso(id) {
    const h = hilos[id];
    if (!h) return null;
    return {
      getId: () => id,
      getMessages: () => h.mensajes.map(mensajeFalso),
      getMessageCount: () => h.mensajes.length,
      getFirstMessageSubject: () => h.asunto || '(sin asunto)',
      createDraftReply: (texto, opciones2) => ({
        send: () => {
          const mensaje = { texto: texto, opciones: opciones2, hilo: id,
            messageId: 'matricula-respuesta-' + (enviados.length + 1) };
          enviados.push(Object.assign({ tipo: 'respuesta' }, mensaje));
          return {
            getThread: () => ({ getId: () => id }),
            getHeader: (hh) => (hh === 'Message-ID' ? mensaje.messageId : '')
          };
        }
      })
    };
  }

  const ctx = {
    console,
    Logger: { log: (t) => logs.push(String(t)) },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => (Object.prototype.hasOwnProperty.call(propiedades, k) ? propiedades[k] : null),
        setProperty: (k, v) => { propiedades[k] = v; }
      })
    },
    Utilities: {
      base64Decode: (s) => Buffer.from(String(s), 'base64'),
      newBlob: (bytes, tipo, nombre) => ({ bytes: bytes, tipo: tipo, nombre: nombre }),
      formatDate: () => '2026-09-24T09:00:00',
      getUuid: () => 'uuid-' + Math.random().toString(36).slice(2)
    },
    ContentService: {
      MimeType: { JSON: 'JSON' },
      createTextOutput: (texto) => ({
        _texto: texto,
        setMimeType: function () { return this; },
        getContent: function () { return this._texto; }
      })
    },
    Session: {
      /* Con acceso «Cualquier usuario», getActiveUser() llega vacía
         (fila 117): `correoActivo: ''` lo simula. */
      getActiveUser: () => ({ getEmail: () => ('correoActivo' in opciones ? opciones.correoActivo : (opciones.miCorreo || 'francisco@centro.es')) }),
      getEffectiveUser: () => ({ getEmail: () => opciones.miCorreo || 'francisco@centro.es' }),
      getScriptTimeZone: () => 'Europe/Madrid'
    },
    ScriptApp: {
      getService: () => ({ getUrl: () => opciones.urlImplementacion || '' })
    },
    DriveApp: { getRootFolder: () => ({ getFoldersByName: () => ({ hasNext: () => false }), createFolder: () => ({}) }), getFoldersByName: () => ({ hasNext: () => false }) },
    GmailApp: {
      getThreadById: (id) => hiloFalso(id),
      createDraft: (para, asunto, cuerpo, opciones2) => ({
        send: () => {
          const mensaje = { para: para, asunto: asunto, cuerpo: cuerpo, opciones: opciones2,
            messageId: 'matricula-nueva-' + (enviados.length + 1) };
          enviados.push(Object.assign({ tipo: 'nuevo' }, mensaje));
          return {
            getThread: () => ({ getId: () => 'hilo-nuevo-' + enviados.length }),
            getHeader: (hh) => (hh === 'Message-ID' ? mensaje.messageId : '')
          };
        }
      }),
      search: () => []
    }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(fuente, ctx, { filename: 'gestor-correos.gs' });
  return { ctx: ctx, propiedades: propiedades, logs: logs, enviados: enviados };
}

/* Pasar `e` de verdad al contexto, por una variable global: más simple
   que serializar un objeto con funciones dentro. */
function llamarDoPost(contexto, cuerpoObjeto, parametroK) {
  contexto.ctx.__e = { postData: { contents: JSON.stringify(cuerpoObjeto) } };
  if (parametroK) contexto.ctx.__e.parameter = { k: parametroK };
  const salida = vm.runInContext('doPost(__e).getContent()', contexto.ctx);
  return JSON.parse(salida);
}

/* ============================================================
   1. prepararEnvio: crea la clave y la reutiliza
   ============================================================ */
console.log('--- 1. prepararEnvio ---');
{
  const c = nuevoContexto({ urlImplementacion: 'https://script.google.com/macros/s/ABC/exec' });
  vm.runInContext('prepararEnvio()', c.ctx);
  const clave1 = c.propiedades['clave-envio'];
  comprobarQue('la primera vez crea una clave', !!clave1 && clave1.length > 10, JSON.stringify(c.propiedades));
  comprobarQue('deja la dirección con la clave en el registro',
    c.logs.some((l) => l.indexOf('?k=' + clave1) !== -1), c.logs.join(' | '));

  vm.runInContext('prepararEnvio()', c.ctx);
  comprobar('la segunda vez reutiliza la misma clave', c.propiedades['clave-envio'], clave1);
}

console.log('--- 1b. prepararEnvio sin implementación todavía ---');
{
  const c = nuevoContexto({ urlImplementacion: '' });
  vm.runInContext('prepararEnvio()', c.ctx);
  comprobarQue('sin URL, da la clave y dice de dónde copiar la dirección, sin reventar',
    c.logs.some((l) => l.indexOf(c.propiedades['clave-envio']) !== -1) &&
    c.logs.some((l) => l.indexOf('Gestionar implementaciones') !== -1), c.logs.join(' | '));
}

/* ============================================================
   2-4. doPost: clave correcta, mal, ausente, y por el parámetro k
   ============================================================ */
console.log('--- 2-4. doPost y la clave ---');
{
  const c = nuevoContexto();
  vm.runInContext('prepararEnvio()', c.ctx);
  const clave = c.propiedades['clave-envio'];

  const r1 = llamarDoPost(c, { clave: clave, para: 'ana@correo.es', asunto: 'Hola', cuerpo: 'Texto' });
  comprobar('2. con la clave que toca, manda de verdad', r1.ok, true);
  comprobarQue('2. devuelve el hilo y la matrícula', !!r1.hilo && !!r1.matricula, JSON.stringify(r1));
  comprobar('2. de verdad se ha llamado a Gmail', c.enviados.length, 1);

  const r2 = llamarDoPost(c, { clave: 'otra-clave-cualquiera', para: 'ana@correo.es' });
  comprobar('3. con la clave mal, no manda nada', r2.ok, false);
  comprobar('3. sigue en uno solo (no ha mandado el de la clave mala)', c.enviados.length, 1);

  const r3 = llamarDoPost(c, { para: 'ana@correo.es' }, clave);
  comprobar('4. la clave también vale por el parámetro k', r3.ok, true);
  comprobar('4. van ya dos mandados', c.enviados.length, 2);
}

console.log('--- 3b. doPost sin ninguna clave guardada todavía ---');
{
  const c = nuevoContexto();     /* sin prepararEnvio() */
  const r = llamarDoPost(c, { clave: 'lo-que-sea', para: 'ana@correo.es' });
  comprobar('sin clave guardada, no manda nada', r.ok, false);
  comprobar('nada se ha llamado a Gmail', c.enviados.length, 0);
}

/* ============================================================
   5-7. a quién se manda
   ============================================================ */
console.log('--- 5-7. a quién se manda ---');
{
  const c = nuevoContexto();
  vm.runInContext('prepararEnvio()', c.ctx);
  const clave = c.propiedades['clave-envio'];

  const r5 = llamarDoPost(c, { clave: clave, para: '', cco: '', asunto: 'x', cuerpo: 'x' });
  comprobar('5. sin para ni cco, no hay a quién mandarlo', r5.ok, false);
  comprobarQue('5. lo dice', r5.motivo.indexOf('destinatario') !== -1, r5.motivo);

  const r6 = llamarDoPost(c, { clave: clave, para: '', cco: 'grupo@correo.es', asunto: 'x', cuerpo: 'x' });
  comprobar('6. sin para pero con cco, se manda igual', r6.ok, true);
  comprobar('6. "para" pasa a ser la propia cuenta', c.enviados[c.enviados.length - 1].para, 'francisco@centro.es');

  const r7 = llamarDoPost(c, { clave: clave, prueba: true, para: 'esto-se-ignora@correo.es', cco: 'esto-tambien@correo.es' });
  comprobar('7. la prueba manda a la propia cuenta', r7.ok, true);
  const ultimo = c.enviados[c.enviados.length - 1];
  comprobar('7. ignora el "para" que traiga el cuerpo', ultimo.para, 'francisco@centro.es');
  comprobarQue('7. sin copia oculta', !ultimo.opciones || !ultimo.opciones.bcc, JSON.stringify(ultimo.opciones));
}

/* ============================================================
   8. más de 20 MB
   ============================================================ */
console.log('--- 8. más de 20 MB ---');
{
  const c = nuevoContexto();
  vm.runInContext('prepararEnvio()', c.ctx);
  const clave = c.propiedades['clave-envio'];
  const grande = Buffer.alloc(15 * 1024 * 1024, 'x').toString('base64');
  const r = llamarDoPost(c, {
    clave: clave, para: 'ana@correo.es', asunto: 'x', cuerpo: 'x',
    adjuntos: [{ nombre: 'a.pdf', tipo: 'application/pdf', base64: grande },
               { nombre: 'b.pdf', tipo: 'application/pdf', base64: grande }]
  });
  comprobar('no manda nada con más de 20 MB', r.ok, false);
  comprobarQue('lo dice', r.motivo.indexOf('20 MB') !== -1, r.motivo);
  comprobar('nada se ha llamado a Gmail', c.enviados.length, 0);
}

/* ============================================================
   9-11. responder dentro de un hilo, o correo nuevo
   ============================================================ */
console.log('--- 9-11. el hilo ---');
{
  const c = nuevoContexto({
    hilos: {
      'hilo-abc': {
        asunto: 'Contrato',
        mensajes: [
          { de: 'francisco@centro.es', para: 'proveedor@correo.es', cc: '', messageId: '<m1>' },
          { de: 'proveedor@correo.es', para: 'francisco@centro.es', cc: '', messageId: '<m2>' }
        ]
      }
    }
  });
  vm.runInContext('prepararEnvio()', c.ctx);
  const clave = c.propiedades['clave-envio'];

  const r9 = llamarDoPost(c, {
    clave: clave, para: 'proveedor@correo.es', asunto: 'Re: Contrato', cuerpo: 'Va el documento.',
    hilo: 'hilo-abc'
  });
  comprobar('9. responde dentro del hilo cuando el destinatario ya está en él', r9.ok, true);
  comprobar('9. es una respuesta, no un correo nuevo', c.enviados[c.enviados.length - 1].tipo, 'respuesta');
  comprobar('9. el hilo que devuelve es el mismo', r9.hilo, 'hilo-abc');

  const r10 = llamarDoPost(c, {
    clave: clave, para: 'proveedor@correo.es', cco: 'nuevo-de-golpe@correo.es',
    asunto: 'Re: Contrato', cuerpo: 'Y también para este otro.', hilo: 'hilo-abc'
  });
  comprobar('10. con alguien nuevo de golpe, correo nuevo (no se mezcla)', r10.ok, true);
  comprobar('10. es un correo nuevo, no una respuesta', c.enviados[c.enviados.length - 1].tipo, 'nuevo');

  const r11 = llamarDoPost(c, {
    clave: clave, para: 'otro@correo.es', asunto: 'Algo suelto', cuerpo: 'x', hilo: 'hilo-que-no-existe'
  });
  comprobar('11. un hilo que no existe en este buzón no revienta nada', r11.ok, true);
  comprobar('11. sale como correo nuevo', c.enviados[c.enviados.length - 1].tipo, 'nuevo');
}

/* ============================================================
   12. getActiveUser() vacío (acceso «Cualquier usuario»), fila 117
   ============================================================ */
console.log('--- 12. getActiveUser vacío ---');
{
  const c = nuevoContexto({ correoActivo: '', miCorreo: 'secretaria@g.educaand.es' });
  vm.runInContext('prepararEnvio()', c.ctx);
  const clave = c.propiedades['clave-envio'];

  const r1 = llamarDoPost(c, { clave: clave, prueba: true });
  comprobar('12. «Probar» manda aunque getActiveUser llegue vacío', r1.ok, true);
  comprobar('12. la prueba va a la cuenta que ejecuta', c.enviados[c.enviados.length - 1].para, 'secretaria@g.educaand.es');

  const r2 = llamarDoPost(c, { clave: clave, para: '', cco: 'grupo@correo.es', asunto: 'x', cuerpo: 'x' });
  comprobar('12. solo copia oculta: se manda', r2.ok, true);
  comprobar('12. «Para» es la cuenta que ejecuta', c.enviados[c.enviados.length - 1].para, 'secretaria@g.educaand.es');
}

/* ============================================================
   13. prepararEnvio con la dirección de pruebas (/dev), fila 117
   ============================================================ */
console.log('--- 13. prepararEnvio con /dev ---');
{
  const c = nuevoContexto({ urlImplementacion: 'https://script.google.com/a/g.educaand.es/macros/s/CORTO/dev' });
  vm.runInContext('prepararEnvio()', c.ctx);
  const clave = c.propiedades['clave-envio'];
  const todo = c.logs.join(' | ');
  comprobarQue('13. no da nunca la dirección /dev', todo.indexOf('/dev') === -1, todo);
  comprobarQue('13. deja la clave en el registro', todo.indexOf(clave) !== -1, todo);
  comprobarQue('13. dice de dónde copiar la /exec', todo.indexOf('Gestionar implementaciones') !== -1 && todo.indexOf('/exec') !== -1, todo);
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
