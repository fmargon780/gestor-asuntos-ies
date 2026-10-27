/* ============================================================
   correo-version.js — la versión del script de Gmail, preguntada sin
   enviar nada (fila 471, docs/AVISO-SCRIPT-CORREO-FIABLE.md).

   Antes la app solo se enteraba de qué versión tenía el script cuando
   contestaba a un envío o a «Probar»: si el script se actualizaba y no se
   enviaba nada desde ese navegador, «El envío de correo está anticuado»
   seguía saliendo sin ser verdad. Ahora, al abrirse (y al entrar en
   Ajustes → Mantenimiento, como mucho una vez por minuto), la app hace un
   GET a la dirección guardada: el `doGet` del script contesta su versión
   y no envía nada.

   Un fallo de red, el tiempo agotado, una respuesta que no es JSON (un
   script viejo, sin `doGet`) o una clave mala no dicen nada de la
   versión: no se toca lo guardado, y nunca se cambia la dirección.

   También aquí, los dos botones de la tarjeta (copiar el enlace del
   código, abrir los proyectos de Google). En la demostración, el script
   de mentira tiene puesta una versión vieja salvo que
   localStorage `gestor-demo-script-al-dia` valga '1'.
   ============================================================ */
window.CorreoVersion = (function () {

  var ENLACE_CODIGO = 'https://github.com/fmargon780/gestor-asuntos-ies/blob/main/apps-script/gestor-correos.gs';
  var ENLACE_PROYECTOS = 'https://script.google.com/home';
  var VERSION_VIEJA_DEMO = '20-sep-2026 · fila 180';
  var CLAVE_DEMO_AL_DIA = 'gestor-demo-script-al-dia';
  var LIMITE_MS = 15000;
  var CADA_MS = 60 * 1000;

  var ultima = 0;
  var preguntando = false;

  function enDemo() { return !!(window.Demo && Demo.activo && Demo.activo()); }

  /* La lista de proyectos de script.google.com, con la cuenta de Administración si se conoce. */
  function enlaceDeProyectos() {
    var cuenta = (window.CorreoEnviar && CorreoEnviar.cuentaDeAdministracion && CorreoEnviar.cuentaDeAdministracion()) || '';
    return cuenta ? ENLACE_PROYECTOS + '?authuser=' + encodeURIComponent(cuenta) : ENLACE_PROYECTOS;
  }

  function copiarEnlaceDelCodigo() {
    return U.copiar(ENLACE_CODIGO, null, { avisoFallo: 'No he podido copiarlo. Cópialo de los pasos de abajo.' }).then(function (ok) {
      if (ok) U.aviso('Enlace copiado. Pégalo en el Chrome de tu cuenta personal.', 'bueno');
      return ok;
    });
  }

  function abrirProyectos() { window.open(enlaceDeProyectos(), '_blank', 'noopener'); }

  /* ¿Qué versión dice el script? Devuelve { version, cuenta } o null si no dice nada. */
  function consultar(datos) {
    if (!datos || typeof datos !== 'object' || datos.ok !== true || !Object.prototype.hasOwnProperty.call(datos, 'version')) return null;
    return { version: datos.version, cuenta: datos.cuenta };
  }

  function aplicar(dicho) {
    if (dicho && window.CorreoEnviar) CorreoEnviar.registrarVersionScript(dicho.version, dicho.cuenta);
    return dicho;
  }

  /* Demostración: el script de mentira contesta tras un momento, como el real. */
  function preguntarEnDemo() {
    return new Promise(function (r) {
      setTimeout(function () {
        var alDia = false;
        try { alDia = window.localStorage.getItem(CLAVE_DEMO_AL_DIA) === '1'; } catch (e) { /* sin memoria: versión vieja */ }
        r(aplicar({
          version: alDia ? CorreoEnviar.SCRIPT_ESPERADO : VERSION_VIEJA_DEMO,
          cuenta: CorreoEnviar.cuentaDeAdministracion()
        }));
      }, 300);
    });
  }

  async function preguntarAlScript(url) {
    var corte = (typeof AbortController === 'function') ? new AbortController() : null;
    var reloj = corte ? setTimeout(function () { corte.abort(); }, LIMITE_MS) : null;
    try {
      var respuesta = await fetch(url, { method: 'GET', signal: corte ? corte.signal : undefined });
      if (!respuesta.ok) return null;
      var datos = null;
      try { datos = JSON.parse(await respuesta.text()); } catch (e) { datos = null; }
      return aplicar(consultar(datos));
    } catch (e) {
      return null;   /* red, tiempo agotado: no dice nada de la versión */
    } finally {
      if (reloj) clearTimeout(reloj);
    }
  }

  /* Pregunta la versión sin enviar nada. `aLaFuerza` se salta el minuto de espera. */
  async function preguntar(aLaFuerza) {
    if (!window.CorreoEnviar || preguntando) return null;
    if (!aLaFuerza && ultima && Date.now() - ultima < CADA_MS) return null;
    var url = CorreoEnviar.leerUrl();
    if (!enDemo() && (!url || CorreoEnviar.problemaDeDireccion(url))) return null;
    preguntando = true;
    ultima = Date.now();
    try { return enDemo() ? await preguntarEnDemo() : await preguntarAlScript(url); }
    finally { preguntando = false; }
  }

  /* Al abrir la app, una vez por carga (la demostración la lanza ella misma tras montar sus datos). */
  function alCargar() { if (!enDemo()) preguntar(true); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', alCargar);
  else setTimeout(alCargar, 0);

  return {
    ENLACE_CODIGO: ENLACE_CODIGO, preguntar: preguntar, enlaceDeProyectos: enlaceDeProyectos,
    copiarEnlaceDelCodigo: copiarEnlaceDelCodigo, abrirProyectos: abrirProyectos,
    /* solo para las pruebas */
    _consultar: consultar, _aplicar: aplicar
  };
})();
