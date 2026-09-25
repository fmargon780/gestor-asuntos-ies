/* ============================================================
   alumnado-bd-ver.js — lo que se ve del alumnado de la base de datos
   (fila 144, 25-sep-2026, docs/ALUMNADO-BD-DESDE-DRIVE.md). Todo
   guiado por `campos` del archivo (js/alumnado-bd.js): un dato nuevo
   aparece solo en los tres sitios, sin tocar nada.

   - texto(campo, valor): cada tipo a su manera (`lista` con comas,
     `si-no` Sí/No, `fecha` dd-mm-aaaa, `tabla` en filas; lo que no se
     conoce, como texto).
   - tarjetas(persona): una `<details>` por `apartado`, plegada, con su
     resumen en el título; la fecha de los datos al pie. Para «Ver todo»
     del alumno (js/ficha-tercero-alumno.js).
   - comoTabla(salida): para js/tablas-datos.js. «ALUMNADO BD» (una fila
     por alumno, una columna por dato) y una tabla más por cada dato de
     tipo `tabla` («ALUMNADO BD <etiqueta>»). Filas con `idEscolar`.
   - huecos(): los huecos {{DATO …}} / {{TABLA …}}, con su `grupo` (el
     apartado), para el cuadro de insertar huecos (js/huecos-buscador.js).
   - filtrar(datos, condiciones, antiguos) y pintarGrupo(caja, fuente,
     marcar): «Por datos del alumnado» en las altas por grupo de
     terceros relacionados (js/relacionados.js).
   ============================================================ */
