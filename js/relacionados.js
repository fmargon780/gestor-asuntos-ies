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
          U.aviso('No he podido darlo de alta: ' + e.message, 'malo');
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
      U.aviso('No he podido guardarlo: ' + e.message, 'malo');
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
      U.aviso('No he podido guardarlo: ' + e.message, 'malo');
      return false;
    }

    var partes = [resultado.anadidos + (resultado.anadidos === 1 ? ' añadido' : ' añadidos')];
    if (resultado.yaEstaban) partes.push(resultado.yaEstaban + ' ya estaban');
    if (resultado.esPropio) partes.push(resultado.esPropio + ' era el propio tercero');
    U.aviso(partes.join(', ') + '.', 'bueno');
    return true;
  }

  /* ==========================================================
     COPIAR EL NOMBRE EN ORDEN NORMAL

     Hasta que existan las plantillas, Francisco escribe los documentos
     a mano y necesita el nombre tal como se escribe, no como se
     guarda. De alumnado y personal se guarda «Apellidos, Nombre
     <código>»: aquí se quita el código pegado al final (el Nº de
     identificación escolar, o las cuatro cifras del documento del
     personal — siempre en mayúsculas, nunca como lleva un nombre de
     pila) y se da la vuelta a los apellidos y el nombre. En empresas
     no hay nada que dar la vuelta: se copia la razón social tal cual.
     ========================================================== */

  function nombreEnOrdenNormal(r) {
    var texto = String((r && r.nombre) || '').trim();
    if (!texto || r.categoria === 'EMPRESAS' || r.categoria === 'OTROS') return texto;

    var coma = texto.indexOf(',');
    if (coma === -1) return texto;
    var apellidos = texto.slice(0, coma).trim();
    var palabras = texto.slice(coma + 1).trim().split(/\s+/);
    var ultima = palabras[palabras.length - 1] || '';
    if (palabras.length > 1 && /^[0-9A-Z]{4,}$/.test(ultima)) palabras.pop();

    return (palabras.join(' ') + ' ' + apellidos).trim();
  }

  function copiarAlPortapapeles(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(texto).then(function () { return true; })
        .catch(function () { return copiarALaAntigua(texto); });
    }
    return Promise.resolve(copiarALaAntigua(texto));
  }

  function copiarALaAntigua(texto) {
    try {
      var c = document.createElement('textarea');
      c.value = texto;
      c.setAttribute('readonly', '');
      c.style.cssText = 'position:fixed;top:-1000px;left:-1000px';
      document.body.appendChild(c);
      c.select();
      var ok = document.execCommand('copy');
      c.parentNode.removeChild(c);
      return ok;
    } catch (e) { return false; }
  }

  function copiarNombreDelRelacionado(r, boton) {
    var texto = nombreEnOrdenNormal(r);
    if (!texto) return;
    copiarAlPortapapeles(texto).then(function (ok) {
      if (!ok) { U.aviso('No he podido copiarlo. Es ' + texto + '.', 'malo'); return; }
      var antes = boton.textContent;
      boton.textContent = 'Copiado';
      boton.classList.add('boton-marcado');
      setTimeout(function () {
        boton.textContent = antes;
        boton.classList.remove('boton-marcado');
      }, 1400);
    });
  }

  /* ==========================================================
     PINTAR EL BLOQUE DE LA FICHA
     ========================================================== */

  function pintarEnFicha(caja, a, abierto, alCambiar) {
    var lista = (a.ficha && a.ficha.relacionados) || [];

    /* "2 personas" / "nadie todavía" (18-sep-2026, fila 51): el
       resumen del plegable, se sepa desde el primer momento (la
       cuenta ya está en `a.ficha`, sin esperar a nada). */
    if (window.FichaPlegables) {
      var n = lista.length;
      FichaPlegables.ponResumen(caja, n ? n + (n === 1 ? ' persona' : ' personas') : 'nadie todavía', !n);
    }

    var filas = lista.map(function (r, i) {
      return '<div class="relacionado-fila">' +
               '<span class="marca-tipo">' + U.escapar(r.categoria) + '</span>' +
               '<span>' + U.escapar(r.nombre) + '</span>' +
               '<button type="button" class="boton rel-copiar" data-i="' + i + '" ' +
                 'title="Copiar el nombre en orden normal, para pegarlo en un documento">Copiar</button>' +
               (abierto
                 ? '<button type="button" class="boton rel-quitar" data-i="' + i + '">Quitar</button>'
                 : '') +
             '</div>';
    }).join('');

    caja.innerHTML =
      (lista.length ? filas : '<p class="explica">Nadie relacionado con este asunto todavía.</p>') +
      (abierto
        ? '<div style="display:flex;gap:8px;margin-top:8px">' +
            '<button type="button" class="boton" id="rel-anadir">+ Añadir relacionado</button>' +
            '<button type="button" class="boton" id="rel-anadir-varios">+ Añadir varios</button>' +
          '</div>'
        : (lista.length
            ? '<p class="nota">El asunto está archivado: la lista ya no se puede cambiar.</p>'
            : ''));

    Array.prototype.forEach.call(caja.querySelectorAll('.rel-copiar'), function (b) {
      b.onclick = function () {
        var i = parseInt(b.dataset.i, 10);
        if (lista[i]) copiarNombreDelRelacionado(lista[i], b);
      };
    });

    if (!abierto) return;

    var btnAnadir = caja.querySelector('#rel-anadir');
    if (btnAnadir) {
      btnAnadir.onclick = async function () {
        var cambiado = await agregarRelacionado(a);
        if (cambiado && alCambiar) alCambiar();
      };
    }

    var btnAnadirVarios = caja.querySelector('#rel-anadir-varios');
    if (btnAnadirVarios) {
      btnAnadirVarios.onclick = async function () {
        var cambiado = await agregarVarios(a);
        if (cambiado && alCambiar) alCambiar();
      };
    }

    Array.prototype.forEach.call(caja.querySelectorAll('.rel-quitar'), function (b) {
      b.onclick = async function () {
        var i = parseInt(b.dataset.i, 10);
        var nueva = lista.slice();
        nueva.splice(i, 1);
        try {
          await App.anotar(a.nombre, { relacionados: nueva });
          if (alCambiar) alCambiar();
        } catch (e) {
          U.aviso('No he podido quitarlo: ' + e.message, 'malo');
        }
      };
    });
  }

  /* ==========================================================
     ARCHIVAR: confirmar y dejar las notas
     ========================================================== */

  /* Antes de archivar, si el asunto tiene relacionados, se pregunta a
     cuáles de ellos se les deja la nota (todos marcados por defecto).
     Devuelve la lista de los marcados, [] si no hay relacionados, o
     null si el usuario ha cancelado. */
  async function confirmarRelacionadosAlArchivar(a) {
    var lista = (a.ficha && a.ficha.relacionados) || [];
    if (!lista.length) return [];

    var filas = lista.map(function (r, i) {
      return '<label class="rel-fila-confirmar">' +
               '<input type="checkbox" class="rel-marcar" data-i="' + i + '" checked> ' +
               U.escapar(r.categoria) + ' · ' + U.escapar(r.nombre) +
             '</label>';
    }).join('');

    var ok = await U.preguntar('Avisar a los relacionados',
      '<p class="explica">Este asunto tiene ' + lista.length +
      (lista.length === 1 ? ' relacionado' : ' relacionados') + '. Al archivar, se deja una nota ' +
      'en su propia carpeta del archivo diciendo dónde está el asunto de verdad. ' +
      'No se copia ningún documento suyo.</p>' +
      '<div class="rel-confirmar-lista">' + filas + '</div>',
      'Archivar el asunto');
    if (!ok) return null;

    var marcados = [];
    Array.prototype.forEach.call(document.querySelectorAll('.rel-marcar'), function (c) {
      if (c.checked) marcados.push(lista[parseInt(c.dataset.i, 10)]);
    });
    return marcados;
  }

  function textoMarcador(nombreAsunto, categoriaPrincipal, terceroPrincipal) {
    var ruta = App.E.archivo.name + ' / ' + categoriaPrincipal + ' / ' + terceroPrincipal + ' / ' + nombreAsunto;
    return 'Este asunto está relacionado con esta persona o entidad, pero el asunto de verdad\n' +
           'no está guardado aquí.\n\n' +
           'DÓNDE ESTÁ EL ASUNTO DE VERDAD:\n' +
           ruta + '\n\n' +
           'Esta carpeta es solo una nota: aquí no hay ningún documento del asunto.\n' +
           'Si el asunto se reabre, esta nota se borra sola.';
  }

  async function crearMarcadores(a, categoriaPrincipal, terceroPrincipal, lista) {
    if (!lista || !lista.length) return;
    var nombreCarpeta = nombreCarpetaMarcador(a.nombre);
    var texto = textoMarcador(a.nombre, categoriaPrincipal, terceroPrincipal);
    for (var i = 0; i < lista.length; i++) {
      var rel = lista[i];
      try {
        var destino = await Carpetas.bajar(App.E.archivo, [rel.categoria, rel.nombre], true);
        var marcador = await destino.getDirectoryHandle(nombreCarpeta, { create: true });
        await Carpetas.escribirTexto(marcador, NOMBRE_FICHERO_MARCADOR, texto);
      } catch (e) {
        U.aviso('No he podido dejar la nota en la carpeta de ' + rel.nombre + ': ' + e.message, 'malo');
      }
    }
  }

  /* ==========================================================
     REABRIR: quitar las notas

     Si la carpeta-nota tiene algo más dentro además del propio
     fichero de la nota, no se borra: alguien ha metido algo ahí a
     mano, y no es cosa de la aplicación decidir qué hacer con ello.
     ========================================================== */

  async function borrarUnMarcador(nombreAsunto, rel) {
    var nombreCarpeta = nombreCarpetaMarcador(nombreAsunto);
    var terDir;
    try {
      var catDir = await App.E.archivo.getDirectoryHandle(rel.categoria);
      terDir = await catDir.getDirectoryHandle(rel.nombre);
    } catch (e) {
      return;   /* esa persona no tiene ni carpeta en el archivo: nada que borrar */
    }
    var marcador;
    try {
      marcador = await terDir.getDirectoryHandle(nombreCarpeta);
    } catch (e) {
      return;   /* ya no hay nota, o nunca la hubo */
    }

    var ficherosDentro = await Carpetas.ficheros(marcador);
    var subcarpetasDentro = await Carpetas.subcarpetas(marcador);
    var soloLaNota = ficherosDentro.length === 1 &&
                      ficherosDentro[0].nombre === NOMBRE_FICHERO_MARCADOR &&
                      !subcarpetasDentro.length;

    if (soloLaNota) {
      await terDir.removeEntry(nombreCarpeta, { recursive: true });
    } else {
      U.aviso('La nota de ' + rel.nombre + ' tiene algo más dentro, así que no la he borrado. ' +
              'Revísala a mano en ' + rel.categoria + ' / ' + rel.nombre + ' / ' + nombreCarpeta + '.', 'malo');
    }
  }

  async function borrarMarcadores(a, lista) {
    if (!lista || !lista.length) return;
    for (var i = 0; i < lista.length; i++) {
      await borrarUnMarcador(a.nombre, lista[i]);
    }
  }

  /* ==========================================================
     "RELACIONADO CON": lo que se ve en la ficha de la persona
     ========================================================== */

  /* Todos los asuntos (abiertos o archivados) que tengan a esta
     persona como relacionada. Se mira directamente en
     App.E.registro.asuntos, que ya está en memoria: no hace falta
     leer nada del disco. */
  function asuntosDondeEsRelacionado(categoria, nombre) {
    var buscado = U.normalizar(nombre);
    var salida = [];
    Object.keys(App.E.registro.asuntos).forEach(function (clave) {
      var ficha = App.E.registro.asuntos[clave] || {};
      var lista = ficha.relacionados || [];
      var esta = lista.some(function (r) {
        return r.categoria === categoria && U.normalizar(r.nombre) === buscado;
      });
      if (esta) salida.push({ nombre: clave, ficha: ficha });
    });
    salida.sort(function (x, y) { return x.nombre < y.nombre ? -1 : 1; });
    return salida;
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
    pintarEnFicha: pintarEnFicha,
    confirmarRelacionadosAlArchivar: confirmarRelacionadosAlArchivar,
    textoMarcador: textoMarcador,
    crearMarcadores: crearMarcadores,
    borrarMarcadores: borrarMarcadores,
    asuntosDondeEsRelacionado: asuntosDondeEsRelacionado,
    NOMBRE_FICHERO_MARCADOR: NOMBRE_FICHERO_MARCADOR,
    nombreCarpetaMarcador: nombreCarpetaMarcador
  };
})();
window.Relacionados = Relacionados;

