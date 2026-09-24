/* ============================================================
   relacionados.js — terceros relacionados con un asunto.

   Un asunto puede tener, además de su tercero principal, una lista de
   "relacionados": otras personas o entidades a las que también les
   afecta, aunque la carpeta del asunto no sea suya. Por ejemplo, un
   expediente disciplinario de un alumno donde también está implicado
   otro alumno.

   Cuando el asunto se archiva, cada relacionado se queda con una NOTA
   en su propia carpeta del archivo, diciendo dónde está el asunto de
   verdad. Esa nota es un fichero de texto que escribe la aplicación:
   NUNCA se copia ningún documento del asunto. Al reabrir el asunto,
   esa nota se borra sola; si alguien ha metido algo más dentro de esa
   carpeta-nota, no se toca, y se avisa.

   La lista de relacionados se guarda en la propia ficha del asunto,
   en asuntos.json, igual que cualquier otro dato: `ficha.relacionados`,
   una lista de { categoria, nombre }. Los asuntos de antes de esta
   función simplemente no tienen ese campo, y no hace falta migrar nada.

   Este fichero no pinta nada por su cuenta en la tarjeta de la lista:
   solo vive dentro de la ficha del asunto (js/ficha-asunto.js) y en la
   ficha de la persona (js/archivo-personas.js), a los que se engancha
   envolviendo sus funciones, como ya hace el resto de la aplicación.
   ============================================================ */
