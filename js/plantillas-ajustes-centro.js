/* ============================================================
   plantillas-ajustes-centro.js — «Datos del centro y firma» de Ajustes → El centro: leerlos, pintarlos y guardarlos.
   (fila 560, docs/560-PARTIR-FICHEROS-GRANDES.md: sale de js/plantillas-ajustes.js sin cambiar nada de lo que se ve; el código
   es el de siempre, movido tal cual).

   Se carga ANTES que js/plantillas-ajustes.js, que lo usa por `window.PlantillasAjustesCentro`.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  var datosDeAjustes = null;   /* { firma, centro, lista } ya leído, para pintar sin esperar */

  async function cargar() {
    if (!App.E.gestor) return datosDeAjustes;
    datosDeAjustes = await Plantillas.cargar(App.E.gestor);
    return datosDeAjustes;
  }

  /* ---------- Datos del centro y firma ---------- */

  function pintarFirmaYCentro() {
    if (!datosDeAjustes || !$('plantillas-firma')) return;
    $('plantillas-firma').value = datosDeAjustes.firma;
    $('plantillas-centro').value = datosDeAjustes.centro;
    $('plantillas-localidad').value = datosDeAjustes.localidad;
    $('plantillas-direccion').value = datosDeAjustes.direccion;
    $('plantillas-codigo').value = datosDeAjustes.codigo;
    $('plantillas-cargo').value = datosDeAjustes.cargo;
    /* 20-sep-2026, fila 84: para el hueco {{PROVINCIA}} de un impreso. */
    if ($('plantillas-provincia')) $('plantillas-provincia').value = datosDeAjustes.provincia;
    /* 20-sep-2026, fila 79, apartado 4.7. */
    if ($('plantillas-direccion-normativa')) {
      $('plantillas-direccion-normativa').value = datosDeAjustes.direccionNormativa;
    }
    /* Fila 411: el nombre del remitente y la cuenta de Administración. */
    if ($('plantillas-remitente')) $('plantillas-remitente').value = datosDeAjustes.remitente;
    if ($('plantillas-cuenta-admin')) $('plantillas-cuenta-admin').value = datosDeAjustes.cuentaAdministracion;
    if (window.CorreoEnviar && CorreoEnviar.repintarCuenta) CorreoEnviar.repintarCuenta();
    if (window.HitosNormativa) HitosNormativa.refrescar();
    if (window.CentroDeDatosConfiguracion) CentroDeDatosConfiguracion.marcarCampos();   /* fila 313: lo que viene del Centro de datos no se escribe aquí */
  }

  /* Fila 87, docs/ENLACE-AL-ARTICULO-DE-NORMATIVA.md: solo el texto de
     ayuda del campo, nunca el valor guardado. Se monta desde aquí (el
     campo en sí sigue estático en index.html) para no tocar ningún
     otro fichero. */
  function ayudarConLaDireccionNormativa() {
    var campo = $('plantillas-direccion-normativa');
    if (!campo) return;
    campo.placeholder = 'https://normativa.fmargon.com';
    if ($('plantillas-direccion-normativa-ayuda')) return;
    var ayuda = document.createElement('p');
    ayuda.id = 'plantillas-direccion-normativa-ayuda';
    ayuda.className = 'nota';
    ayuda.textContent = 'Escribe solo eso, sin "/norma" ni el nombre de ningún bloque. Ojo: la ' +
      'red del instituto bloquea las direcciones "vercel.app".';
    campo.parentNode.insertBefore(ayuda, campo.nextSibling);
  }

  /* Fila 411 (docs/CORREO-DESDE-LA-CUENTA-COMUN.md): los dos campos del correo, creados desde aquí
     (como la ayuda de la dirección de normativa) para no tocar index.html. */
  function montarCamposDeCorreo() {
    if ($('plantillas-remitente')) return;
    var boton = $('plantillas-guardar-firma');
    if (!boton) return;
    var caja = document.createElement('div');
    caja.id = 'plantillas-correo-campos';
    caja.innerHTML =
      '<label class="etiqueta" for="plantillas-remitente">Nombre del remitente de los correos</label>' +
      '<input id="plantillas-remitente" class="campo" placeholder="' + U.escapar(Plantillas.POR_DEFECTO_REMITENTE) + '">' +
      '<p class="nota">Es lo que ve quien recibe un correo del Gestor, lo envíe quien lo envíe.</p>' +
      '<label class="etiqueta" for="plantillas-cuenta-admin">Cuenta de correo de Administración</label>' +
      '<input id="plantillas-cuenta-admin" class="campo" placeholder="' + U.escapar(Plantillas.POR_DEFECTO_CUENTA_ADMIN) + '">' +
      '<p class="nota">La cuenta común desde la que el Gestor recoge y envía. Si un ordenador trabaja con otra, Ajustes avisa.</p>';
    boton.parentNode.insertBefore(caja, boton);
  }

  async function guardarFirma() {
    var firma = $('plantillas-firma').value;
    var centro = $('plantillas-centro').value.trim() || Plantillas.POR_DEFECTO_CENTRO;
    var localidad = $('plantillas-localidad').value.trim();
    var direccion = $('plantillas-direccion').value.trim();
    var codigo = $('plantillas-codigo').value.trim();
    var cargo = $('plantillas-cargo').value.trim();
    var remitente = $('plantillas-remitente') ? ($('plantillas-remitente').value.trim() || Plantillas.POR_DEFECTO_REMITENTE) : datosDeAjustes.remitente;
    var cuentaAdministracion = $('plantillas-cuenta-admin') ? ($('plantillas-cuenta-admin').value.trim() || Plantillas.POR_DEFECTO_CUENTA_ADMIN) : datosDeAjustes.cuentaAdministracion;
    var provincia = $('plantillas-provincia') ? $('plantillas-provincia').value.trim() : datosDeAjustes.provincia;
    var direccionNormativa = $('plantillas-direccion-normativa')
      ? $('plantillas-direccion-normativa').value.trim().replace(/\/$/, '')
      : datosDeAjustes.direccionNormativa;
    try {
      datosDeAjustes = await Plantillas.guardar(App.E.gestor, function (actual) {
        actual.firma = firma;
        actual.centro = centro;
        actual.localidad = localidad;
        actual.direccion = direccion;
        actual.codigo = codigo;
        actual.cargo = cargo;
        actual.remitente = remitente;
        actual.cuentaAdministracion = cuentaAdministracion;
        actual.provincia = provincia;
        actual.direccionNormativa = direccionNormativa;
        return actual;
      });
      if (window.HitosNormativa) HitosNormativa.refrescar();
      if (window.CorreoEnviar && CorreoEnviar.repintarCuenta) CorreoEnviar.repintarCuenta();
      U.aviso('Firma y centro guardados.', 'bueno');
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
    }
  }

  if ($('plantillas-guardar-firma')) $('plantillas-guardar-firma').onclick = guardarFirma;

  window.PlantillasAjustesCentro = {
    cargar: cargar,
    datos: function () { return datosDeAjustes; },
    pintarFirmaYCentro: pintarFirmaYCentro,
    ayudarConLaDireccionNormativa: ayudarConLaDireccionNormativa,
    montarCamposDeCorreo: montarCamposDeCorreo
  };

})();
