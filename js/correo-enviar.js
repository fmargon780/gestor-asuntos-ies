/* ============================================================
   correo-enviar.js — enviar el correo desde el asunto, con sus
   documentos (24-sep-2026, fila 115, docs/ENVIAR-DESDE-EL-ASUNTO.md).

   Sustituye al "borrador con documentos" de la fila 16-sep-2026
   (docs/ADJUNTAR-DOCUMENTOS-AL-CORREO.md): aquella carpeta
   intermedia y la revisión cada minuto no eran de fiar (los encargos
   se quedaban sin recoger, comprobado el 24-sep-2026). Ahora la
   aplicación llama DIRECTAMENTE a una aplicación web publicada desde
   el mismo proyecto de Apps Script (apps-script/gestor-correos.gs,
   `doPost`), que manda el correo de verdad en el momento.

   La dirección de esa aplicación web (con la clave dentro, como
   `?k=`) se guarda EN ESTE NAVEGADOR (localStorage), nunca en
   `_GESTOR`: cada persona envía desde su propia cuenta de Google,
   igual que ya hace js/copiar-ruta.js con la ruta de las carpetas.
   **Esto cambia una regla de siempre**: desde esta fila, la
   aplicación SÍ envía correo, pero solo tras "Confirmar y enviar" con
   el resumen delante (js/correo-cuadro.js).

   Este fichero solo habla con la aplicación web y con el bloque de
   Ajustes → Mantenimiento. Quien arma el correo (destinatarios,
   asunto, cuerpo, adjuntos en base64) es js/correo-cuadro.js, con
   ayuda de js/correo-adjuntos.js para leer y pesar los documentos.

   Va después de js/bandeja-correos.js en index.html (mismo bloque de
   Ajustes → Mantenimiento) y antes de js/correo-cuadro.js (que lo usa).
   ============================================================ */
