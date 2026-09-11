/* ============================================================
   registro.js — dar registro de entrada o salida a un documento
   que ya está en la carpeta del asunto, sin nombrarlo dos veces.

   Antes había que salir de la ficha, añadir la copia sellada como
   si fuera otro documento y volver a escribir la fecha, el tipo y
   el texto adicional, ahora con el número de registro. Los dos
   ficheros hay que conservarlos (el original y el sellado), así
   que lo único que sobraba era nombrar dos veces.

   Aquí solo se pide el número de registro: el resto del nombre
   (fecha, tipo, texto adicional) se lee del documento original con
   Documentos.leerNombre, y el nombre se monta con Nombres.montarDocumento,
   igual que hace el cuadro de nombrar documentos. La copia se guarda
   con Carpetas.copiarFicheroEn, y el original no se toca.

   Se usa desde dos sitios, y cada uno pinta el formulario a su
   manera porque solo hay un cuadro de diálogo en toda la aplicación
   (U.preguntar, #capa):

     - "Gestionar documentos" (js/documentos.js) ya tiene ese cuadro
       abierto: aquí se pinta DENTRO, con sus propios botones
       (pintarEnContenedor).
     - La ficha del asunto (js/ficha-asunto.js) no tiene ningún
       cuadro abierto: aquí se abre uno nuevo (abrirCuadro).
   ============================================================ */