/* ---------- engancharse a archivar y a reabrir ----------

   Se envuelven las funciones de siempre (js/documentos-sueltos.js), en
   vez de tocarlas: así, si el asunto no tiene relacionados, todo sigue
   exactamente igual que antes. */

(function () {
  var comoEra = App.cerrarAsunto;
  App.cerrarAsunto = async function (a) {
    var relacionados = (a.ficha && a.ficha.relacionados) || [];
    var marcarEstos = [];
    if (relacionados.length) {
      marcarEstos = await Relacionados.confirmarRelacionadosAlArchivar(a);
      if (marcarEstos === null) return;   /* cancelado */
    }
    await comoEra(a);
    var ficha = App.E.registro.asuntos[a.nombre] || {};
    if (ficha.estado === 'cerrado' && marcarEstos.length) {
      await Relacionados.crearMarcadores(a, ficha.categoria, ficha.tercero, marcarEstos);
    }
  };
})();

(function () {
  var comoEra = App.reabrirAsunto;
  App.reabrirAsunto = async function (a) {
    var relacionados = (a.ficha && a.ficha.relacionados) || [];
    await comoEra(a);
    var ficha = App.E.registro.asuntos[a.nombre] || {};
    if (ficha.estado === 'abierto' && relacionados.length) {
      await Relacionados.borrarMarcadores(a, relacionados);
    }
  };
})();

