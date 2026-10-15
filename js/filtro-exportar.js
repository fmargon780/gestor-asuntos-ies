/* ============================================================
   filtro-exportar.js — «Exportar la lista ▾» dentro de «Filtrar el alumnado» (fila 345, 15-oct-2026,
   docs/FILTRO-EN-ANADIR-VARIOS-Y-EXPORTAR.md).

   Saca a Excel o a PDF a las personas que cumplen un filtro, con columnas fijas:
     - Alumnado: Apellidos y nombre · Nº escolar · Unidad · una columna por cada dato del alumnado usado.
     - Personal: Apellidos y nombre · Puesto · una columna por cada criterio usado.
   Por unidad y, dentro, por apellidos (el personal, por apellidos). Nada se guarda en ningún asunto: se
   descarga (Excel, con js/exportar-hoja.js) o se abre en el visor de siempre (PDF, con js/exportar-informe.js).

   - listaDeAlumnado(f): { columnas, filas, criterios, palabra } para un filtro de js/repartir-filtro.js.
   - listaDePersonal(personas, criterios): lo mismo para el personal de Etiquetas.
   - botonHTML(lista) y enganchar(raiz, obtener): el botón con su menú (Excel / PDF).
   - nombreDeFichero(extension, hoy): «AAMMDD Lista filtrada.xlsx».
   ============================================================ */
