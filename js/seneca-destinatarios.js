/* ============================================================
   seneca-destinatarios.js — la lista de usuarios IdEA a quien hay
   que marcar en la mensajería de Séneca (fila 47, 17-sep-2026,
   docs/DESTINATARIOS-EN-SENECA.md).

   Vive aparte de js/correo.js, como js/lo-pide.js o
   js/correo-adjuntos.js, para no engordarlo más. Solo se usa dentro
   del cuadro de Séneca (`js/correo.js` lo llama si existe); el
   cuadro de Correo no lo toca.

   Reutiliza, expuestas por js/correo.js como `window.CorreoGrupos`,
   las mismas piezas del desplegable "Añadir un grupo" (grupos
   propios y atajos de alumnado): aquí solo cambia lo que se hace al
   elegir uno, que es sacar usuarios IdEA (`IdEA.usuariosDeGrupo`) en
   vez de correos.

   El estado —qué usuarios hay y cuáles ya se han copiado con "Copiar
   el siguiente"— se guarda aquí, y se lee del propio DOM cuando hace
   falta escribirlo (mismo estilo que `cco` en js/correo.js). Se
   reinicia cada vez que se abre el cuadro (`limpiar()`, llamado desde
   `abrirCuadro` en js/correo.js).
   ============================================================ */
