/* ============================================================
   campo-colocar.js — poner un campo en la parte general o en un hito de un
   asunto, y decir si vale también para los siguientes (fila 530,
   docs/530-DATOS-EN-EL-ASUNTO.md, puntos 7 y 8).

   Lo usan «Pedirlo antes» (js/datos-del-asunto-vista.js) y «+ Añadir campo»
   (js/campo-elegir-en-asunto.js). Dónde:

     'crear'    la parte general, pedido al crear el asunto (porTipo de siempre)
     'general'  la parte general, sin pedirlo al crear (`sinPedirAlCrear`)
     { hito }   un hito (`hito`: la marca del paso de la guía o del propio hito)

   Para quién: 'guia' (este asunto y los siguientes: entra en la guía del
   tipo, `porTipo`) o 'aqui' (solo este asunto: «solo aquí»,
   `ficha.camposPropiosDelAsunto`; el tipo no cambia). Sin tipo, o con un hito
   que no es de la guía, solo 'aqui'.

   `sitiosPara(a)` da las opciones del desplegable «Pedir en»; `describir`,
   la frase del aviso.
   ============================================================ */
var CampoColocar = (function () {

  function hitosDe(a) { return (window.CamposDeHito && CamposDeHito.hitosDelAsunto(a.nombre)) || []; }

  function enGuia(h) { return !!h.origenGuia && !h.delTipoAnterior; }

  /* [{ valor: 'crear' | 'general' | 'h:<marca>', texto, guia: bool }] */
  function sitiosPara(a) {
    var tipo = DatosDelAsunto.tipoDe(a);
    var lista = [{ valor: 'crear', texto: 'Al crear el asunto', guia: !!tipo }, { valor: 'general', texto: 'En la parte general, sin pedirlo al crear', guia: !!tipo }];
    hitosDe(a).forEach(function (h) {
      lista.push({ valor: 'h:' + CamposDeHito.marcaDe(h), texto: 'Hito «' + (h.titulo || '') + '»', guia: !!tipo && enGuia(h), titulo: h.titulo || '' });
    });
    return lista;
  }

  function dondeDe(a, valor) {
    if (valor === 'crear' || valor === 'general') return valor;
    var h = hitosDe(a).filter(function (x) { return 'h:' + CamposDeHito.marcaDe(x) === valor; })[0];
    return { hito: String(valor).slice(2), titulo: h ? (h.titulo || '') : '' };
  }

  function describir(donde) {
    if (donde === 'crear') return 'la parte general, y se pide al crear el asunto';
    if (donde === 'general') return 'la parte general, sin pedirlo al crear';
    return 'el hito «' + donde.titulo + '»';
  }

  /* Lo escribe. `entrada`: { origen, id | columna } del campo. */
  async function colocar(a, entrada, donde, para) {
    var E = CampoDesdeElAsuntoEscribir;
    var tipo = DatosDelAsunto.tipoDe(a);
    var clave = Campos.claveDeCampo(entrada);
    var e = Object.assign({}, entrada, { obligatorio: false, enNombre: false });
    if (donde && donde.hito) e.hito = donde.hito;
    if (para === 'guia' && tipo) {
      if (donde === 'general') e.sinPedirAlCrear = true;
      await E.anadirAlTipo(tipo, e);
      await E.escribirEnAsunto(a, clave, { quitar: true });   /* ya es del tipo: sale de los «solo aquí», con su valor */
    } else {
      await E.escribirEnAsunto(a, clave, { anadir: e });
    }
    if (window.CampoDesdeElAsunto) CampoDesdeElAsunto._i.repintar(a);
  }

  function aviso(nombre, donde, para) {
    var sitio = describir(donde);
    return para === 'guia' ? '«' + nombre + '»: ' + sitio + ', también en los siguientes asuntos.'
      : '«' + nombre + '» sale en ' + sitio + ', solo en este asunto.';
  }

  return { sitiosPara: sitiosPara, dondeDe: dondeDe, describir: describir, colocar: colocar, aviso: aviso, enGuia: enGuia };
})();
window.CampoColocar = CampoColocar;