var FiltroExportar = (function () {

  var TITULO = 'Lista filtrada';

  function esc(t) { return U.escapar(t); }
  function clave(t) { return U.normalizar(String(t || '')); }
  function porTexto(a, b) { var x = clave(a), y = clave(b); return x < y ? -1 : (x > y ? 1 : 0); }
  function plural(n, uno, otros) { return n + ' ' + (n === 1 ? uno : otros); }

  /* ---------- la lista ---------- */

  function criterioTexto(f, c) {
    if (c.tipo === 'unidad') return 'Unidad: ' + c.valor;
    if (c.tipo === 'nivel') return 'Nivel: ' + c.valor;
    if (c.tipo === 'ensenanza') return 'Enseñanza: ' + c.valor;
    var campos = f.datos ? AlumnadoBD.porClave(f.datos) : {};
    return AlumnadoBDVer.etiqueta(campos[c.clave] || { clave: c.clave }) + ': ' + c.valor;
  }

  function listaDeAlumnado(f) {
    var campos = f.datos ? AlumnadoBD.porClave(f.datos) : {};
    var porId = {};
    ((f.datos && f.datos.alumnos) || []).forEach(function (a) { porId[String(a.idEscolar).trim()] = a; });
    /* Una columna por cada criterio usado (el mismo no sale dos veces): nivel, enseñanza o un dato del alumnado. */
    var vistos = {}, usados = f.conds.filter(function (c) {
      var k = c.tipo === 'dato' ? 'dato:' + c.clave : c.tipo;
      if (c.tipo === 'unidad' || vistos[k]) return false;   /* la unidad ya tiene su columna fija */
      vistos[k] = true; return true;
    });
    function valorDe(c, p, al) {
      if (c.tipo === 'nivel') return Nombres.nivelYEnsenanza(p.unidad).nivel || '';
      if (c.tipo === 'ensenanza') return Nombres.nivelYEnsenanza(p.unidad).ensenanza || '';
      return al ? AlumnadoBDVer.texto(campos[c.clave], (al.datos || {})[c.clave]) : '';
    }
    var columnas = ['Apellidos y nombre', 'Nº escolar', 'Unidad'].concat(usados.map(function (c) {
      if (c.tipo === 'nivel') return 'Nivel';
      if (c.tipo === 'ensenanza') return 'Enseñanza';
      return AlumnadoBDVer.etiqueta(campos[c.clave] || { clave: c.clave });
    }));
    var personas = f.personas().slice().sort(function (a, b) {
      return porTexto(a.unidad, b.unidad) || porTexto(a.nombre, b.nombre);
    });
    var filas = personas.map(function (p) {
      var al = porId[String(p.id || '').trim()];
      return [p.nombre || '', String(p.id || ''), p.unidad || ''].concat(usados.map(function (c) { return valorDe(c, p, al); }));
    });
    return { columnas: columnas, filas: filas, criterios: f.conds.map(function (c) { return criterioTexto(f, c); }),
             palabra: ['alumno', 'alumnos'] };
  }

  /* `personas`: las del filtro; `criterios`: [{ texto: «Departamento: Matemáticas», columna: «Departamento», valor: (p) → texto }]. */
  function listaDePersonal(personas, criterios) {
    var lista = personas.slice().sort(function (a, b) { return porTexto(a.nombre, b.nombre); });
    return {
      columnas: ['Apellidos y nombre', 'Puesto'].concat(criterios.map(function (c) { return c.columna; })),
      filas: lista.map(function (p) { return [p.nombre || '', p.puesto || ''].concat(criterios.map(function (c) { return c.valor(p); })); }),
      criterios: criterios.map(function (c) { return c.texto; }), palabra: ['persona', 'personas']
    };
  }

  /* ---------- Excel y PDF ---------- */

  function nombreDeFichero(extension, hoy) {
    var d = hoy || new Date();
    var aammdd = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    return aammdd + ' ' + TITULO + '.' + extension;
  }

  async function aExcel(lista) {
    var filas = [lista.columnas.map(function (t) { return { k: 'texto', v: t, b: true }; })];
    lista.filas.forEach(function (f) { filas.push(f.map(function (v) { return { k: 'texto', v: v }; })); });
    var anchos = lista.columnas.map(function (t, i) {
      var mayor = lista.filas.reduce(function (m, f) { return Math.max(m, String(f[i] || '').length); }, String(t).length);
      return Math.max(10, Math.min(50, mayor + 2));
    });
    var bytes = await ExportarHoja.libro([{ nombre: TITULO, filas: filas, anchos: anchos }]);
    ExportarHoja.descargar(new Blob([bytes], { type: ExportarHoja.MIME }), nombreDeFichero('xlsx'));
  }

  function aPdf(lista) {
    var n = lista.filas.length;
    return ExportarInforme.abrir({
      titulo: TITULO,
      tabla: {
        columnas: lista.columnas.map(function (t) { return { titulo: t, clase: 'texto' }; }),
        filas: lista.filas.map(function (f) { return f.map(function (v) { return { k: 'texto', v: v }; }); }),
        total: n, sumas: [], textoTotal: plural(n, lista.palabra[0], lista.palabra[1])
      },
      registros: lista.filas.map(function () { return { abierto: true, hitos: [] }; }),
      filtros: { palabras: lista.criterios }, conHitos: false, incluyeArchivados: false, por: '',
      palabra: lista.palabra
    });
  }

  /* ---------- el botón ---------- */

  function botonHTML(activo) {
    return '<div class="filtro-exportar">' +
      '<button type="button" class="boton filtro-exportar-boton" data-solo-lectura aria-haspopup="menu" aria-expanded="false"' + (activo ? '' : ' disabled') + '>Exportar la lista ▾</button>' +
      '<div class="filtro-exportar-menu oculto" role="menu">' +
        '<button type="button" class="boton" role="menuitem" data-fx="excel" data-solo-lectura>Excel</button>' +
        '<button type="button" class="boton" role="menuitem" data-fx="pdf" data-solo-lectura>PDF</button>' +
      '</div></div>';
  }

  /* `obtener()` devuelve la lista (listaDeAlumnado o listaDePersonal) en el momento de pulsar. */
  function enganchar(raiz, obtener) {
    var caja = raiz.querySelector('.filtro-exportar');
    if (!caja) return;
    var boton = caja.querySelector('.filtro-exportar-boton'), menu = caja.querySelector('.filtro-exportar-menu');
    boton.onclick = function (ev) {
      ev.stopPropagation();
      var abrir = menu.classList.contains('oculto');
      menu.classList.toggle('oculto', !abrir);
      boton.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    };
    Array.prototype.forEach.call(menu.querySelectorAll('[data-fx]'), function (b) {
      b.onclick = async function (ev) {
        ev.stopPropagation();
        menu.classList.add('oculto');
        boton.setAttribute('aria-expanded', 'false');
        try {
          var lista = obtener();
          if (!lista || !lista.filas.length) { U.aviso('No sale nadie en el filtro.', 'malo'); return; }
          if (b.getAttribute('data-fx') === 'excel') await aExcel(lista); else await aPdf(lista);
        } catch (e) { U.fallo('No he podido exportar la lista', e); }
      };
    });
  }

  return {
    listaDeAlumnado: listaDeAlumnado, listaDePersonal: listaDePersonal, botonHTML: botonHTML, enganchar: enganchar,
    nombreDeFichero: nombreDeFichero, TITULO: TITULO
  };
})();
window.FiltroExportar = FiltroExportar;