var SenecaDestinatarios = (function () {

  var destinatarios = [];   /* usuarios IdEA, en el orden en que se añadieron */
  var sinUsuario = [];      /* nombres de miembros de un grupo sin usuario IdEA */
  var copiados = {};        /* usuario (minúsculas) -> true, marcado por "Copiar el siguiente" */

  function limpiar() {
    destinatarios = [];
    sinUsuario = [];
    copiados = {};
  }

  /* Añade lo que trae IdEA.usuariosDeGrupo, sin repetir (comparando en
     minúsculas) lo que ya hubiera. */
  function anadir(resultado) {
    var vistos = {};
    destinatarios.forEach(function (u) { vistos[u.toLowerCase()] = true; });
    (resultado.usuarios || []).forEach(function (u) {
      var clave = u.toLowerCase();
      if (vistos[clave]) return;
      vistos[clave] = true;
      destinatarios.push(u);
    });
    (resultado.sinUsuario || []).forEach(function (n) {
      if (sinUsuario.indexOf(n) === -1) sinUsuario.push(n);
    });
  }

  function quitar(usuario) {
    destinatarios = destinatarios.filter(function (u) { return u !== usuario; });
    delete copiados[usuario.toLowerCase()];
  }

  /* El primero de la lista que no se haya copiado todavía, o null si
     ya están todos (o no hay ninguno). */
  function siguienteSinCopiar() {
    for (var i = 0; i < destinatarios.length; i++) {
      if (!copiados[destinatarios[i].toLowerCase()]) return destinatarios[i];
    }
    return null;
  }

  /* ---------- lo que se pinta ---------- */

  function contenido() {
    if (!destinatarios.length && !sinUsuario.length) return '';
    return (destinatarios.length
      ? '<label class="etiqueta">Destinatarios <span class="suave">(' + destinatarios.length + ')</span></label>' +
        '<div class="marcados-lista">' + destinatarios.map(function (u) {
          var yaCopiado = !!copiados[u.toLowerCase()];
          return '<span class="marcado-chip' + (yaCopiado ? ' marcado-chip-copiado' : '') + '"' +
            (yaCopiado ? ' title="Ya copiado"' : '') + '>@' + U.escapar(u) +
            '<button type="button" class="seneca-dest-quitar" data-usuario="' + U.escapar(u) + '" ' +
            'title="Quitarlo de la lista">×</button></span>';
        }).join('') + '</div>'
      : '') +
      (sinUsuario.length
        ? '<p class="nota aviso-en-linea">' + sinUsuario.length +
          (sinUsuario.length === 1 ? ' no tiene usuario IdEA: ' : ' no tienen usuario IdEA: ') +
          U.escapar(sinUsuario.join(', ')) + '</p>'
        : '');
  }

  /* El desplegable "Añadir un grupo" (las mismas opciones que en
     Correo, ya montadas como HTML por CorreoGrupos.opciones), la caja
     de destinatarios y los dos botones de copiar. */
  function bloqueHtml(opcionesGrupo) {
    return (opcionesGrupo
      ? '<label class="etiqueta">Añadir un grupo</label>' +
        '<select id="seneca-grupo" class="campo"><option value="">Elige…</option>' +
          opcionesGrupo + '</select>'
      : '') +
      '<div id="seneca-destinatarios">' + contenido() + '</div>' +
      /* Botones pequeños (fila 53, 18-sep-2026, docs/SENECA-CUADRO-ANCHO.md):
         desde que el cuadro va en dos columnas, estos dos caen en la
         columna izquierda, más estrecha que el cuadro entero de antes,
         junto a los destinatarios y el Asunto: boton-chico deja sitio
         a los dos en la misma línea sin envolver tan pronto. */
      '<div class="correo-botones" style="margin-top:8px">' +
        '<button type="button" class="boton boton-chico" id="seneca-copiar-lista">Copiar la lista</button>' +
        '<button type="button" class="boton boton-chico" id="seneca-copiar-siguiente">Copiar el siguiente</button>' +
      '</div>';
  }

  /* ---------- copiar ---------- */

  function copiarTexto(texto) {
    if (!texto) { if (window.U) U.aviso('Ahí no hay nada que copiar.', 'malo'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).catch(function () {
        if (window.U) U.aviso('No he podido copiarlo.', 'malo');
      });
    } else if (window.U) {
      U.aviso('Este navegador no deja copiar solo.', 'malo');
    }
  }

  /* Todos, uno por línea, con la arroba delante: lo que lee el
     ayudante de js/seneca-ayudante.js. */
  function textoDeLaLista() {
    return destinatarios.map(function (u) { return '@' + u; }).join('\n');
  }

  /* ---------- pintar y enganchar ---------- */

  function refrescar() {
    var caja = document.getElementById('seneca-destinatarios');
    if (!caja) return;
    caja.innerHTML = contenido();
    Array.prototype.forEach.call(caja.querySelectorAll('.seneca-dest-quitar'), function (b) {
      b.onclick = function () { quitar(b.dataset.usuario); refrescar(); };
    });
  }

  function enganchar() {
    var selector = document.getElementById('seneca-grupo');
    if (selector) {
      selector.onchange = async function () {
        var valor = selector.value;
        selector.value = '';
        if (!valor || !window.CorreoGrupos) return;
        var miembros;
        try { miembros = await CorreoGrupos.miembrosDeOpcion(valor); } catch (e) { miembros = []; }
        if (!miembros.length) return;
        var resueltos = await CorreoGrupos.resolverMiembros(miembros);
        var resultado = (window.IdEA && IdEA.usuariosDeGrupo(resueltos)) || { usuarios: [], sinUsuario: [] };
        anadir(resultado);
        refrescar();
      };
    }

    var botonLista = document.getElementById('seneca-copiar-lista');
    if (botonLista) {
      botonLista.onclick = function () { copiarTexto(textoDeLaLista()); };
    }

    var botonSiguiente = document.getElementById('seneca-copiar-siguiente');
    if (botonSiguiente) {
      botonSiguiente.onclick = function () {
        var u = siguienteSinCopiar();
        if (!u) {
          if (window.U) U.aviso('Ya se han copiado todos.', 'bueno');
          return;
        }
        copiarTexto('@' + u);
        copiados[u.toLowerCase()] = true;
        refrescar();
      };
    }

    refrescar();
  }

  return {
    limpiar: limpiar,
    anadir: anadir,
    quitar: quitar,
    siguienteSinCopiar: siguienteSinCopiar,
    textoDeLaLista: textoDeLaLista,
    bloqueHtml: bloqueHtml,
    enganchar: enganchar,
    /* solo para las pruebas: leer el estado sin pasar por el DOM */
    estado: function () { return { destinatarios: destinatarios.slice(), sinUsuario: sinUsuario.slice(), copiados: Object.assign({}, copiados) }; }
  };
})();
window.SenecaDestinatarios = SenecaDestinatarios;
