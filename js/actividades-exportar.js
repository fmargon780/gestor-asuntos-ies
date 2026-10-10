/* ============================================================
   actividades-exportar.js — la hoja de cálculo de la pantalla «Actividades
   extraescolares» (9-oct-2026, fila 310, docs/ACTIVIDADES-EXTRAESCOLARES-PANTALLA.md).

   Un `.xlsx` con lo que se ve en la tabla (los filtros mandan), escrito con
   ExportarHoja.libro (JSZip, js/exportar-hoja.js). Dos pestañas:
     - «Actividades»: una fila por actividad, con las columnas de la tabla y,
       además, fecha de fin, horas de salida y de regreso, horas de dedicación
       y número del asunto. Fechas como fechas y números como números.
     - «Profesorado»: una fila por profesor y actividad, ordenada por profesor y fecha.
   `hojas(lista, hoyIso)` es PURA y se prueba suelta.
   ============================================================ */
var ActividadesExportar = (function () {

  function texto(v) { return { k: 'texto', v: v === undefined || v === null ? '' : String(v) }; }
  function fecha(iso) { return iso ? { k: 'fecha', v: iso } : texto(''); }
  function numero(v) { return v === null || v === undefined || v === '' || !isFinite(Number(v)) ? texto('') : { k: 'numero', v: Number(v), dec: !Number.isInteger(Number(v)) }; }
  function negrita(t) { return { k: 'texto', v: t, b: true }; }

  function profesoradoTexto(a) {
    return (a.profesorado || []).map(function (p) { return p.nombre + (p.papel === 'organiza' ? ' (organiza)' : ''); }).join('; ');
  }
  function dniDe(p) { return /^\d+$/.test(String(p.clave || '')) ? String(p.clave) : ''; }

  /* `lista`: las actividades que se ven (ya filtradas). */
  function hojas(lista, hoyIso) {
    var actividades = [[
      'Fecha', 'Fecha de fin', 'Actividad', 'Departamento', 'Lugar', 'Unidades', 'Alumnado', 'Profesorado', 'Situación',
      'Hora de salida', 'Hora de regreso', 'Horas de dedicación', 'Número del asunto'
    ].map(negrita)];
    lista.forEach(function (a) {
      actividades.push([
        fecha(a.inicio), fecha(a.fin && a.fin !== a.inicio ? a.fin : ''), texto(a.nombre), texto(a.departamento), texto(a.lugar),
        texto((a.unidades || []).map(function (u) { return u.unidad; }).join(', ')),
        a.antigua ? texto('') : numero(a.alumnado), texto(profesoradoTexto(a)),
        texto(Actividades.textoSituacion(Actividades.situacion(a, hoyIso)) + (a.antigua ? ' (antigua)' : '')),
        texto(a.salida), texto(a.regreso), numero(a.horas), texto(a.asunto ? a.asunto.numero : '')
      ]);
    });

    var filas = [];
    lista.forEach(function (a) {
      (a.profesorado || []).forEach(function (p) { filas.push({ p: p, a: a }); });
    });
    filas.sort(function (x, y) {
      var nx = U.normalizar(x.p.nombre), ny = U.normalizar(y.p.nombre);
      if (nx !== ny) return nx < ny ? -1 : 1;
      return x.a.inicio < y.a.inicio ? -1 : (x.a.inicio > y.a.inicio ? 1 : 0);
    });
    var profes = [['Profesor/a', 'DNI', 'Participación', 'Fecha', 'Actividad', 'Lugar', 'Horas'].map(negrita)];
    filas.forEach(function (f) {
      profes.push([
        texto(f.p.nombre), texto(dniDe(f.p)), texto(f.p.papel === 'organiza' ? 'Organización' : 'Acompañante'),
        fecha(f.a.inicio), texto(f.a.nombre), texto(f.a.lugar), numero(f.a.horas)
      ]);
    });

    return [
      { nombre: 'Actividades', filas: actividades, anchos: [12, 12, 44, 26, 24, 22, 10, 50, 18, 12, 12, 12, 16] },
      { nombre: 'Profesorado', filas: profes, anchos: [34, 12, 16, 12, 44, 24, 8] }
    ];
  }

  /* «Actividades extraescolares 25-26.xlsx» o «… todas.xlsx». */
  function nombreDeFichero(curso) {
    var c = String(curso || '').replace(/[\\\/:*?"<>|]/g, ' ').trim();
    return 'Actividades extraescolares ' + (c || 'todas') + '.xlsx';
  }

  async function exportar(lista, curso, hoyIso) {
    var bytes = await ExportarHoja.libro(hojas(lista, hoyIso));
    ExportarHoja.descargar(new Blob([bytes], { type: ExportarHoja.MIME }), nombreDeFichero(curso));
  }

  return { hojas: hojas, nombreDeFichero: nombreDeFichero, exportar: exportar };
})();
window.ActividadesExportar = ActividadesExportar;
