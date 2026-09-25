/* ============================================================
   administraciones-ficha.js — lo que se ve de las Administraciones
   (25-sep-2026, fila 167, docs/ADMINISTRACIONES-COMO-TERCERO.md).

   - El alta a mano (Nuevo asunto y Personas y empresas), con su cuadro
     propio: organismo o centro educativo.
   - La ficha en Personas y empresas: datos, «Antes: …», el árbol de
     departamentos (añadir, cambiar y quitar, sin límite de niveles),
     «Cambiar los datos» y cambiar el nombre de «Depende de».
   - La lista agrupada (organismos por «Depende de», y centros).
   - El desplegable opcional «Departamento» al crear y al editar un
     asunto de esta categoría (se guarda `departamento: {id, nombre}` en
     la ficha; no va en el nombre de la carpeta).

   Todo por puntos previstos: `App.ALTAS_DE_CATEGORIA`,
   `App.FICHAS_DE_CATEGORIA`, `App.LISTAS_DE_CATEGORIA` (js/asuntos-nuevo-
   alta.js, js/archivo-personas.js) y `App.alFijarTercero`
   (js/asuntos-nuevo-campos.js). Sin envolturas. Carga después de
   js/administraciones.js y de js/archivo-personas.js.
   ============================================================ */
var AdministracionesFicha = (function () {

  var A = window.Administraciones;
  var CAT = 'ADMINISTRACIONES';

  function $(id) { return document.getElementById(id); }
  function esc(v) { return U.escapar(v); }

  function campo(etiqueta, id, valor, ayuda) {
    return '<label class="etiqueta">' + esc(etiqueta) + (ayuda ? ' <span class="suave">(' + esc(ayuda) + ')</span>' : '') +
      '</label><input id="' + id + '" class="campo" value="' + esc(valor || '') + '">';
  }

  function listaSuperiores() {
    return '<datalist id="adm-superiores">' + A.enMemoria().superiores.map(function (s) {
      return '<option value="' + esc(s.nombre) + '">';
    }).join('') + '</datalist>';
  }

  /* ---------- el cuadro de datos (alta y cambio) ---------- */

  async function cuadroDeDatos(titulo, valores, deAlta) {
    try { await A.leer(App.E.datos); } catch (e) { /* se sigue con lo que haya */ }
    var v = valores || {};
    var centro = v.clase === 'centro';
    var claseHtml = deAlta
      ? '<div class="adm-clase"><label><input type="radio" name="adm-clase" value="organismo"' + (centro ? '' : ' checked') +
        '> Organismo</label> <label><input type="radio" name="adm-clase" value="centro"' + (centro ? ' checked' : '') +
        '> Centro educativo</label></div>'
      : '<p class="explica">' + (centro ? 'Centro educativo' : 'Organismo') + '</p>';
    var promesa = U.preguntar(titulo,
      claseHtml +
      '<p class="explica">El nombre corto es el de la carpeta: que sea estable. Ni el DIR3 ni la Consejería ' +
      'van en él (cambian con cada legislatura).</p>' +
      campo('Nombre corto', 'adm-corto', v.corto, 'p. ej. Delegación Educación Málaga') +
      '<div id="adm-solo-centro">' + campo('Código de centro', 'adm-codigo', v.codigoCentro, '8 cifras, va en la carpeta') + '</div>' +
      campo('Nombre oficial', 'adm-oficial', v.oficial) +
      '<div id="adm-solo-organismo">' + campo('DIR3', 'adm-dir3', v.dir3, 'opcional') + '</div>' +
      '<label class="etiqueta">Depende de <span class="suave">(opcional: la Consejería u órgano superior)</span></label>' +
      '<input id="adm-superior" class="campo" list="adm-superiores" value="' + esc(v.superior || '') + '">' + listaSuperiores() +
      campo('Correo', 'adm-correo', v.correo) + campo('Teléfono', 'adm-telefono', v.telefono) +
      campo('Dirección', 'adm-direccion', v.direccion), deAlta ? 'Dar de alta' : 'Guardar');
    function verClase() {
      var marcado = document.querySelector('input[name="adm-clase"]:checked');
      var esCentro = marcado ? marcado.value === 'centro' : centro;
      $('adm-solo-centro').classList.toggle('oculto', !esCentro);
      $('adm-solo-organismo').classList.toggle('oculto', esCentro);
      return esCentro;
    }
    Array.prototype.forEach.call(document.querySelectorAll('input[name="adm-clase"]'), function (r) { r.onchange = verClase; });
    verClase();
    var ok = await promesa;
    if (!ok) return null;
    var esCentro = verClase();
    return {
      clase: esCentro ? 'centro' : 'organismo', corto: $('adm-corto').value.trim(),
      codigoCentro: esCentro ? $('adm-codigo').value.trim() : '', oficial: $('adm-oficial').value.trim(),
      dir3: esCentro ? '' : $('adm-dir3').value.trim(), superior: $('adm-superior').value.trim(),
      correo: $('adm-correo').value.trim(), telefono: $('adm-telefono').value.trim(),
      direccion: $('adm-direccion').value.trim()
    };
  }

  async function darDeAlta(sugerencia) {
    var datos = await cuadroDeDatos('Dar de alta un organismo o un centro', { corto: sugerencia || '' }, true);
    if (!datos) return null;
    try {
      var o = await A.alta(App.E.datos, datos);
      Datos.olvidar(CAT);
      return A.persona(o, A.enMemoria());
    } catch (e) {
      U.fallo('No he podido darlo de alta', e);
      return null;
    }
  }

  /* ---------- la ficha en Personas y empresas ---------- */

  function fila(titulo, valorHtml) {
    return '<div class="ficha-dato"><span>' + esc(titulo) + '</span><span>' + valorHtml + '</span></div>';
  }

  function arbolHtml(lista) {
    if (!lista || !lista.length) return '';
    return '<ul class="adm-arbol">' + lista.map(function (dep) {
      var datos = [dep.contacto, dep.correo, dep.telefono, dep.dir3 ? 'DIR3 ' + dep.dir3 : ''].filter(Boolean).join('  ·  ');
      return '<li><div class="adm-dep" data-dep="' + esc(dep.id) + '"><strong>' + esc(dep.nombre) + '</strong>' +
        (datos ? ' <span class="suave">' + esc(datos) + '</span>' : '') +
        ' <button type="button" class="enlace" data-dep-anadir="' + esc(dep.id) + '" title="Añadir un subdepartamento">+ dentro</button>' +
        ' <button type="button" class="enlace" data-dep-cambiar="' + esc(dep.id) + '">Cambiar</button>' +
        ' <button type="button" class="enlace" data-dep-quitar="' + esc(dep.id) + '">Quitar</button></div>' +
        arbolHtml(dep.hijos) + '</li>';
    }).join('') + '</ul>';
  }

  function htmlFicha(p) {
    var d = A.enMemoria();
    var o = A.organismoPorId(d, p.idOrganismo);
    if (!o) return '<p class="explica">Ya no está en la lista.</p>';
    var s = A.superiorPorId(d, o.superior);
    var html = fila(o.clase === 'centro' ? 'Centro educativo' : 'Organismo', esc(A.tercero(o)) + ' <span class="suave">(nombre de la carpeta)</span>');
    if (o.oficial) html += fila('Nombre oficial', esc(o.oficial));
    if (o.clase === 'centro') html += fila('Código de centro', esc(o.codigoCentro));
    else if (o.dir3) html += fila('DIR3', esc(o.dir3));
    if (s) {
      html += fila('Depende de', esc(s.nombre) +
        ' <button type="button" class="enlace" id="adm-cambiar-superior">Cambiarle el nombre</button>');
    }
    if (o.correo) html += fila('Correo', esc(o.correo));
    if (o.telefono) html += fila('Teléfono', esc(o.telefono));
    if (o.direccion) html += fila('Dirección', esc(o.direccion));
    var antes = (o.antes || []).concat(s ? s.antes || [] : []);
    if (antes.length) {
      html += fila('Antes', antes.map(function (x) {
        return esc(x.nombre) + (x.hasta ? ' <span class="suave">(hasta el ' + esc(U.fechaLegible(U.aAaMmDd(x.hasta))) + ')</span>' : '');
      }).join('<br>'));
    }
    html += '<div class="adm-departamentos"><div class="personas-bloque-titulo">Departamentos</div>' +
      (arbolHtml(o.departamentos) || '<p class="explica">Todavía ninguno.</p>') +
      '<p><button type="button" class="boton" id="adm-dep-nuevo">+ Departamento</button> ' +
      '<button type="button" class="boton" id="adm-cambiar-datos">Cambiar los datos</button></p></div>';
    return html;
  }

  async function volverAPintar(idOrganismo) {
    Datos.olvidar(CAT);
    if (App.pintarPersonas) await App.pintarPersonas();
    var fuente = await Datos.cargar(App.E.datos, CAT);
    var p = fuente.lista.filter(function (x) { return x.idOrganismo === idOrganismo; })[0];
    if (p) App.verFicha(p);
  }

  async function cuadroDepartamento(titulo, dep) {
    var v = dep || {};
    var ok = await U.preguntar(titulo,
      campo('Nombre', 'adm-dep-nombre', v.nombre) + campo('Persona de contacto', 'adm-dep-contacto', v.contacto) +
      campo('Correo', 'adm-dep-correo', v.correo) + campo('Teléfono', 'adm-dep-telefono', v.telefono) +
      campo('DIR3', 'adm-dep-dir3', v.dir3, 'opcional'), 'Guardar');
    if (!ok) return null;
    return { nombre: $('adm-dep-nombre').value.trim(), contacto: $('adm-dep-contacto').value.trim(),
             correo: $('adm-dep-correo').value.trim(), telefono: $('adm-dep-telefono').value.trim(),
             dir3: $('adm-dep-dir3').value.trim() };
  }

  async function hacer(accion, idOrganismo, textoFallo) {
    try { await accion(); }
    catch (e) { U.fallo(textoFallo, e); return; }
    await volverAPintar(idOrganismo);
  }

  /* Cambiar el nombre corto renombra las carpetas de sus asuntos
     abiertos (por AsuntoRenombrar, como «Cambiar los datos» de un
     tercero dado de alta a mano). Las archivadas no se tocan. */
  async function renombrarAbiertos(antes, despues) {
    if (!antes || !despues || antes === despues || !App.E.abiertos) return 0;
    var afectados = (App.E.listaAbiertos || []).filter(function (a) {
      return (a.ficha && a.ficha.tercero === antes) || a.nombre.slice(-(antes.length + 1)) === ' ' + antes;
    });
    var hechos = 0;
    for (var i = 0; i < afectados.length; i++) {
      var viejo = afectados[i].nombre;
      if (viejo.slice(-antes.length) !== antes) continue;
      var nuevo = viejo.slice(0, viejo.length - antes.length) + despues;
      try {
        if (await Carpetas.existe(App.E.abiertos, nuevo)) continue;
        await Carpetas.renombrar(App.E.abiertos, viejo, nuevo);
        await AsuntoRenombrar.mover(viejo, nuevo, { tercero: despues });
        hechos++;
      } catch (e) { /* uno que falle no frena a los demás */ }
    }
    return hechos;
  }

  function engancharFicha(caja, p) {
    var id = p.idOrganismo;
    var d = A.enMemoria();
    var o = A.organismoPorId(d, id);
    if (!o) return;
    var b;
    if ((b = caja.querySelector('#adm-dep-nuevo'))) b.onclick = async function () {
      var datos = await cuadroDepartamento('Departamento nuevo en ' + o.corto);
      if (datos) await hacer(function () { return A.anadirDepartamento(App.E.datos, id, null, datos); }, id, 'No he podido añadirlo');
    };
    Array.prototype.forEach.call(caja.querySelectorAll('[data-dep-anadir]'), function (x) {
      x.onclick = async function () {
        var padre = A.departamentoPorId(o, x.dataset.depAnadir);
        var datos = await cuadroDepartamento('Dentro de ' + (padre ? padre.nombre : ''));
        if (datos) await hacer(function () { return A.anadirDepartamento(App.E.datos, id, x.dataset.depAnadir, datos); }, id, 'No he podido añadirlo');
      };
    });
    Array.prototype.forEach.call(caja.querySelectorAll('[data-dep-cambiar]'), function (x) {
      x.onclick = async function () {
        var dep = A.departamentoPorId(o, x.dataset.depCambiar);
        var datos = await cuadroDepartamento('Cambiar ' + (dep ? dep.nombre : ''), dep);
        if (datos) await hacer(function () { return A.cambiarDepartamento(App.E.datos, id, x.dataset.depCambiar, datos); }, id, 'No he podido cambiarlo');
      };
    });
    Array.prototype.forEach.call(caja.querySelectorAll('[data-dep-quitar]'), function (x) {
      x.onclick = async function () {
        var dep = A.departamentoPorId(o, x.dataset.depQuitar);
        var ok = await U.preguntar('Quitar ' + (dep ? dep.nombre : ''), '<p>Se quita del árbol, con lo que tenga dentro. ' +
          'Los asuntos que ya lo tenían elegido lo siguen enseñando.</p>', 'Quitar');
        if (ok) await hacer(function () { return A.quitarDepartamento(App.E.datos, id, x.dataset.depQuitar); }, id, 'No he podido quitarlo');
      };
    });
    if ((b = caja.querySelector('#adm-cambiar-superior'))) b.onclick = async function () {
      var s = A.superiorPorId(A.enMemoria(), o.superior);
      if (!s) return;
      var ok = await U.preguntar('Cambiar el nombre de «' + s.nombre + '»',
        '<p class="explica">Cambia en todos los organismos que dependen de él. El nombre de ahora se guarda en «Antes». ' +
        'Ninguna carpeta cambia.</p>' + campo('Nombre nuevo', 'adm-sup-nombre', s.nombre), 'Guardar');
      if (!ok) return;
      var nombre = $('adm-sup-nombre').value.trim();
      await hacer(function () { return A.renombrarSuperior(App.E.datos, s.id, nombre); }, id, 'No he podido cambiarlo');
    };
    if ((b = caja.querySelector('#adm-cambiar-datos'))) b.onclick = async function () {
      var s = A.superiorPorId(A.enMemoria(), o.superior);
      var datos = await cuadroDeDatos('Cambiar los datos de ' + o.corto, Object.assign({}, o, { superior: s ? s.nombre : '' }), false);
      if (!datos) return;
      var r;
      try { r = await A.cambiarDatos(App.E.datos, id, datos); }
      catch (e) { U.fallo('No he podido guardar el cambio', e); return; }
      if (r.terceroAntes !== r.terceroDespues) {
        var n = await renombrarAbiertos(r.terceroAntes, r.terceroDespues);
        U.aviso('Guardado.' + (n ? ' ' + n + ' carpeta' + (n === 1 ? '' : 's') + ' de asuntos abiertos renombrada' + (n === 1 ? '' : 's') + '.' : ''), 'bueno');
        try { await App.verAbiertos(); } catch (e2) { /* solo pintar */ }
      } else {
        U.aviso('Guardado.', 'bueno');
      }
      await volverAPintar(id);
    };
  }

  /* ---------- la lista, agrupada ---------- */

  function pintarLista(caja, fuente, texto, tarjeta) {
    var lista = U.normalizar(texto).length >= 2 ? Datos.buscar(fuente.lista, texto, 200) : fuente.lista;
    A.agrupar(lista).forEach(function (g) {
      var h = document.createElement('div');
      h.className = 'personas-bloque-titulo';
      h.textContent = g.titulo + ' (' + g.lista.length + ')';
      caja.appendChild(h);
      g.lista.forEach(function (p) { caja.appendChild(tarjeta(p)); });
    });
    return lista.length;
  }

  /* ---------- el departamento, al crear y al editar ---------- */

  function opcionesDepartamento(o, elegido) {
    return '<option value="">Sin departamento</option>' + A.aplanar(o).map(function (d) {
      return '<option value="' + esc(d.id) + '"' + (d.id === elegido ? ' selected' : '') + '>' +
        esc(new Array(d.nivel + 1).join('— ') + d.nombre) + '</option>';
    }).join('');
  }

  function alFijarTercero(p, caja) {
    App.E.nuevo.departamento = null;
    if (!p || p.categoria !== CAT || !caja) return;
    var o = A.organismoPorId(A.enMemoria(), p.idOrganismo);
    if (!o || !A.aplanar(o).length) return;
    var div = document.createElement('div');
    div.className = 'adm-departamento-nuevo';
    div.innerHTML = '<label class="etiqueta">Departamento <span class="suave">(opcional; no va en el nombre)</span></label>' +
      '<select id="nuevo-departamento" class="campo">' + opcionesDepartamento(o, '') + '</select>';
    caja.appendChild(div);
    $('nuevo-departamento').onchange = function () {
      App.E.nuevo.departamento = A.departamentoParaFicha(o, this.value);
    };
  }

  function htmlEditar(a) {
    var o = A.organismoDelAsunto(a);
    if (!o || !A.aplanar(o).length) return '';
    var elegido = (a.ficha && a.ficha.departamento && a.ficha.departamento.id) || '';
    return '<label class="etiqueta">Departamento <span class="suave">(opcional; no va en el nombre)</span></label>' +
      '<select id="ed-departamento" class="campo">' + opcionesDepartamento(o, elegido) + '</select>';
  }

  /* undefined si no había desplegable (no se toca lo guardado). */
  function leerEditar(a) {
    var sel = $('ed-departamento');
    if (!sel) return undefined;
    var o = A.organismoDelAsunto(a);
    return o ? A.departamentoParaFicha(o, sel.value) : undefined;
  }

  /* ---------- los enganches ---------- */

  if (window.App) {
    if (App.ALTAS_DE_CATEGORIA) App.ALTAS_DE_CATEGORIA[CAT] = darDeAlta;
    if (App.FICHAS_DE_CATEGORIA) App.FICHAS_DE_CATEGORIA[CAT] = { html: htmlFicha, enganchar: engancharFicha };
    if (App.LISTAS_DE_CATEGORIA) App.LISTAS_DE_CATEGORIA[CAT] = pintarLista;
    if (App.alFijarTercero) App.alFijarTercero.push(alFijarTercero);
  }

  return {
    darDeAlta: darDeAlta, htmlFicha: htmlFicha, pintarLista: pintarLista,
    htmlEditar: htmlEditar, leerEditar: leerEditar, alFijarTercero: alFijarTercero,
    renombrarAbiertos: renombrarAbiertos
  };
})();
window.AdministracionesFicha = AdministracionesFicha;
