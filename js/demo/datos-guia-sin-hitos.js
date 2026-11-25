/* ============================================================
   demo/datos-guia-sin-hitos.js — lo que necesita el editor de la guía a toda la pantalla (fila 737,
   docs/737-GUIA-A-TODA-LA-PANTALLA.md) en la copia de pruebas:
     el tipo «IPASEN ALUMNADO» (alumnado), «Sin hitos», con un dato de lista («Cómo la quiere»), cinco tareas
     (tres con papel; dos con «Solo si») y tres tipos de documento: dos con recorrido y uno sin él.
   Todo inventado. `Demo.guiaSinHitos.construir({ crearTipoConGuia })` lo llama js/demo/datos.js.
   ============================================================ */
(function () {
  'use strict';

  var TIPO = 'IPASEN ALUMNADO';
  var DATO = 'Cómo la quiere';
  var DOCS = [
    { nombre: 'CREDENCIAL IPASEN', recorrido: { entra: false, firma: 'Nadie', registro: false, envia: true, aquien: 'Interesado', via: 'iPasen' } },
    { nombre: 'SOLICITUD DE CREDENCIAL', recorrido: { entra: true, firma: 'Nadie', registro: true, envia: false, aquien: '', via: '' } },
    { nombre: 'JUSTIFICANTE DE ENTREGA', recorrido: null }
  ];

  async function ponerDato(tipo) {
    var campos = await Campos.leer(App.E.gestor);
    var propio = { id: 'p' + Date.now().toString(36) + 'gsh', nombre: DATO, clase: 'lista', valores: ['En persona', 'Por correo', 'Por iPasen'] };
    campos = await Campos.guardarPropios(App.E.gestor, function (lista) { lista.push(propio); return lista; });
    var lista = ((campos.porTipo || {})[tipo.tipo] || []).slice();
    lista.push({ origen: 'propio', id: propio.id, obligatorio: false, enNombre: false });
    App.E.campos = await Campos.guardarConfigDeTipo(App.E.gestor, tipo.tipo, lista);
  }

  async function ponerTiposDeDocumento() {
    for (var i = 0; i < DOCS.length; i++) {
      if (App.E.tiposDocumento.indexOf(DOCS[i].nombre) === -1) App.E.tiposDocumento.push(DOCS[i].nombre);
      if (DOCS[i].recorrido && window.RecorridoTipo) await RecorridoTipo.poner(DOCS[i].nombre, DOCS[i].recorrido);
    }
    await App.guardarTiposDocumento();
    if (App.pintarTiposDeDocumento) App.pintarTiposDeDocumento();
  }

  async function construir(o) {
    var guion = [
      { id: 'gsh-d1', texto: 'Comprobar quién la pide', comoSeHace: 'En persona: si es el alumno, comprueba su foto en Séneca. Si es un tutor legal, pídele un documento oficial de identidad. Si es otra persona, no se le da.' },
      { id: 'gsh-d2', texto: 'Guardar la solicitud firmada', papel: 'SOLICITUD DE CREDENCIAL' },
      { id: 'gsh-d3', texto: 'Guardar aquí la credencial', papel: 'CREDENCIAL IPASEN', comoSeHace: 'En Séneca, con el perfil Gestor PASEN, genera la credencial de la unidad del alumno. Guarda aquí el documento con «Añadir documento».' },
      { id: 'gsh-d4', texto: 'Entregar la credencial en mano', papel: 'JUSTIFICANTE DE ENTREGA', comoSeHace: 'Imprímela y entrégala solo a quien se comprobó.', soloSi: { campo: DATO, valores: ['En persona'] } },
      { id: 'gsh-d5', texto: 'Enviar la credencial', comoSeHace: 'Envíala desde «Enviar ▾», sin imprimir.', soloSi: { campo: DATO, valores: ['Por correo', 'Por iPasen'] } }
    ];
    var tipo = await o.crearTipoConGuia(TIPO, 'ALUMNADO', [
      { id: 'gsh-d0', titulo: 'Tareas', cuerpo: '', opciones: [], listaDeTareas: true, guion: guion }
    ], null);
    tipo.sinHitos = true;
    await App.guardarTipos();
    await ponerDato(tipo);
    await ponerTiposDeDocumento();
  }

  window.Demo = window.Demo || {};
  window.Demo.guiaSinHitos = { construir: construir };
})();
