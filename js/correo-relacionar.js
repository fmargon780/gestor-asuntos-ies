/* ============================================================
   correo-relacionar.js — «Relacionar a alguien con el asunto», dentro del cuadro de Correo
   (6-nov-2026, fila 555, docs/555-A-QUIEN-VA-CADA-CORREO.md).

   Para escribir a alguien que no está entre los destinatarios posibles (Servicios Sociales, por ejemplo), antes se relaciona con
   el asunto: este botón cierra el cuadro un momento, abre el de siempre para añadir un relacionado (js/relacionados.js) y vuelve a
   abrir el correo con lo que había (Para, Copia, Copia oculta, plantilla, asunto y cuerpo escritos a mano). Al buscarlo escribiendo,
   ya sale.
   Fila 562: el aviso de Para, Copia y Copia oculta («Nadie de este asunto…») lleva el mismo botón y pasa lo escrito: un nombre sale ya
   puesto en el buscador; una dirección va a la casilla de correo de la ficha de alta.
   ============================================================ */
var CorreoRelacionar = (function () {

  function $(id) { return document.getElementById(id); }

  async function relacionar(a, texto) {
    var N = window.CorreoNucleo, I = N && N._interno;
    if (!I || !window.Relacionados || !window.CorreoPara) return;
    var cuerpo = $('correo-cuerpo-texto');
    var antes = {
      dest: CorreoPara.instantanea(),
      plantilla: window.CorreoCuadroNucleo ? CorreoCuadroNucleo.S.plantillaElegida : '',
      asunto: $('correo-asunto') ? $('correo-asunto').value : undefined,
      cuerpo: cuerpo ? cuerpo.value : '',
      escrito: !!cuerpo && window.CorreoCuadroNucleo && cuerpo.value !== CorreoCuadroNucleo.S.textoProgramado
    };
    var nuevo = I.comunicarHitoActual, extraHito = I.hitoActual;
    var cierre = $('cuadro-aceptar');
    if (!cierre) return;
    cierre.click();   /* cierra este cuadro: el de relacionar usa la misma ventana */
    await new Promise(function (r) { setTimeout(r, 0); });
    var cambiado = false;
    try { cambiado = await Relacionados.agregarRelacionado(a, texto); } catch (e) { U.fallo('No he podido relacionarlo', e); }
    if (cambiado && window.App && App.E && App.E.registro && App.E.registro.asuntos[a.nombre]) a.ficha = App.E.registro.asuntos[a.nombre];
    N.abrirCuadro(a, false, { restaurar: antes, comunicarHito: nuevo || undefined, hito: extraHito || undefined });
  }

  var asuntoActual = null;

  /* Fila 562: el botón del aviso de Para, Copia y Copia oculta; lleva lo escrito en la casilla. */
  function alRelacionarEscrito(texto) { if (asuntoActual) relacionar(asuntoActual, texto); }

  function enganchar(a) {
    asuntoActual = a;
    var b = $('correo-relacionar');
    if (b) b.onclick = function () { relacionar(a); };
  }

  return { enganchar: enganchar, relacionar: relacionar, alRelacionarEscrito: alRelacionarEscrito };
})();
window.CorreoRelacionar = CorreoRelacionar;
