/* ============================================================
   relacionados-archivar.js — archivar con relacionados (notas y marcadores), dónde es relacionado alguien, y los enganches a archivar, reabrir, el ARCHIVO y la ficha de la persona.

   Sacado tal cual de js/relacionados.js en la fila 133
   (docs/PARTIR-FICHEROS-GRANDES.md), sin cambiar nada de lo que hace.
   Se carga justo detrás de js/relacionados.js.
   ============================================================ */
(function () {
  if (typeof Relacionados === 'undefined') return;

  function $(id) { return document.getElementById(id); }

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
    var nombreCarpeta = Relacionados.nombreCarpetaMarcador(a.nombre);
    var texto = textoMarcador(a.nombre, categoriaPrincipal, terceroPrincipal);
    for (var i = 0; i < lista.length; i++) {
      var rel = lista[i];
      try {
        var destino = await Carpetas.bajar(App.E.archivo, [rel.categoria, rel.nombre], true);
        var marcador = await destino.getDirectoryHandle(nombreCarpeta, { create: true });
        await Carpetas.escribirTexto(marcador, Relacionados.NOMBRE_FICHERO_MARCADOR, texto);
      } catch (e) {
        U.aviso('No he podido dejar la nota en la carpeta de ' + rel.nombre + ': ' + U.mensajeDeError(e), 'malo');
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
    var nombreCarpeta = Relacionados.nombreCarpetaMarcador(nombreAsunto);
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
                      ficherosDentro[0].nombre === Relacionados.NOMBRE_FICHERO_MARCADOR &&
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

  /* Todos los asuntos, abiertos o archivados, que tengan a esta
     persona como relacionada. Los abiertos se miran directamente en
     App.E.registro.asuntos, que ya está en memoria; los archivados,
     desde la fila 64 (docs/FICHA-DEL-ARCHIVO-EN-SU-CARPETA.md), ya no
     tienen ficha ahí, así que se buscan en el índice del ARCHIVO
     (js/archivo-indice.js), que guarda sus relacionados desde esa
     misma fila. Sin índice hecho, se enseñan solo los abiertos: no es
     peor que antes de la fila 64 para quien no lo tenga construido. */
  async function asuntosDondeEsRelacionado(categoria, nombre) {
    var buscado = U.normalizar(nombre);
    var salida = [];
    var esDeEsta = function (r) { return r && r.categoria === categoria && U.normalizar(r.nombre) === buscado; };

    Object.keys(App.E.registro.asuntos).forEach(function (clave) {
      var ficha = App.E.registro.asuntos[clave] || {};
      if ((ficha.relacionados || []).some(esDeEsta)) {
        salida.push({ nombre: clave, archivado: false });
      }
    });

    if (window.IndiceArchivo) {
      try {
        var resultado = await IndiceArchivo.leerDisco();
        if (resultado.ok) {
          resultado.datos.asuntos.forEach(function (e) {
            if ((e.relacionados || []).some(esDeEsta)) salida.push({ nombre: e.nombre, archivado: true });
          });
        }
      } catch (e) { /* sin índice usable, se queda con los abiertos */ }
    }

    salida.sort(function (x, y) { return x.nombre < y.nombre ? -1 : 1; });
    return salida;
  }

  Object.assign(Relacionados, {
    confirmarRelacionadosAlArchivar: confirmarRelacionadosAlArchivar,
    textoMarcador: textoMarcador,
    crearMarcadores: crearMarcadores,
    borrarMarcadores: borrarMarcadores,
    asuntosDondeEsRelacionado: asuntosDondeEsRelacionado
  });
})();

/* ---------- engancharse a archivar y a reabrir ----------

   Se envuelven las funciones de siempre (js/documentos-sueltos.js), en
   vez de tocarlas: así, si el asunto no tiene relacionados, todo sigue
   exactamente igual que antes. */

U.envolver(App, 'App.cerrarAsunto', 'relacionados-archivar.js', function (comoEra) {
  return async function (a) {
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
});

U.envolver(App, 'App.reabrirAsunto', 'relacionados-archivar.js', function (comoEra) {
  return async function (a) {
    var relacionados = (a.ficha && a.ficha.relacionados) || [];
    await comoEra(a);
    var ficha = App.E.registro.asuntos[a.nombre] || {};
    if (ficha.estado === 'abierto' && relacionados.length) {
      await Relacionados.borrarMarcadores(a, relacionados);
    }
  };
});

/* ---------- que las notas no se vean como si fueran asuntos ----------

   Las carpetas-nota viven al mismo nivel que los asuntos de verdad
   (ARCHIVO / categoría / tercero / carpeta), así que sin este filtro
   App.verArchivo y "Otros asuntos de este tercero" las confundirían
   con asuntos archivados. Se reconocen por su nombre: siempre empieza
   por "(RELACIONADO) ". */

function esNotaDeRelacionado(nombre) {
  return String(nombre || '').indexOf('(RELACIONADO) ') === 0;
}

U.envolver(App, 'App.verArchivo', 'relacionados-archivar.js', function (comoEra) {
  return async function () {
    await comoEra();
    App.E.listaArchivo = App.E.listaArchivo.filter(function (a) {
      return !esNotaDeRelacionado(a.nombre);
    });
    App.pintarArchivo();
  };
});

U.envolver(window.Duplicados, 'window.Duplicados.delTercero', 'relacionados-archivar.js', function (comoEra) {
  return async function (categoria, tercero) {
    var salida = await comoEra(categoria, tercero);
    salida.archivados = (salida.archivados || []).filter(function (n) {
      return !esNotaDeRelacionado(n);
    });
    return salida;
  };
});

/* ---------- engancharse a la ficha de la persona ---------- */

(function () {
  function $(id) { return document.getElementById(id); }
  U.envolver(App, 'App.verFicha', 'relacionados-archivar.js', function (comoEra) {
    return function (p) {
    comoEra(p);
    var caja = $('ficha-persona');
    if (!caja) return;
    var nombre = App.textoTercero(p);
    /* asuntosDondeEsRelacionado es async desde la fila 64 (mira
       también el índice del ARCHIVO): se pinta cuando responda, si la
       pantalla de la persona sigue en pie (isConnected). Si mientras
       tanto se ha abierto otra persona, esto ya no es perfecto (el
       bloque podría llegar tarde y colgarse de la ficha nueva), pero
       es solo un texto de consulta, nada que se guarde ni se pueda
       estropear: el mismo riesgo que ya asume el nombre del tercero en
       js/ficha-nombre-acciones.js. */
    Relacionados.asuntosDondeEsRelacionado(p.categoria, nombre).then(function (asuntos) {
      if (!asuntos.length || !caja.isConnected) return;

      var bloque = document.createElement('div');
      bloque.className = 'ficha-relacionado-de';
      bloque.innerHTML = '<p class="nota"><strong>' +
        (asuntos.length === 1 ? 'Relacionado con este asunto:' : 'Relacionado con estos asuntos:') +
        '</strong></p>' +
        asuntos.map(function (x) {
          return '<div class="resultado">' + U.escapar(x.nombre) +
                 '<div class="resultado-pie">' + (x.archivado ? 'Archivado' : 'Abierto') +
                 '</div></div>';
        }).join('');
      caja.appendChild(bloque);
    });
    };
  });
})();