var AlumnadoBDVer = (function () {

  var TABLA = 'ALUMNADO BD';

  function vacio(v) { return v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length); }

  function ddmmaaaa(v) {
    var m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[3] + '-' + m[2] + '-' + m[1] : String(v);
  }

  function suelto(v) {
    if (vacio(v)) return '';
    if (typeof v === 'object') return Array.isArray(v) ? v.map(suelto).join(', ') : JSON.stringify(v);
    return String(v);
  }

  /* Un valor como texto, según el tipo de su campo. */
  function texto(campo, v) {
    if (vacio(v)) return '';
    var tipo = (campo && campo.tipo) || 'texto';
    if (tipo === 'si-no') return v === true || /^(s[ií]|true|1)$/i.test(String(v)) ? 'Sí' : 'No';
    if (tipo === 'fecha') return ddmmaaaa(v);
    if (tipo === 'lista') return Array.isArray(v) ? v.map(suelto).filter(Boolean).join(', ') : suelto(v);
    if (tipo === 'tabla') return filasDeTabla(campo, v).map(function (f) { return f.join(' · '); }).join('; ');
    return suelto(v);
  }

  function columnasDe(campo) { return Array.isArray(campo && campo.columnas) ? campo.columnas : []; }

  function filasDeTabla(campo, v) {
    var cols = columnasDe(campo);
    return (Array.isArray(v) ? v : []).map(function (fila) {
      if (!fila || typeof fila !== 'object') return [suelto(fila)];
      return cols.length ? cols.map(function (c) { return texto(c, fila[c.clave]); }) : Object.keys(fila).map(function (k) { return suelto(fila[k]); });
    });
  }

  /* ---------- la ficha: una tarjeta por apartado ---------- */

  function apartados(datos) {
    var orden = [], por = {};
    ((datos && datos.campos) || []).forEach(function (c) {
      if (!c || !c.clave) return;
      var a = String(c.apartado || 'Otros datos');
      if (!por[a]) { por[a] = []; orden.push(a); }
      por[a].push(c);
    });
    return orden.map(function (a) { return { nombre: a, campos: por[a] }; });
  }

  function tablaHtml(campo, v) {
    var cols = columnasDe(campo);
    var filas = filasDeTabla(campo, v);
    return '<table class="bd-tabla">' +
      (cols.length ? '<thead><tr>' + cols.map(function (c) { return '<th>' + U.escapar(c.etiqueta || c.clave) + '</th>'; }).join('') + '</tr></thead>' : '') +
      '<tbody>' + filas.map(function (f) { return '<tr>' + f.map(function (x) { return '<td>' + U.escapar(x) + '</td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table>';
  }

  /* [<details>] para la persona, o [] si no trae datos de la base. */
  function tarjetas(persona) {
    var datos = window.AlumnadoBD && AlumnadoBD.enMemoria();
    if (!datos || !persona || !persona.bd) return [];
    var fechaPie = '<p class="nota">Datos de la base de datos de alumnado del ' + U.escapar(AlumnadoBD.fechaLegible(persona.bdGenerado)) + '</p>';
    return apartados(datos).map(function (ap) {
      var con = ap.campos.filter(function (c) { return !vacio(persona.bd[c.clave]); });
      if (!con.length) return null;
      var sueltos = con.filter(function (c) { return c.tipo !== 'tabla'; });
      var resumen = sueltos.slice(0, 2).map(function (c) { return texto(c, persona.bd[c.clave]); }).join(' · ') ||
        con.map(function (c) { var n = (persona.bd[c.clave] || []).length; return n + (n === 1 ? ' fila' : ' filas'); }).join(' · ');
      var det = document.createElement('details');
      det.className = 'vt-tarjeta vt-tarjeta-bd';
      det.innerHTML = '<summary class="vt-tarjeta-titulo"><span>' + U.escapar(ap.nombre) + '</span>' +
        '<span class="vt-bd-resumen">' + U.escapar(resumen) + '</span></summary>' +
        (sueltos.length ? '<div class="ficha-datos">' + sueltos.map(function (c) {
          return '<div class="ficha-dato"><span>' + U.escapar(c.etiqueta || c.clave) + '</span><span>' + U.escapar(texto(c, persona.bd[c.clave])) + '</span></div>';
        }).join('') + '</div>' : '') +
        con.filter(function (c) { return c.tipo === 'tabla'; }).map(function (c) {
          return '<div class="vt-bd-tabla-titulo">' + U.escapar(c.etiqueta || c.clave) + '</div>' + tablaHtml(c, persona.bd[c.clave]);
        }).join('') + fechaPie;
      return det;
    }).filter(Boolean);
  }

  /* ---------- las plantillas ---------- */

  function etiqueta(c) { return String(c.etiqueta || c.clave).replace(/[:|{}]/g, ' ').trim(); }

  async function comoTabla(salida) {
    var datos = window.AlumnadoBD && await AlumnadoBD.leer();
    if (!datos) return;
    var sueltos = datos.campos.filter(function (c) { return c && c.clave && c.tipo !== 'tabla'; });
    var cabecera = ['Nº Id. Escolar'].concat(sueltos.map(etiqueta));
    var cursos = [datos.cursoAcademico || ''].filter(Boolean);
    salida.tablas[TABLA] = { nombre: TABLA, ficheros: [AlumnadoBD.FICHERO], cursos: cursos, cabecera: cabecera,
      filas: datos.alumnos.map(function (a) {
        var d = a.datos || {}, celdas = { 'Nº Id. Escolar': String(a.idEscolar).trim() };
        sueltos.forEach(function (c) { celdas[etiqueta(c)] = texto(c, d[c.clave]); });
        return { celdas: celdas, idEscolar: String(a.idEscolar).trim(), clave: '' };
      }) };
    datos.campos.filter(function (c) { return c && c.clave && c.tipo === 'tabla'; }).forEach(function (c) {
      var cols = columnasDe(c);
      var nombre = TablasDatos.nombreTabla(TABLA + ' ' + etiqueta(c));
      var filas = [];
      datos.alumnos.forEach(function (a) {
        filasDeTabla(c, (a.datos || {})[c.clave]).forEach(function (f) {
          var celdas = {};
          (cols.length ? cols : f.map(function (x, i) { return { clave: String(i + 1) }; })).forEach(function (col, i) { celdas[etiqueta(col)] = f[i] || ''; });
          filas.push({ celdas: celdas, idEscolar: String(a.idEscolar).trim(), clave: '' });
        });
      });
      salida.tablas[nombre] = { nombre: nombre, ficheros: [AlumnadoBD.FICHERO], cursos: cursos, cabecera: cols.map(etiqueta), filas: filas };
    });
  }

  function huecos() {
    var datos = window.AlumnadoBD && AlumnadoBD.enMemoria();
    if (!datos) return [];
    var salida = [];
    apartados(datos).forEach(function (ap) {
      ap.campos.forEach(function (c) {
        var e = etiqueta(c);
        salida.push(c.tipo === 'tabla'
          ? { clave: '{TABLA ' + TABLA + ' ' + e + '}', etiqueta: e + ' (tabla)', grupo: 'Alumnado · ' + ap.nombre }
          : { clave: '{DATO ' + TABLA + ': ' + e + '}', etiqueta: e, grupo: 'Alumnado · ' + ap.nombre });
      });
    });
    return salida;
  }

  /* ---------- los grupos: «Por datos del alumnado» ---------- */

  /* condiciones: [{ clave, valor }]. Devuelve los alumnos del archivo que
     cumplen todas; solo matriculados, salvo `antiguos`. */
  function filtrar(datos, condiciones, antiguos) {
    var campos = window.AlumnadoBD ? AlumnadoBD.porClave(datos) : {};
    return ((datos && datos.alumnos) || []).filter(function (a) {
      if (!antiguos && a.matriculado !== true) return false;
      var d = a.datos || {};
      return (condiciones || []).every(function (k) {
        var c = campos[k.clave], v = d[k.clave];
        if (c && c.tipo === 'lista' && Array.isArray(v)) return v.map(suelto).indexOf(k.valor) !== -1;
        return texto(c, v) === k.valor;
      });
    });
  }

  function valoresDe(datos, clave, antiguos) {
    var c = AlumnadoBD.porClave(datos)[clave], vistos = {};
    datos.alumnos.forEach(function (a) {
      if (!antiguos && a.matriculado !== true) return;
      var v = (a.datos || {})[clave];
      var lista = c && c.tipo === 'lista' && Array.isArray(v) ? v.map(suelto) : [texto(c, v)];
      lista.forEach(function (x) { if (x) vistos[x] = true; });
    });
    return Object.keys(vistos).sort(function (x, y) { return x.localeCompare(y, 'es'); });
  }

  function opciones(lista, primera) {
    return '<option value="">' + primera + '</option>' + lista.map(function (o) {
      return '<option value="' + U.escapar(o.valor) + '">' + U.escapar(o.texto) + '</option>';
    }).join('');
  }

  /* Dentro de los atajos de alumnado del cuadro de relacionados. `marcar`
     recibe las personas del RegAlum que salen. */
  async function pintarGrupo(caja, fuente, marcar) {
    var datos = window.AlumnadoBD && await AlumnadoBD.leer();
    if (!datos || !caja) return;
    var sueltos = datos.campos.filter(function (c) { return c && c.clave && c.tipo !== 'tabla'; });
    var porId = {};
    (fuente.lista || []).forEach(function (p) { if (p.id) porId[String(p.id).trim()] = p; });
    var conds = [];
    var div = document.createElement('div');
    div.className = 'bd-grupo';
    div.innerHTML =
      '<div class="atajo-fila"><span>Por datos del alumnado</span>' +
        '<select id="bd-grupo-dato" class="campo">' + opciones(sueltos.map(function (c) { return { valor: c.clave, texto: etiqueta(c) }; }), 'Elige un dato…') + '</select>' +
        '<select id="bd-grupo-valor" class="campo" disabled><option value="">Su valor…</option></select></div>' +
      '<div class="bd-grupo-conds" id="bd-grupo-conds"></div>' +
      '<div class="atajo-fila"><label><input type="checkbox" id="bd-grupo-antiguos"> Incluir antiguos</label>' +
        '<span id="bd-grupo-cuantos" class="explica"></span>' +
        '<button type="button" class="boton" id="bd-grupo-anadir" disabled>Añadirlos</button></div>';
    caja.appendChild(div);
    var $ = function (id) { return div.querySelector('#' + id); };

    function salen() {
      if (!conds.length) return { personas: [], sinFicha: 0 };
      var alumnos = filtrar(datos, conds, $('bd-grupo-antiguos').checked);
      var personas = [], sinFicha = 0;
      alumnos.forEach(function (a) { var p = porId[String(a.idEscolar).trim()]; if (p) personas.push(p); else sinFicha++; });
      return { personas: personas, sinFicha: sinFicha };
    }

    function repintar() {
      var campos = AlumnadoBD.porClave(datos);
      $('bd-grupo-conds').innerHTML = conds.map(function (k, i) {
        return '<span class="bd-grupo-cond">' + U.escapar(etiqueta(campos[k.clave] || { clave: k.clave })) + ' = ' + U.escapar(k.valor) +
          ' <button type="button" class="boton-mini" data-quitar="' + i + '" aria-label="Quitar">✕</button></span>';
      }).join('');
      Array.prototype.forEach.call($('bd-grupo-conds').querySelectorAll('[data-quitar]'), function (b) {
        b.onclick = function () { conds.splice(Number(b.getAttribute('data-quitar')), 1); repintar(); };
      });
      var s = salen();
      $('bd-grupo-cuantos').textContent = conds.length ? 'Salen ' + s.personas.length + (s.sinFicha ? ' (y ' + s.sinFicha + ' sin ficha en el RegAlum)' : '') : '';
      $('bd-grupo-anadir').disabled = !s.personas.length;
    }

    $('bd-grupo-dato').onchange = function () {
      var clave = $('bd-grupo-dato').value;
      var sel = $('bd-grupo-valor');
      sel.disabled = !clave;
      sel.innerHTML = opciones(clave ? valoresDe(datos, clave, $('bd-grupo-antiguos').checked).map(function (v) { return { valor: v, texto: v }; }) : [], 'Su valor…');
    };
    $('bd-grupo-valor').onchange = function () {
      var clave = $('bd-grupo-dato').value, valor = $('bd-grupo-valor').value;
      if (!clave || !valor) return;
      conds = conds.filter(function (k) { return k.clave !== clave; }).concat([{ clave: clave, valor: valor }]);
      $('bd-grupo-dato').value = '';
      $('bd-grupo-valor').innerHTML = '<option value="">Su valor…</option>';
      $('bd-grupo-valor').disabled = true;
      repintar();
    };
    $('bd-grupo-antiguos').onchange = function () { $('bd-grupo-dato').onchange(); repintar(); };
    $('bd-grupo-anadir').onclick = function () { var s = salen(); if (s.personas.length) marcar(s.personas); };
  }

  return {
    texto: texto, tarjetas: tarjetas, comoTabla: comoTabla, huecos: huecos,
    filtrar: filtrar, valoresDe: valoresDe, pintarGrupo: pintarGrupo, TABLA: TABLA
  };
})();
window.AlumnadoBDVer = AlumnadoBDVer;