/* ---------- que las notas no se vean como si fueran asuntos ----------

   Las carpetas-nota viven al mismo nivel que los asuntos de verdad
   (ARCHIVO / categoría / tercero / carpeta), así que sin este filtro
   App.verArchivo y "Otros asuntos de este tercero" las confundirían
   con asuntos archivados. Se reconocen por su nombre: siempre empieza
   por "(RELACIONADO) ". */

function esNotaDeRelacionado(nombre) {
  return String(nombre || '').indexOf('(RELACIONADO) ') === 0;
}

(function () {
  var comoEra = App.verArchivo;
  App.verArchivo = async function () {
    await comoEra();
    App.E.listaArchivo = App.E.listaArchivo.filter(function (a) {
      return !esNotaDeRelacionado(a.nombre);
    });
    App.pintarArchivo();
  };
})();

(function () {
  if (!window.Duplicados) return;
  var comoEra = window.Duplicados.delTercero;
  window.Duplicados.delTercero = async function (categoria, tercero) {
    var salida = await comoEra(categoria, tercero);
    salida.archivados = (salida.archivados || []).filter(function (n) {
      return !esNotaDeRelacionado(n);
    });
    return salida;
  };
})();

/* ---------- engancharse a la ficha de la persona ---------- */

(function () {
  function $(id) { return document.getElementById(id); }
  var comoEra = App.verFicha;
  App.verFicha = function (p) {
    comoEra(p);
    var caja = $('ficha-persona');
    if (!caja) return;
    var nombre = App.textoTercero(p);
    var asuntos = Relacionados.asuntosDondeEsRelacionado(p.categoria, nombre);
    if (!asuntos.length) return;

    var bloque = document.createElement('div');
    bloque.className = 'ficha-relacionado-de';
    bloque.innerHTML = '<p class="nota"><strong>' +
      (asuntos.length === 1 ? 'Relacionado con este asunto:' : 'Relacionado con estos asuntos:') +
      '</strong></p>' +
      asuntos.map(function (x) {
        return '<div class="resultado">' + U.escapar(x.nombre) +
               '<div class="resultado-pie">' +
               (x.ficha.estado === 'cerrado' ? 'Archivado' : 'Abierto') +
               '</div></div>';
      }).join('');
    caja.appendChild(bloque);
  };
})();