var Registro = (function () {

  function $(id) { return document.getElementById(id); }

  /* ¿Este nombre de documento ya lleva las cuatro piezas del
     registro? Se apoya en lo que ya sabe leer documentos.js. */
  function tieneRegistro(nombre) {
    return !!(Documentos.leerNombre(nombre).registro);
  }

  /* ¿Este documento está marcado como pendiente de registro en la
     ficha del asunto? */
  function pendiente(asunto, nombre) {
    var lista = (asunto && asunto.ficha && asunto.ficha.pendientesRegistro) || [];
    return lista.indexOf(nombre) !== -1;
  }

  function botonOpcion(grupo, valor, texto, marcado) {
    return '<label class="opcion"><input type="radio" name="' + grupo + '" value="' + valor + '"' +
           (marcado ? ' checked' : '') + '><span>' + texto + '</span></label>';
  }

  function elegido(grupo) {
    var m = document.querySelector('input[name="' + grupo + '"]:checked');
    return m ? m.value : '';
  }

  /* El documento que se está registrando ahora mismo. Solo hace
     falta uno a la vez: nunca hay dos formularios de registro
     abiertos al mismo tiempo. */
  var estado = null;

  function camposHtml() {
    var hoy = U.hoyIso();
    return (
      '<p class="explica">Se guardará una copia del fichero elegido junto al original, ' +
        'con el mismo nombre más el registro.<br>' +
        '<span class="suave">Original: ' + U.escapar(estado.nombreOriginal) + '</span></p>' +
      '<div class="registro-campos">' +
        '<div>' +
          '<label class="etiqueta">Año</label>' +
          '<input id="reg-ano" class="campo" maxlength="2" value="' + U.escapar(hoy.slice(2, 4)) + '">' +
        '</div>' +
        '<div>' +
          '<label class="etiqueta">Entrada o salida</label>' +
          '<div class="opciones">' +
            botonOpcion('reg-sentido', 'E', 'Entrada', true) +
            botonOpcion('reg-sentido', 'S', 'Salida', false) +
          '</div>' +
        '</div>' +
        '<div>' +
          '<label class="etiqueta">Serie</label>' +
          '<div class="opciones">' +
            botonOpcion('reg-modo', 'M', 'Manual', true) +
            botonOpcion('reg-modo', 'A', 'Automático', false) +
          '</div>' +
        '</div>' +
        '<div>' +
          '<label class="etiqueta">Número</label>' +
          '<input id="reg-numero" class="campo" maxlength="6" inputmode="numeric">' +
        '</div>' +
      '</div>' +
      '<div class="vista-previa">' +
        '<div class="vista-rotulo">Se guardará así</div>' +
        '<div id="reg-vista" class="vista-nombre"></div>' +
      '</div>'
    );
  }

  function nombrePropuesto() {
    var codigo = Nombres.codigoRegistro({
      ano: $('reg-ano').value.trim(),
      sentido: elegido('reg-sentido'),
      modo: elegido('reg-modo'),
      numero: $('reg-numero').value.trim()
    });
    if (!codigo) return '';
    return Nombres.montarDocumento({
      fecha: estado.previo.fecha, codigo: codigo, tipo: estado.previo.tipo,
      curso: estado.previo.curso, extension: estado.extension
    });
  }

  function refrescarVista() {
    if (!$('reg-vista') || !estado) return;
    $('reg-vista').textContent = nombrePropuesto() || '(falta el número)';
  }

  function enganchar() {
    Array.prototype.forEach.call(
      document.querySelectorAll('#reg-ano, #reg-numero, input[name="reg-sentido"], input[name="reg-modo"]'),
      function (c) { c.oninput = refrescarVista; c.onchange = refrescarVista; }
    );
    refrescarVista();
    if ($('reg-numero')) $('reg-numero').focus();
  }

  /* ---------- preparado para leer el número solo, más adelante ----------

     Cuando se compruebe con un PDF sellado real de Séneca si el número
     va como texto dentro del PDF, un módulo nuevo lo leerá y llamará
     aquí para rellenar los cuatro campos sin que haya que escribirlos.
     Hoy nadie la llama todavía: no hay un PDF de muestra con el que
     comprobarlo. */
  function proponer(datos) {
    datos = datos || {};
    if (datos.anio != null && $('reg-ano')) $('reg-ano').value = datos.anio;
    if (datos.tipo) {
      var sentido = document.querySelector('input[name="reg-sentido"][value="' + datos.tipo + '"]');
      if (sentido) sentido.checked = true;
    }
    if (datos.serie) {
      var modo = document.querySelector('input[name="reg-modo"][value="' + datos.serie + '"]');
      if (modo) modo.checked = true;
    }
    if (datos.numero != null && $('reg-numero')) $('reg-numero').value = datos.numero;
    refrescarVista();
  }

  /* ---------- elegir la copia sellada, y comprobar que se puede ---------- */

  async function prepararEstado(nombreDocumento) {
    var previo = Documentos.leerNombre(nombreDocumento);
    if (!previo.fecha || !previo.tipo) {
      U.aviso('Este documento no tiene fecha ni tipo reconocibles en su nombre: no sé qué ' +
              'ponerle a la copia registrada.', 'malo');
      return false;
    }
    var handle;
    try {
      handle = await Carpetas.elegirFichero();
    } catch (e) {
      if (e.name !== 'AbortError') U.aviso('No he podido abrir ese fichero: ' + e.message, 'malo');
      return false;
    }
    estado = {
      nombreOriginal: nombreDocumento, handle: handle,
      previo: previo, extension: Nombres.extensionDe(handle.name)
    };
    return true;
  }

  /* ---------- guardar ----------

     Reutiliza lo que ya existe: Carpetas.copiarFicheroEn ya sabe
     guardar una copia con el nombre montado, y Notas.anadir ya sabe
     apuntar en el asunto releyendo antes el fichero compartido. */
  async function quitarDePendientes(asunto, nombreDocumento) {
    var lista = (asunto.ficha && asunto.ficha.pendientesRegistro) || [];
    if (lista.indexOf(nombreDocumento) === -1) return;
    var restantes = lista.filter(function (n) { return n !== nombreDocumento; });
    await App.anotar(asunto.nombre, { pendientesRegistro: restantes });
  }

  /* Devuelve el nombre nuevo si ha ido bien, o false si no se ha
     guardado (número vacío, nombre repetido, o un fallo del disco). */
  async function guardar(asunto) {
    var nombreNuevo = nombrePropuesto();
    if (!nombreNuevo) { U.aviso('Escribe un número de registro.', 'malo'); return false; }
    try {
      var yaEsta = await Carpetas.ficheros(asunto.handle);
      if (yaEsta.some(function (f) { return f.nombre === nombreNuevo; })) {
        U.aviso('Ya hay un documento con ese nombre en la carpeta.', 'malo');
        return false;
      }
      await Carpetas.copiarFicheroEn(asunto.handle, estado.handle, nombreNuevo);
      var codigo = (nombreNuevo.match(/^\d{6}\s+(\S+)/) || [])[1] || '';
      await quitarDePendientes(asunto, estado.nombreOriginal);
      await window.Notas.anadir(asunto, 'Registrado ' + codigo + ' · ' + estado.nombreOriginal);
      U.aviso('Documento registrado.', 'bueno');
      return nombreNuevo;
    } catch (e) {
      U.aviso('No he podido registrarlo: ' + e.message, 'malo');
      return false;
    }
  }

  /* ---------- para cuando ya hay un cuadro abierto ----------

     Se pinta dentro del mismo #doc-cuerpo que ya está usando
     "Gestionar documentos", con sus propios botones Volver y
     Registrar: no se abre un segundo U.preguntar, porque solo hay
     un cuadro de diálogo en toda la aplicación. */
  async function pintarEnContenedor(caja, asunto, nombreDocumento, alTerminar) {
    if (!(await prepararEstado(nombreDocumento))) return;

    caja.innerHTML = camposHtml() +
      '<div class="cuadro-botones">' +
        '<button type="button" class="boton" id="reg-volver">Volver</button>' +
        '<button type="button" class="boton boton-principal" id="reg-guardar">Registrar</button>' +
      '</div>';
    enganchar();

    $('reg-volver').onclick = function () { estado = null; if (alTerminar) alTerminar(); };
    $('reg-guardar').onclick = async function () {
      $('reg-guardar').disabled = true;
      var bien = await guardar(asunto);
      $('reg-guardar').disabled = false;
      if (bien) { estado = null; if (alTerminar) alTerminar(); }
    };
  }

  /* ---------- para cuando no hay ningún cuadro abierto ----------

     La ficha del asunto enseña sus documentos en la propia pantalla,
     sin ningún cuadro por delante, así que aquí sí se abre uno. */
  async function abrirCuadro(asunto, nombreDocumento, alTerminar) {
    if (!(await prepararEstado(nombreDocumento))) return;

    var promesa = U.preguntar('Registrar "' + nombreDocumento + '"', camposHtml(), 'Registrar');
    enganchar();
    var ok = await promesa;
    if (!ok) { estado = null; return; }
    var bien = await guardar(asunto);
    estado = null;
    if (bien && alTerminar) alTerminar();
  }

  return {
    tieneRegistro: tieneRegistro,
    pendiente: pendiente,
    proponer: proponer,
    pintarEnContenedor: pintarEnContenedor,
    abrirCuadro: abrirCuadro
  };
})();