var Relacionados = (function () {

  /* Fila 133 (docs/PARTIR-FICHEROS-GRANDES.md): partido por temas, sin
     cambiar nada de lo que hace. Aquí, elegir y añadir relacionados; el
     bloque de la ficha y copiar el nombre, en js/relacionados-ficha.js;
     archivar (notas y marcadores), dónde es relacionado alguien y los
     enganches a archivar, reabrir, el ARCHIVO y la ficha de la persona,
     en js/relacionados-archivar.js. Los dos se cuelgan de `Relacionados`. */

  function $(id) { return document.getElementById(id); }

  var NOMBRE_FICHERO_MARCADOR = 'DONDE ESTA ESTE ASUNTO.txt';

  function nombreCarpetaMarcador(nombreAsunto) {
    return '(RELACIONADO) ' + nombreAsunto;
  }

  /* ==========================================================
     ELEGIR UN TERCERO

     Reutiliza el mismo buscador de "Nuevo asunto"
     (App.pintarBuscadorDeTercero, en js/asuntos-nuevo.js), montado
     dentro del cuadro de siempre (#capa). Si el usuario pide dar de
     alta uno nuevo, este cuadro se cierra primero y se abre el de
     alta (App.cuadroDeTercero) por su cuenta: nunca los dos a la vez.

     Devuelve la persona normalizada (como las que da Datos.buscar), o
     null si se cancela.
     ========================================================== */

  function elegirTercero(titulo) {
    return new Promise(function (resolver) {
      var resuelto = false;
      function resolverUnaVez(v) {
        if (resuelto) return;
        resuelto = true;
        resolver(v);
      }

      var capa = $('capa');
      $('cuadro-titulo').textContent = titulo;
      var cuerpo = $('cuadro-cuerpo');
      cuerpo.innerHTML = '<div id="rel-picker"></div>';
      $('cuadro-aceptar').classList.add('oculto');
      capa.classList.remove('oculto');

      function cerrarCapa() {
        capa.classList.add('oculto');
        $('cuadro-aceptar').classList.remove('oculto');
        $('cuadro-cancelar').onclick = null;
      }
      $('cuadro-cancelar').onclick = function () {
        cerrarCapa();
        resolverUnaVez(null);
      };

      App.pintarBuscadorDeTercero($('rel-picker'), null, async function (categoria, persona, texto) {
        if (persona) {
          cerrarCapa();
          resolverUnaVez(persona);
          return;
        }
        /* Dar de alta uno nuevo: se cierra este cuadro y se abre el de
           siempre, en secuencia, no anidado. */
        cerrarCapa();
        var def = Datos.LISTAS[categoria];
        if (!def) { resolverUnaVez(null); return; }
        var deEntrada = {};
        deEntrada[def.cabecera[0]] = texto || '';
        var tituloAlta = categoria === 'ALUMNADO'
          ? 'Dar de alta un solicitante' : 'Dar de alta en ' + categoria;
        var valores = await App.cuadroDeTercero(categoria, deEntrada, tituloAlta);
        if (!valores) { resolverUnaVez(null); return; }
        try {
          var fuente = await Datos.anadirALista(App.E.datos, categoria, valores);
          var encontrados = Datos.buscar(fuente.lista, valores[def.cabecera[0]], 1);
          resolverUnaVez(encontrados[0] || null);
        } catch (e) {
          U.aviso('No he podido darlo de alta: ' + U.mensajeDeError(e), 'malo');
          resolverUnaVez(null);
        }
      });
    });
  }

  /* ==========================================================
     AÑADIR UN RELACIONADO A LA FICHA
     ========================================================== */

  /* No deja añadir al propio tercero del asunto, y reutiliza
     U.dejaCrear (el mismo aviso de "¿es otro de verdad?" que usan los
     tipos, los estados...) para no repetir al mismo, ni con un nombre
     casi igual, dos veces. */
  async function validarYAgregar(a, categoria, nombre) {
    var categoriaPrincipal = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    var terceroPrincipal = (a.ficha && a.ficha.tercero) || '';

    if (categoria === categoriaPrincipal && terceroPrincipal &&
        U.normalizar(nombre) === U.normalizar(terceroPrincipal)) {
      U.aviso('Ese es el propio tercero del asunto: no hace falta relacionarlo consigo mismo.', 'malo');
      return false;
    }

    var actuales = ((a.ficha && a.ficha.relacionados) || []).filter(function (r) {
      return r.categoria === categoria;
    });
    var deja = await U.dejaCrear(nombre, actuales.map(function (r) { return r.nombre; }), 'relacionado');
    if (!deja) return false;

    var nueva = ((a.ficha && a.ficha.relacionados) || []).concat([{ categoria: categoria, nombre: nombre }]);
    try {
      await App.anotar(a.nombre, { relacionados: nueva });
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
      return false;
    }
    U.aviso('Relacionado añadido.', 'bueno');
    return true;
  }

  async function agregarRelacionado(a) {
    var p = await elegirTercero('Añadir un relacionado');
    if (!p) return false;
    var nombre = App.textoTercero(p);
    return validarYAgregar(a, p.categoria, nombre);
  }

  /* ==========================================================
     AÑADIR VARIOS A LA VEZ (17-sep-2026, fila 21,
     docs/GRUPOS-DE-PERSONAS.md)

     A diferencia de `validarYAgregar`, aquí no se pregunta uno a uno
     ("¿es otro de verdad?"): con veinte señalados sería veinte
     cuadros. Solo se descartan, en silencio, el propio tercero del
     asunto y los que ya estuvieran exactamente en la lista; el resto
     entra. Sin efectos: se puede probar sola. */
  function combinarRelacionados(actuales, categoriaPrincipal, terceroPrincipal, candidatos) {
    var finales = actuales.slice();
    var anadidos = 0, yaEstaban = 0, esPropio = 0;
    candidatos.forEach(function (c) {
      if (c.categoria === categoriaPrincipal && terceroPrincipal &&
          U.normalizar(c.nombre) === U.normalizar(terceroPrincipal)) { esPropio++; return; }
      var repetido = finales.some(function (r) {
        return r.categoria === c.categoria && U.normalizar(r.nombre) === U.normalizar(c.nombre);
      });
      if (repetido) { yaEstaban++; return; }
      finales.push({ categoria: c.categoria, nombre: c.nombre });
      anadidos++;
    });
    return { finales: finales, anadidos: anadidos, yaEstaban: yaEstaban, esPropio: esPropio };
  }

  /* El cuadro de "Añadir varios": el buscador en modo de señalar
     varios (App.pintarBuscadorDeTercero, opciones.multiple), con los
     atajos de alumnado y "Meter un grupo entero" encima. Devuelve la
     lista de señalados ({categoria, nombre, persona}), o null si se
     cancela. */
  function abrirAnadirRelacionados() {
    return new Promise(function (resolver) {
      var resuelto = false;
      function resolverUnaVez(v) { if (resuelto) return; resuelto = true; resolver(v); }

      var capa = $('capa');
      $('cuadro-titulo').textContent = 'Añadir varios relacionados';
      var cuerpo = $('cuadro-cuerpo');
      cuerpo.innerHTML =
        '<div id="rel-grupo-fila"></div>' +
        '<div id="rel-atajos" class="oculto"></div>' +
        '<div id="rel-picker"></div>';
      $('cuadro-aceptar').classList.add('oculto');
      capa.classList.remove('oculto');

      function cerrarCapa() {
        capa.classList.add('oculto');
        $('cuadro-aceptar').classList.remove('oculto');
        $('cuadro-cancelar').onclick = null;
      }
      $('cuadro-cancelar').onclick = function () { cerrarCapa(); resolverUnaVez(null); };

      var api = App.pintarBuscadorDeTercero($('rel-picker'), null, function (marcados) {
        cerrarCapa();
        resolverUnaVez(marcados);
      }, {
        multiple: true,
        alCambiarCategoria: function (categoria) { pintarAtajosDeAlumnado(categoria, api); }
      });

      pintarGrupoFila(api);
    });
  }

  /* Los tres atajos de alumnado: toda una unidad, todo un nivel, toda
     una enseñanza. Solo salen con la categoría ALUMNADO elegida, y
     solo con matriculados de este curso (Datos.unidadesDistintas ya
     filtra por eso). Elegir uno solo señala: no añade nada todavía. */
  async function pintarAtajosDeAlumnado(categoria, api) {
    var caja = $('rel-atajos');
    if (!caja) return;
    if (categoria !== 'ALUMNADO' || !App.E.datos) {
      caja.className = 'oculto';
      caja.innerHTML = '';
      return;
    }

    var fuente = await Datos.cargar(App.E.datos, 'ALUMNADO');
    if (!$('rel-atajos')) return;   /* el cuadro se cerró mientras se leía */
    var unidades = Datos.unidadesDistintas(fuente.lista);
    if (!unidades.length) { caja.className = 'oculto'; caja.innerHTML = ''; return; }

    var niveles = {}, ensenanzas = {};
    unidades.forEach(function (u) {
      var p = Nombres.nivelYEnsenanza(u.unidad);
      if (p.nivel) niveles[p.nivel] = true;
      if (p.ensenanza) ensenanzas[p.ensenanza] = true;
    });

    function opciones(lista) {
      return '<option value="">Elige…</option>' + lista.map(function (v) {
        return '<option value="' + U.escapar(v) + '">' + U.escapar(v) + '</option>';
      }).join('');
    }

    caja.className = 'atajos-grupo';
    caja.innerHTML =
      '<div class="atajo-fila"><span>Toda una unidad</span>' +
        '<select id="atajo-unidad" class="campo">' +
          '<option value="">Elige…</option>' +
          unidades.map(function (u) {
            return '<option value="' + U.escapar(u.unidad) + '">' + U.escapar(u.unidad) +
                   ' (' + u.cuantos + ')</option>';
          }).join('') +
        '</select></div>' +
      '<div class="atajo-fila"><span>Todo un nivel</span>' +
        '<select id="atajo-nivel" class="campo">' + opciones(Object.keys(niveles).sort()) + '</select></div>' +
      '<div class="atajo-fila"><span>Toda una enseñanza</span>' +
        '<select id="atajo-ensenanza" class="campo">' + opciones(Object.keys(ensenanzas).sort()) + '</select></div>';

    function marcarAlumnado(lista) {
      api.marcar(lista.map(function (al) {
        return { categoria: 'ALUMNADO', nombre: App.textoTercero(al), persona: al };
      }));
    }

    $('atajo-unidad').onchange = function () {
      var v = $('atajo-unidad').value;
      if (v) marcarAlumnado(filtrarPorUnidad(fuente.lista, v));
      $('atajo-unidad').value = '';
    };
    $('atajo-nivel').onchange = function () {
      var v = $('atajo-nivel').value;
      if (v) marcarAlumnado(filtrarPorNivel(fuente.lista, v));
      $('atajo-nivel').value = '';
    };
    $('atajo-ensenanza').onchange = function () {
      var v = $('atajo-ensenanza').value;
      if (v) marcarAlumnado(filtrarPorEnsenanza(fuente.lista, v));
      $('atajo-ensenanza').value = '';
    };
  }

  /* Los tres filtros de los atajos, sueltos y sin efectos: se pueden
     probar sin datos ni navegador (pruebas/grupos.mjs). Solo entra el
     alumnado matriculado este curso, aunque la unidad, el nivel o la
     enseñanza coincidan: un solicitante o un alumno de un curso
     anterior no tiene sitio en ningún atajo. */
  function filtrarPorUnidad(lista, unidad) {
    return lista.filter(function (al) { return al.matriculado && al.unidad === unidad; });
  }
  function filtrarPorNivel(lista, nivel) {
    return lista.filter(function (al) {
      return al.matriculado && Nombres.nivelYEnsenanza(al.unidad).nivel === nivel;
    });
  }
  function filtrarPorEnsenanza(lista, ensenanza) {
    return lista.filter(function (al) {
      return al.matriculado && Nombres.nivelYEnsenanza(al.unidad).ensenanza === ensenanza;
    });
  }

  /* "Meter un grupo entero": los grupos propios de Ajustes
     (js/grupos.js). Elegir uno señala a todos sus miembros; los que ya
     no estén en las listas también se señalan (por nombre), aunque el
     buscador no pueda comprobarlos: se dejan tal cual, como dice el
     punto 3 del documento. */
  function pintarGrupoFila(api) {
    var caja = $('rel-grupo-fila');
    if (!caja) return;
    var grupos = (window.Grupos && Grupos.lista()) || [];
    if (!grupos.length) { caja.innerHTML = ''; return; }

    caja.className = 'grupo-fila';
    caja.innerHTML =
      '<label class="etiqueta">Meter un grupo entero</label>' +
      '<select id="rel-grupo-elegir" class="campo">' +
        '<option value="">Elige un grupo…</option>' +
        grupos.map(function (g) {
          return '<option value="' + U.escapar(g.id) + '">' + U.escapar(g.nombre) +
                 ' (' + g.miembros.length + ')</option>';
        }).join('') +
      '</select>';

    $('rel-grupo-elegir').onchange = function () {
      var g = grupos.filter(function (x) { return x.id === $('rel-grupo-elegir').value; })[0];
      $('rel-grupo-elegir').value = '';
      if (!g) return;
      api.marcar(g.miembros.map(function (m) { return { categoria: m.categoria, nombre: m.nombre }; }));
    };
  }

  async function agregarVarios(a) {
    var marcados = await abrirAnadirRelacionados();
    if (!marcados || !marcados.length) return false;

    var categoriaPrincipal = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
    var terceroPrincipal = (a.ficha && a.ficha.tercero) || '';
    var actuales = (a.ficha && a.ficha.relacionados) || [];
    var resultado = combinarRelacionados(actuales, categoriaPrincipal, terceroPrincipal, marcados);

    if (!resultado.anadidos) {
      U.aviso('Nadie nuevo que añadir: ya estaban todos en la lista.', 'malo');
      return false;
    }

    try {
      await App.anotar(a.nombre, { relacionados: resultado.finales });
    } catch (e) {
      U.aviso('No he podido guardarlo: ' + U.mensajeDeError(e), 'malo');
      return false;
    }

    var partes = [resultado.anadidos + (resultado.anadidos === 1 ? ' añadido' : ' añadidos')];
    if (resultado.yaEstaban) partes.push(resultado.yaEstaban + ' ya estaban');
    if (resultado.esPropio) partes.push(resultado.esPropio + ' era el propio tercero');
    U.aviso(partes.join(', ') + '.', 'bueno');
    return true;
  }

  return {
    elegirTercero: elegirTercero,
    validarYAgregar: validarYAgregar,
    agregarRelacionado: agregarRelacionado,
    combinarRelacionados: combinarRelacionados,
    agregarVarios: agregarVarios,
    filtrarPorUnidad: filtrarPorUnidad,
    filtrarPorNivel: filtrarPorNivel,
    filtrarPorEnsenanza: filtrarPorEnsenanza,
    NOMBRE_FICHERO_MARCADOR: NOMBRE_FICHERO_MARCADOR,
    nombreCarpetaMarcador: nombreCarpetaMarcador
  };
})();
window.Relacionados = Relacionados;
