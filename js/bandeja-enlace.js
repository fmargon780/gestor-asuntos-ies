/* ============================================================
   bandeja-enlace.js — elegir a mano el asunto de destino de un correo.

   La bandeja (js/bandeja-correos.js) adivina sola el asunto de dos
   maneras: por la huella del hilo, y por el texto del asunto. Cuando
   no acierta —o cuando acierta mal—, hasta ahora la única salida era
   crear un asunto nuevo, y acababan naciendo carpetas repetidas para
   la misma gestión.

   Aquí está el botón "Elegir asunto" de cada tarjeta. El cuadro que
   abre es el de js/elegir-asunto.js, el mismo que usa "Por clasificar"
   para meter un documento suelto en un asunto: la lista completa, el
   buscador y las filas son comunes. Lo único propio de aquí es la
   puntuación de "Podrían encajar", porque de un correo se sabe mucho
   más que de un fichero suelto.

   CÓMO SE MIDE EL PARECIDO

     +50  el correo del remitente (o alguna dirección del hilo) es la
          de una persona que es el tercero del asunto, o uno de sus
          terceros relacionados.
     +40  el nombre del tercero del asunto (apellidos y nombre, en
          cualquier orden) aparece en el asunto del correo o en su texto.
     +10  por cada palabra de cuatro letras o más del asunto del correo
          que aparezca en el nombre del asunto.
     +15  el asunto está abierto.
     +10  el asunto se creó o se movió en los últimos 30 días.

   Se enseñan los que pasen de 40 puntos, de mayor a menor.
   ============================================================ */
(function () {

  var E = window.ElegirAsunto;

  /* Palabras que no dicen nada de qué va el correo. Sin esto,
     "Solicitud para el alumno" puntuaría por "para". */
  var VACIAS = ['para', 'sobre', 'desde', 'con', 'los', 'las', 'del', 'que',
                'una', 'uno', 'por', 'como', 'este', 'esta', 'esto', 'esos',
                'pero', 'mas', 'sus', 'nos', 'ante', 'tras', 'hacia', 'entre',
                'cuando', 'porque', 'asunto', 'correo', 'buenos', 'buenas',
                'dias', 'tardes', 'hola', 'gracias', 'saludos', 'adjunto',
                'envio', 'respuesta', 'mensaje', 'cordial', 'atentamente'];

  function sinElRe(texto) {
    return (window.Bandeja && window.Bandeja.sinElRe)
      ? window.Bandeja.sinElRe(texto)
      : String(texto || '');
  }

  /* ==========================================================
     LA PUNTUACIÓN
     ========================================================== */

  function palabrasDelCorreo(d) {
    return U.normalizar(sinElRe((d && d.asunto) || ''))
      .split(/[^a-z0-9ñ]+/)
      .filter(function (p) { return p.length >= 4 && VACIAS.indexOf(p) === -1; });
  }

  /* Los nombres de tercero que salen de las direcciones del correo. */
  async function tercerosDelCorreo(d) {
    var salida = [];
    try {
      var personas = await window.Bandeja.personasDelCorreo(d);
      personas.forEach(function (p) {
        var n = U.normalizar(App.textoTercero(p));
        if (n && salida.indexOf(n) === -1) salida.push(n);
      });
    } catch (e) { /* sin CSV se puntúa igual, solo que sin el +50 */ }
    return salida;
  }

  function puntuarUno(nombre, ficha, palabras, texto, suyos) {
    var puntos = 0;

    /* +50: la dirección del correo es la del tercero del asunto, o la
       de alguno de sus relacionados. */
    if (suyos.length) {
      var candidatos = [U.normalizar(ficha.tercero || '')];
      (ficha.relacionados || []).forEach(function (r) {
        candidatos.push(U.normalizar((r && r.nombre) || ''));
      });
      var acierta = candidatos.some(function (c) {
        return c && suyos.indexOf(c) !== -1;
      });
      if (acierta) puntos += 50;
    }

    /* +40: el nombre del tercero, escrito dentro del correo. */
    if (E.terceroDentroDe(ficha, texto)) puntos += 40;

    /* +10 por palabra del asunto del correo que esté en el nombre. */
    puntos += E.puntosPorPalabras(palabras, nombre);

    /* +15 abierto, +10 movido hace poco. */
    puntos += E.puntosDeBase(nombre, ficha);

    return puntos;
  }

  async function podrianEncajar(d) {
    var palabras = palabrasDelCorreo(d);
    var texto = U.normalizar((d.asunto || '') + ' ' + (d.texto || ''));
    var suyos = await tercerosDelCorreo(d);

    return E.mejores(E.todos().map(function (x) {
      return { nombre: x.nombre, ficha: x.ficha,
               puntos: puntuarUno(x.nombre, x.ficha, palabras, texto, suyos) };
    }));
  }

  /* ==========================================================
     LO QUE LLAMA LA TARJETA
     ========================================================== */

  App.elegirAsuntoDelCorreo = async function (item) {
    var d = item.datos;
    var sugeridos = [];
    try { sugeridos = await podrianEncajar(d); } catch (e) { sugeridos = []; }

    var elegido = await E.elegir({
      titulo: 'Elegir el asunto de este correo',
      cabecera: '<p class="explica">' + U.escapar(sinElRe(d.asunto || '(sin asunto)')) +
                '<br><span class="suave">de ' +
                U.escapar((d.de && (d.de.nombre || d.de.correo)) || 'remitente desconocido') +
                '</span></p>',
      sugeridos: sugeridos
    });
    if (!elegido) return;

    if (!E.estaArchivado(elegido.ficha)) {
      await window.Bandeja.guardarEnAsunto(item, elegido);
      return;
    }

    var que = await E.preguntarSiReabrir(elegido, {
      explica: '<p>Una respuesta casi siempre quiere decir que la gestión ha vuelto a ' +
               'moverse.</p>',
      reabrir: 'Reabrir y guardar aquí',
      sinReabrir: 'Guardar sin reabrir'
    });
    if (que === 'reabrir') await window.Bandeja.reabrirYGuardar(item, elegido);
    else if (que === 'guardar') await window.Bandeja.guardarEnAsunto(item, elegido);
  };

  /* Para las pruebas: la puntuación se puede mirar sin abrir nada. */
  App.parecidoDelCorreo = podrianEncajar;

})();