window.CorreoEnviar = (function () {

  var CLAVE_LOCAL = 'gestor-envio-correo';

  function leerUrl() {
    try { return (window.localStorage.getItem(CLAVE_LOCAL) || '').trim(); } catch (e) { return ''; }
  }

  function guardarUrl(valor) {
    try { window.localStorage.setItem(CLAVE_LOCAL, String(valor || '').trim()); } catch (e) { /* sin memoria: nada */ }
  }

  function tieneConexion() { return !!leerUrl(); }

  /* Fila 117 (docs/ENVIO-CUENTA-DEL-SCRIPT.md): dos direcciones que
     nunca pueden funcionar, y se dicen sin llamar a Google. La /dev es
     la de pruebas del editor (solo vale con la sesión del dueño
     abierta); sin `?k=` el script rechaza siempre la llamada. */
  function problemaDeDireccion(url) {
    url = String(url || '').trim();
    if (!url) return '';
    var ruta = url.split('?')[0].split('#')[0].replace(/\/+$/, '');
    if (/\/dev$/.test(ruta)) {
      return 'Esa es la dirección de pruebas. Copia la de Implementar → Gestionar implementaciones, que termina en /exec.';
    }
    if (!/[?&]k=[^&]+/.test(url)) {
      return 'A la dirección le falta la clave: añade al final ?k= y la clave que da prepararEnvio.';
    }
    return '';
  }

  /* Manda el JSON con Content-Type: text/plain a propósito: así el
     navegador lo trata como una petición "simple" y no hace la
     consulta previa CORS, que Apps Script no sabe contestar. */
  /* Fila 130 (docs/GUARDAR-Y-ENVIAR-SIN-SORPRESAS.md): tiempo límite de
     la petición. Si vence, no se sabe si Google ha llegado a enviarlo. */
  var LIMITE_MS = 90 * 1000;
  var NO_SE_SI_HA_SALIDO = 'No sé si ha salido. Mira en Enviados de Gmail antes de volver a pulsar.';

  /* El identificador de un envío: uno por cuadro de confirmación (se
     reutiliza si se vuelve a pulsar en el MISMO cuadro). Con él, el
     script no manda dos veces el mismo correo. */
  function nuevoIdEnvio() {
    var trozo = function () { return Math.random().toString(36).slice(2, 12); };
    return 'env-' + Date.now().toString(36) + '-' + trozo() + trozo() + trozo();
  }

  async function llamar(cuerpo, limiteMs) {
    var url = leerUrl();
    if (!url) return { ok: false, motivo: 'No hay ninguna dirección de envío conectada.' };
    var problema = problemaDeDireccion(url);
    if (problema) return { ok: false, motivo: problema };
    var respuesta;
    var corte = (typeof AbortController === 'function') ? new AbortController() : null;
    var reloj = corte ? setTimeout(function () { corte.abort(); }, limiteMs || LIMITE_MS) : null;
    try {
      respuesta = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(cuerpo),
        signal: corte ? corte.signal : undefined
      });
    } catch (e) {
      if (reloj) clearTimeout(reloj);
      if (e && e.name === 'AbortError') return { ok: false, sinSaber: true, motivo: NO_SE_SI_HA_SALIDO };
      return { ok: false, motivo: 'No he podido contactar con Google: ' + (window.U ? U.mensajeDeError(e) : e.message) };
    }
    if (reloj) clearTimeout(reloj);
    var texto = '';
    try { texto = await respuesta.text(); } catch (e) { /* sin cuerpo */ }
    var datos = null;
    try { datos = texto ? JSON.parse(texto) : null; } catch (e) { datos = null; }
    if (!respuesta.ok) {
      return { ok: false, motivo: (datos && datos.motivo) || ('Google ha respondido con un error (' + respuesta.status + ').') };
    }
    if (!datos) return { ok: false, motivo: 'La respuesta no se ha entendido.' };
    return datos;
  }

  function enviar(datos, limiteMs) { return llamar(datos, limiteMs); }

  function probar() {
    return llamar({
      prueba: true,
      asunto: 'Prueba de conexión — Gestor de Asuntos',
      cuerpo: 'Si ves este correo, el envío desde el Gestor de Asuntos está conectado.'
    });
  }

  /* ---------- el bloque de Ajustes → Mantenimiento ---------- */

  function bloqueDeAjustes() {
    var ya = document.getElementById('bloque-envio-correo');
    if (ya) return ya;
    var pantalla = document.getElementById('ajustes-tab-mantenimiento');
    if (!pantalla) return null;
    var d = document.createElement('details');
    d.className = 'bloque-ajustes';
    d.id = 'bloque-envio-correo';
    d.innerHTML =
      '<summary>' +
        '<span class="bloque-titulo">Enviar correo</span>' +
        '<span class="bloque-pie" id="envio-correo-resumen"></span>' +
      '</summary>' +
      '<div class="bloque-cuerpo">' +
        '<p class="explica">Para que el botón "Enviar" del cuadro de Correo mande el mensaje de ' +
        'verdad, conecta tu propia cuenta de Google, una vez. Se guarda solo en este navegador: ' +
        'cada uno conecta la suya.</p>' +
        '<ol>' +
          '<li>Abre <a href="https://script.google.com" target="_blank" rel="noopener">script.google.com</a> ' +
          'con tu cuenta del centro y entra en el proyecto «Gestor - Correos».</li>' +
          '<li>Copia el código nuevo desde ' +
          '<a href="https://github.com/fmargon780/gestor-asuntos-ies/blob/main/apps-script/gestor-correos.gs" ' +
          'target="_blank" rel="noopener">GitHub</a> y pégalo en lugar del viejo. Guarda.</li>' +
          '<li>Arriba a la derecha: «Implementar» → «Nueva implementación». Tipo: «Aplicación web». ' +
          'Ejecutar como: «Yo». Quién tiene acceso: «Cualquier usuario». Pulsa «Implementar» y ' +
          'acepta los permisos.</li>' +
          '<li>Copia la URL de «Implementar» → «Gestionar implementaciones» (termina en ' +
          '<code>/exec</code>). Después elige <code>prepararEnvio</code> en el desplegable de arriba ' +
          'y pulsa «Ejecutar»: solo sirve para sacar la clave, que sale abajo, en el registro de ' +
          'ejecución.</li>' +
          '<li>Pega aquí abajo la URL con la clave al final, así: <code>URL?k=clave</code>, y pulsa ' +
          '«Probar».</li>' +
        '</ol>' +
        '<p class="nota">Si en el paso 3 no aparece «Cualquier usuario», la cuenta del centro no deja ' +
        'publicar así y el envío no puede funcionar; díselo a Claude.</p>' +
        '<p class="nota">Cada vez que pegues código nuevo en el script: «Implementar» → «Gestionar ' +
        'implementaciones» → lápiz → Versión: «Nueva versión» → «Implementar». Así se conserva la ' +
        'misma dirección y no hay que volver a pegarla aquí.</p>' +
        '<label class="etiqueta">Dirección de la aplicación web</label>' +
        '<input id="envio-correo-url" class="campo" placeholder="https://script.google.com/macros/s/.../exec?k=...">' +
        '<div class="alta-tipo" style="margin-top:8px">' +
          '<button type="button" class="boton" id="envio-correo-guardar">Guardar</button>' +
          '<button type="button" class="boton" id="envio-correo-probar">Probar</button>' +
        '</div>' +
        '<div id="envio-correo-aviso"></div>' +
      '</div>';
    pantalla.appendChild(d);
    return d;
  }

  function pintarResumenBloque() {
    var r = document.getElementById('envio-correo-resumen');
    if (r) r.textContent = tieneConexion() ? 'Conectado' : 'Sin conectar';
    var campo = document.getElementById('envio-correo-url');
    if (campo && document.activeElement !== campo) campo.value = leerUrl();
  }

  function pintarBloqueAjustes() {
    if (!bloqueDeAjustes()) return;
    pintarResumenBloque();
    var guardar = document.getElementById('envio-correo-guardar');
    var probarBtn = document.getElementById('envio-correo-probar');
    var aviso = document.getElementById('envio-correo-aviso');
    var campo = document.getElementById('envio-correo-url');
    if (!guardar || !probarBtn || !campo) return;

    function avisarProblema() {
      var problema = problemaDeDireccion(campo.value);
      if (problema && aviso) {
        aviso.innerHTML = '<p class="aviso aviso-rojo">' + U.escapar(problema) + '</p>';
      }
      return !!problema;
    }

    guardar.onclick = function () {
      if (aviso) aviso.innerHTML = '';
      if (avisarProblema()) return;
      guardarUrl(campo.value);
      pintarResumenBloque();
      U.aviso('Dirección guardada en este navegador.', 'bueno');
    };

    probarBtn.onclick = async function () {
      if (aviso) aviso.innerHTML = '';
      if (avisarProblema()) return;
      guardarUrl(campo.value);
      pintarResumenBloque();
      await U.mientrasGuarda(probarBtn, async function () {
        var r = await probar();
        if (r && r.ok) {
          U.aviso('Correo de prueba enviado. Revisa tu bandeja de entrada.', 'bueno');
        } else if (aviso) {
          aviso.innerHTML = '<p class="aviso aviso-rojo">' +
            U.escapar((r && r.motivo) || 'No he podido enviarlo.') + '</p>';
        }
      });
    };
  }

  /* Cierra el cuadro que hubiera abierto (el botón "Enviar" sin
     conexión lo llama antes) y lleva a Ajustes → Mantenimiento, con el
     bloque ya abierto. */
  function irAAjustes() {
    var cerrar = document.getElementById('cuadro-aceptar');
    if (cerrar) cerrar.click();
    App.ir('ajustes');
    if (typeof App.cambiarPestanaAjustes === 'function') App.cambiarPestanaAjustes('mantenimiento');
    setTimeout(function () {
      var b = bloqueDeAjustes();
      if (b) {
        b.open = true;
        if (b.scrollIntoView) b.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  }

  /* Se engancha por el mismo punto que usan los demás bloques sueltos
     de Ajustes (js/bandeja-correos.js, js/unir-asuntos.js):
     window.Gestor.alRefrescar, para no envolver nada. A diferencia de
     la bandeja, aquí no hay ninguna carpeta que vigilar: se puede
     repintar el bloque cada vez sin coste, así que no hace falta un
     `arrancado` que lo ejecute solo una vez. */
  var enganchado = false;
  function enganchar() {
    if (enganchado || !window.Gestor) return;
    enganchado = true;
    window.Gestor.alRefrescar.push(pintarBloqueAjustes);
  }
  enganchar();
  if (!enganchado) document.addEventListener('DOMContentLoaded', enganchar);

  return {
    tieneConexion: tieneConexion,
    leerUrl: leerUrl,
    guardarUrl: guardarUrl,
    problemaDeDireccion: problemaDeDireccion,
    enviar: enviar,
    nuevoIdEnvio: nuevoIdEnvio, NO_SE_SI_HA_SALIDO: NO_SE_SI_HA_SALIDO,
    probar: probar,
    irAAjustes: irAAjustes
  };
})();
