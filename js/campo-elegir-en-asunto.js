/* ============================================================
   campo-elegir-en-asunto.js — «+ Añadir campo» de un asunto abre la ventana
   de elegir un campo (fila 530, docs/530-DATOS-EN-EL-ASUNTO.md, punto 8;
   pantalla docs/pantallas/518.html, «En un asunto»).

   Sale de la parte general («Campos del asunto»), de un hito («Campos de
   este hito») y de una tarea «Pedir datos» (js/datos-de-la-tarea.js). La
   ventana es la misma de las plantillas (js/campos-elegir.js), con el
   desplegable «Para» abajo:

     Solo este asunto                                    («solo aquí»)
     Los siguientes: pedirlo al crear el asunto          (parte general)
     Los siguientes: en la parte general, sin pedirlo al crear
     Los siguientes: pedirlo en este hito                (en un hito de la guía)

   Lo que se escribe, y dónde, lo hace js/campo-colocar.js. El valor no se
   pide aquí: el campo sale en su sitio, con su caja para escribirlo.
   ============================================================ */
var CampoElegirEnAsunto = (function () {

  /* [{ valor, texto }] del desplegable «Para». `hito`: { marca, titulo, enGuia } o nada (la parte general). */
  function opcionesPara(a, hito) {
    var tipo = DatosDelAsunto.tipoDe(a);
    var lista = [{ valor: 'aqui', texto: 'Solo este asunto' }];
    if (!tipo) return lista;
    if (!hito) {
      lista.push({ valor: 'crear', texto: 'Los siguientes: pedirlo al crear el asunto' });
      lista.push({ valor: 'general', texto: 'Los siguientes: en la parte general, sin pedirlo al crear' });
    } else if (hito.enGuia) lista.push({ valor: 'guia', texto: 'Los siguientes: pedirlo en este hito' });
    return lista;
  }

  async function poner(a, hito, campo, paraElegido) {
    var entrada = await DatosDelAsunto.entradaDeCampoDeLista(campo, a);
    var clave = Campos.claveDeCampo(entrada);
    var ya = DatosDelAsunto.camposDelAsunto(a).filter(function (c) { return c.clave === clave; })[0];
    if (ya && !hito) { U.aviso('«' + campo.nombre + '» ya está en este asunto.', 'ambar'); return; }
    var donde = hito ? { hito: hito.marca, titulo: hito.titulo || '' } : (paraElegido === 'general' ? 'general' : 'crear');
    var para = paraElegido === 'aqui' || !paraElegido ? 'aqui' : 'guia';
    await CampoColocar.colocar(a, entrada, donde, para);
    U.aviso(CampoColocar.aviso(campo.nombre, donde, para), 'bueno');
  }

  /* `hito` (como en js/campos-de-hito.js): { marca, titulo, enGuia } si se abre desde un hito. */
  function abrir(a, hito, alTerminar) {
    return CamposElegir.abrir({
      tipo: DatosDelAsunto.tipoDe(a), soloGuardables: true, para: opcionesPara(a, hito),
      alElegir: function (campo, para) {
        poner(a, hito, campo, para).then(function () { if (alTerminar) alTerminar(); }, function (e) { U.fallo('No he podido añadir el campo', e); });
      }
    });
  }

  return { abrir: abrir, opcionesPara: opcionesPara };
})();
window.CampoElegirEnAsunto = CampoElegirEnAsunto;
