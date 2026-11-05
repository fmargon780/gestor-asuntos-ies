/* ============================================================
   campos-lista-datos.js — lo que necesita `CamposLista.reunir` y los
   ejemplos de la lista de campos (fila 528, docs/528-LISTA-DE-CAMPOS.md).

   `entrada()` lee lo que la app ya tiene en memoria o en disco (nada
   se escribe aquí): huecos, datos del Centro de datos, columnas de los
   ficheros, tablas de datos, campos propios y calculados, y los textos
   de las plantillas para saber dónde se usa cada campo.

   `personas()` da hasta 30 personas del alumnado o del personal para
   «Ejemplos con…», y `ejemplo(campo, persona)` el valor de un campo
   para esa persona (o '' si no tiene).
   ============================================================ */
var CamposListaDatos = (function () {

  async function cabeceraDe(categoria) {
    try {
      var r = await Datos.cargar(App.E.datos, categoria);
      return { cabecera: (r && r.cabecera) || [], fichero: (r && r.fichero) || '' };
    } catch (e) { return { cabecera: [], fichero: '' }; }
  }

  async function tablasConColumnas() {
    if (!window.TablasDatos) return [];
    try {
      var l = await TablasDatos.lista();
      var salida = [];
      for (var i = 0; i < l.tablas.length; i++) {
        var t = l.tablas[i];
        var d = await TablasDatos.cargar();
        var tabla = d.tablas[TablasDatos.nombreTabla(t.nombre)];
        if (tabla && tabla.cabecera && tabla.cabecera.length) salida.push({ nombre: t.nombre, columnas: tabla.cabecera });
      }
      return salida;
    } catch (e) { return []; }
  }

  async function textosDePlantillas() {
    var textos = [];
    try {
      var p = window.Plantillas ? await Plantillas.cargar(App.E.gestor) : null;
      ((p && p.lista) || []).forEach(function (x) { textos.push({ tipo: x.tipo || '', donde: 'Correo «' + (x.nombre || x.tipo) + '»', texto: (x.asunto || '') + '\n' + (x.texto || '') }); });
      ((p && p.documentos) || []).forEach(function (x) { textos.push({ tipo: x.tipo || '', donde: 'Documento «' + (x.nombre || x.tipo) + '»', texto: x.texto || '' }); });
    } catch (e) { /* sin plantillas: nada se usa */ }
    var porDoc = (App.E.campos && App.E.campos.textoPorTipoDocumento) || {};
    Object.keys(porDoc).forEach(function (k) { textos.push({ donde: 'Texto por defecto de «' + k + '»', texto: porDoc[k] }); });
    return textos;
  }

  /* Se vuelve a llamar cada vez que cambia algo: nada se guarda en caché. */
  async function entrada() {
    var al = await cabeceraDe('ALUMNADO'), pe = await cabeceraDe('PERSONAL');
    var campos = App.E.campos ? await Campos.leer(App.E.gestor) : null;
    if (campos) App.E.campos = campos;
    return {
      huecos: (window.Plantillas && Plantillas.HUECOS) || [],
      bd: window.AlumnadoBDVer ? AlumnadoBDVer.huecos() : [],
      tablas: await tablasConColumnas(),
      cabeceras: { ALUMNADO: al.cabecera, PERSONAL: pe.cabecera },
      ficheros: { ALUMNADO: al.fichero, PERSONAL: pe.fichero },
      config: App.E.campos || {},
      textos: await textosDePlantillas()
    };
  }

  async function lista() { return CamposLista.reunir(await entrada()); }

  async function personas(categoria) {
    try {
      var r = await Datos.cargar(App.E.datos, categoria || 'ALUMNADO');
      return (r.lista || []).filter(function (p) { return categoria !== 'ALUMNADO' || p.matriculado !== false; }).slice(0, 30)
        .map(function (p) { return { categoria: categoria || 'ALUMNADO', nombre: p.nombre, persona: p }; })
        .filter(function (p, i, todas) { return todas.findIndex(function (x) { return x.nombre === p.nombre; }) === i; });
    } catch (e) { return []; }
  }

  var valoresPorPersona = {};
  async function valoresDe(p) {
    var k = p.categoria + '|' + p.nombre;
    if (!valoresPorPersona[k]) {
      try {
        var a = Plantillas.asuntoParaPersona({ ficha: { tipo: '' }, leido: {} }, { categoria: p.categoria, nombre: p.nombre });
        valoresPorPersona[k] = await Plantillas.valoresDeAsunto(a);
      } catch (e) { valoresPorPersona[k] = {}; }
    }
    return valoresPorPersona[k];
  }

  async function ejemplo(campo, p) {
    if (!p) return '';
    var v = '';
    try {
      if (campo.id.indexOf('h:') === 0) {
        v = (await valoresDe(p))[campo.id.slice(2)];
        if (!v && campo.id === 'h:grupo') v = (p.persona.campos || {}).Unidad || p.persona.unidad || '';   /* sin asunto, el grupo sale de la persona */
      } else if (campo.id.indexOf('f:') === 0) {
        v = (p.persona.campos || {})[campo.columna];
      } else if (campo.id.indexOf('d:') === 0 && window.TablasDatos && campo.columna) {
        var filas = await TablasDatos.filasDe(campo.tabla, p.persona);
        v = filas.length && filas[0].celdas ? filas[0].celdas[campo.columna] : '';
      } else if (campo.calculadoId) {
        v = Campos.valorInicial({ origen: 'calculado', id: campo.calculadoId }, p.persona, App.E.campos);
      } else if (campo.origen === 'Manual') {
        v = ((await valoresDe(p)).campos || {})[campo.nombre];
      }
    } catch (e) { v = ''; }
    return v === undefined || v === null ? '' : String(v);
  }

  /* Cuándo se recibió el fichero del que sale el campo ('' si no se sabe). */
  async function fechaDelFichero(campo, ficheros) {
    try {
      if (campo.origen !== 'Centro de datos' && campo.origen !== 'Tabla de datos') return '';
      var f = campo.fichero || (campo.tabla.indexOf('RegAlum') === 0 ? (ficheros || {}).ALUMNADO : campo.tabla === 'RelPerCen' ? (ficheros || {}).PERSONAL : '');
      if (!f || !window.DatosQueTengo) return '';
      var ms = await DatosQueTengo.fechaReal(f);
      if (ms) return 'Fichero recibido el ' + DatosQueTengo.fechaHora(new Date(ms).toISOString());
      var copia = await Carpetas.fechaFichero(App.E.datos, f);   /* sin apunte de Séneca: la fecha de la copia */
      return copia ? 'Fichero copiado aquí el ' + DatosQueTengo.fechaHora(new Date(copia).toISOString()) : '';
    } catch (e) { return ''; }
  }

  return { entrada: entrada, lista: lista, personas: personas, ejemplo: ejemplo, fechaDelFichero: fechaDelFichero };
})();
window.CamposListaDatos = CamposListaDatos;
