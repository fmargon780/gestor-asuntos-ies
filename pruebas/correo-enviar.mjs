/* Prueba de js/correo-enviar.js (fila 115, 24-sep-2026,
   docs/ENVIAR-DESDE-EL-ASUNTO.md), sin navegador, con `vm` (mismo
   patrón que pruebas/formularios.mjs): `leerUrl`/`guardarUrl`/
   `tieneConexion` sobre un `localStorage` de mentira, y `enviar`/
   `probar` sobre un `fetch` de mentira (nunca una URL real).

   El bloque de Ajustes (con `document`) no se prueba aquí: como
   `document.getElementById` devuelve null, `bloqueDeAjustes()` no
   monta nada y esta prueba no lo necesita; eso lo cubre
   pruebas/envios.mjs, en navegador de verdad. */
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

const fuente = fs.readFileSync(new URL('../js/correo-enviar.js', import.meta.url), 'utf8');
const uFuente = fs.readFileSync(new URL('../js/util.js', import.meta.url), 'utf8');

function nuevoContexto() {
  const almacen = new Map();
  const peticiones = [];
  let proximaRespuesta = { status: 200, cuerpo: { ok: true } };

  const documentoFalso = {
    getElementById: () => null,
    readyState: 'complete',
    addEventListener: function () {}
  };

  const ctx = {
    console,
    document: documentoFalso,
    localStorage: {
      getItem: (k) => (almacen.has(k) ? almacen.get(k) : null),
      setItem: (k, v) => { almacen.set(k, String(v)); },
      removeItem: (k) => { almacen.delete(k); }
    },
    App: { E: {}, ir: () => {}, cambiarPestanaAjustes: () => {} },
    fetch: async (url, opciones) => {
      peticiones.push({ url: url, opciones: opciones });
      const r = proximaRespuesta;
      return {
        ok: r.status >= 200 && r.status < 300,
        status: r.status,
        text: async () => JSON.stringify(r.cuerpo)
      };
    }
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(uFuente, ctx, { filename: 'util.js' });
  vm.runInContext(fuente, ctx, { filename: 'correo-enviar.js' });
  return {
    ctx: ctx,
    peticiones: peticiones,
    responder: (r) => { proximaRespuesta = r; }
  };
}

function ejecutar(ctx, expresion) {
  return vm.runInContext('(async () => (' + expresion + '))()', ctx);
}

/* ============================================================
   1. leerUrl / guardarUrl / tieneConexion
   ============================================================ */
console.log('--- 1. la dirección, guardada en este navegador ---');
{
  const c = nuevoContexto();
  comprobar('sin nada guardado, no hay conexión', await ejecutar(c.ctx, 'window.CorreoEnviar.tieneConexion()'), false);
  await ejecutar(c.ctx, 'window.CorreoEnviar.guardarUrl("  https://script.google.com/macros/s/X/exec?k=abc  ")');
  comprobar('se recorta lo escrito de más', await ejecutar(c.ctx, 'window.CorreoEnviar.leerUrl()'),
    'https://script.google.com/macros/s/X/exec?k=abc');
  comprobar('ahora sí hay conexión', await ejecutar(c.ctx, 'window.CorreoEnviar.tieneConexion()'), true);
}

/* ============================================================
   2. enviar: manda con Content-Type: text/plain, a la URL guardada
   ============================================================ */
console.log('--- 2. enviar ---');
{
  const c = nuevoContexto();
  await ejecutar(c.ctx, 'window.CorreoEnviar.guardarUrl("https://script.google.com/macros/s/X/exec?k=abc")');
  c.responder({ status: 200, cuerpo: { ok: true, hilo: 'h1', matricula: 'm1' } });
  const r = await ejecutar(c.ctx, 'window.CorreoEnviar.enviar({ para: "ana@correo.es", asunto: "Hola", cuerpo: "Texto", hilo: "", adjuntos: [] })');
  comprobar('devuelve lo que responde la aplicación web', r, { ok: true, hilo: 'h1', matricula: 'm1' });
  comprobar('se ha hecho una sola llamada', c.peticiones.length, 1);
  comprobar('a la dirección guardada', c.peticiones[0].url, 'https://script.google.com/macros/s/X/exec?k=abc');
  comprobar('por POST', c.peticiones[0].opciones.method, 'POST');
  comprobarQue('con Content-Type: text/plain (para no disparar CORS)',
    c.peticiones[0].opciones.headers['Content-Type'].indexOf('text/plain') === 0,
    c.peticiones[0].opciones.headers['Content-Type']);
  comprobar('el cuerpo va en JSON, con lo que se le ha pasado',
    JSON.parse(c.peticiones[0].opciones.body).para, 'ana@correo.es');
}

console.log('--- 2b. enviar sin ninguna dirección conectada ---');
{
  const c = nuevoContexto();
  const r = await ejecutar(c.ctx, 'window.CorreoEnviar.enviar({ para: "ana@correo.es" })');
  comprobar('no manda nada', r.ok, false);
  comprobar('no se ha llamado a ningún fetch', c.peticiones.length, 0);
}

console.log('--- 2c. enviar cuando la aplicación web responde con un error HTTP ---');
{
  const c = nuevoContexto();
  await ejecutar(c.ctx, 'window.CorreoEnviar.guardarUrl("https://script.google.com/macros/s/X/exec?k=abc")');
  c.responder({ status: 500, cuerpo: {} });
  const r = await ejecutar(c.ctx, 'window.CorreoEnviar.enviar({ para: "ana@correo.es" })');
  comprobar('se entiende como fallo', r.ok, false);
  comprobarQue('con un motivo en castellano', r.motivo.indexOf('error') !== -1, r.motivo);
}

/* ============================================================
   3. probar: el correo de prueba, sin adjuntos ni destinatario
   ============================================================ */
console.log('--- 3. probar ---');
{
  const c = nuevoContexto();
  await ejecutar(c.ctx, 'window.CorreoEnviar.guardarUrl("https://script.google.com/macros/s/X/exec?k=abc")');
  c.responder({ status: 200, cuerpo: { ok: true } });
  await ejecutar(c.ctx, 'window.CorreoEnviar.probar()');
  const cuerpo = JSON.parse(c.peticiones[0].opciones.body);
  comprobar('la prueba lleva `prueba: true`', cuerpo.prueba, true);
  comprobarQue('sin destinatario propio (lo decide el script)', !cuerpo.para, JSON.stringify(cuerpo));
}

/* ============================================================
   4. (fila 117) direcciones que nunca funcionan: sin llamar a fetch
   ============================================================ */
console.log('--- 4. /dev y falta de ?k= ---');
{
  const c = nuevoContexto();
  await ejecutar(c.ctx, 'window.CorreoEnviar.guardarUrl("https://script.google.com/a/g.educaand.es/macros/s/CORTO/dev?k=abc")');
  const r1 = await ejecutar(c.ctx, 'window.CorreoEnviar.probar()');
  comprobar('/dev con clave: no manda', r1.ok, false);
  comprobarQue('/dev: dice que es la de pruebas', r1.motivo.indexOf('pruebas') !== -1 && r1.motivo.indexOf('/exec') !== -1, r1.motivo);

  await ejecutar(c.ctx, 'window.CorreoEnviar.guardarUrl("https://script.google.com/macros/s/CORTO/dev")');
  const r2 = await ejecutar(c.ctx, 'window.CorreoEnviar.enviar({ para: "ana@correo.es" })');
  comprobar('/dev sin clave: no manda', r2.ok, false);
  comprobarQue('/dev sin clave: también dice que es la de pruebas', r2.motivo.indexOf('pruebas') !== -1, r2.motivo);

  await ejecutar(c.ctx, 'window.CorreoEnviar.guardarUrl("https://script.google.com/macros/s/LARGO/exec")');
  const r3 = await ejecutar(c.ctx, 'window.CorreoEnviar.probar()');
  comprobar('/exec sin ?k=: no manda', r3.ok, false);
  comprobarQue('/exec sin ?k=: pide la clave', r3.motivo.indexOf('?k=') !== -1, r3.motivo);

  comprobar('en ninguno de los tres se ha llamado a fetch', c.peticiones.length, 0);
  comprobar('una /exec con ?k= no tiene problema',
    await ejecutar(c.ctx, 'window.CorreoEnviar.problemaDeDireccion("https://script.google.com/macros/s/X/exec?k=abc")'), '');
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
