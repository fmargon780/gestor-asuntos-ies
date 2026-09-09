/* ============================================================
   via-contacto.js — el teléfono o el correo, a un clic.

   Al elegir por dónde prefiere que le hablemos, debajo aparece un
   recuadro para apuntar el dato de contacto. Escribirlo a mano es
   lento y se cuela algún número.

   Aquí se sacan los datos que ya están en el fichero del alumnado o
   del personal y se ofrecen como botones: se pulsa el que toque y el
   recuadro se rellena solo. Si eliges Teléfono salen los teléfonos;
   si eliges Correo, los correos. Sigue pudiéndose escribir a mano
   cualquier otra cosa: el recuadro no se bloquea.

   Funciona en los dos sitios donde se elige la vía: al crear un
   asunto y en el botón de la vía de un asunto que ya existe.
   ============================================================ */
(function () {

  function $(id) { return document.getElementById(id); }

  /* ---------- de dónde salen los datos ---------- */

  function esTelefono(titulo) { return /tel[eé]fono|m[oó]vil/i.test(titulo || ''); }
  function esCorreo(titulo) { return /correo|e-?mail/i.test(titulo || ''); }

  /* Las filas de contacto de un tercero, con su rótulo: "Tutor 1 ·
     Teléfono", "Correo de contacto"... Se leen del mismo fichero que
     usa la pantalla de Personas. */
  async function filasDeContacto(categoria, quien) {
    if (!categoria || !quien || !App.E.datos) return [];
    try {
      var fuente = await Datos.cargar(App.E.datos, categoria);
      var encontrados = Datos.buscar(fuente.lista, quien, 1);
      if (!encontrados.length) {
        encontrados = Datos.buscar(fuente.lista, quien.replace(/[\s\d]+$/, ''), 1);
      }
      if (!encontrados.length) return [];

      var persona = encontrados[0];
      if (categoria === 'ALUMNADO') return Datos.destacadosAlumno(persona).destacados;
      if (categoria === 'PERSONAL') return Datos.destacadosPersona(persona).destacados;
      return Object.keys(persona.campos || {}).map(function (c) {
        return { titulo: c, valor: persona.campos[c] };
      });
    } catch (e) {
      return [];
    }
  }

  /* Las que valen para la vía elegida. */
  function paraLaVia(filas, via) {
    var sirve = via === 'TELEFONO' ? esTelefono : (via === 'CORREO' ? esCorreo : null);
    if (!sirve) return [];
    var vistos = {};
    return filas.filter(function (f) {
      if (!f || !f.valor || !sirve(f.titulo)) return false;
      var clave = U.normalizar(f.valor);
      if (vistos[clave]) return false;      /* el mismo número dos veces, no */
      vistos[clave] = true;
      return true;
    }).slice(0, 6);
  }

  /* ---------- los botones ---------- */

  function pintarBotones(caja, filas, campoDato) {
    caja.innerHTML = '';
    if (!filas.length) { caja.classList.add('oculto'); return; }
    caja.classList.remove('oculto');

    var rotulo = document.createElement('span');
    rotulo.className = 'via-rotulo';
    rotulo.textContent = 'De su ficha:';
    caja.appendChild(rotulo);

    filas.forEach(function (f) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton via-sugerencia';
      b.textContent = f.valor;
      b.title = f.titulo + ' · pulsa para ponerlo';
      b.onclick = function () {
        campoDato.value = f.valor;
        campoDato.focus();
      };
      caja.appendChild(b);
    });
  }

  async function refrescar(caja, campoDato, categoria, quien, via) {
    if (!caja || !campoDato) return;
    if (!via || (via !== 'TELEFONO' && via !== 'CORREO')) {
      caja.innerHTML = '';
      caja.classList.add('oculto');
      return;
    }
    var filas = await filasDeContacto(categoria, quien);
    pintarBotones(caja, paraLaVia(filas, via), campoDato);
  }

  function cajaDebajo(campoDato, id) {
    var caja = $(id);
    if (caja && caja.parentNode) return caja;
    caja = document.createElement('div');
    caja.id = id;
    caja.className = 'via-sugerencias oculto';
    campoDato.parentNode.insertBefore(caja, campoDato.nextSibling);
    return caja;
  }

  /* ---------- al crear un asunto ---------- */

  (function () {
    var campoVia = $('campo-via');
    var campoDato = $('campo-via-dato');
    if (!campoVia || !campoDato) return;

    var caja = null;

    function mirar() {
      if (!caja) caja = cajaDebajo(campoDato, 'via-sugerencias-nuevo');
      var persona = App.E.nuevo.tercero;
      var categoria = App.E.nuevo.categoria;
      var quien = persona ? App.textoTercero(persona) : '';
      refrescar(caja, campoDato, categoria, quien, campoVia.value);
    }

    campoVia.addEventListener('change', mirar);

    /* Al cambiar de tercero o de tipo se repinta la vista previa: es
       buen momento para repasar también las sugerencias. */
    var comoEra = App.refrescarVista;
    App.refrescarVista = function () {
      comoEra();
      try { mirar(); } catch (e) { /* nunca estorba */ }
    };
  })();

  /* ---------- en el cuadro de la vía de un asunto ya creado ----------

     El cuadro lo monta la aplicación; aquí solo se le añaden los
     botones cuando ya está en pantalla. */

  (function () {
    var comoEra = App.editarVia;
    App.editarVia = function (a) {
      var promesa = comoEra(a);
      setTimeout(function () {
        var select = $('via-clave');
        var campoDato = $('via-dato');
        if (!select || !campoDato) return;

        var caja = cajaDebajo(campoDato, 'via-sugerencias-cuadro');
        var categoria = (a.ficha && a.ficha.categoria) || (a.leido && a.leido.categoria) || '';
        var quien = (a.ficha && a.ficha.tercero) ||
                    (a.leido && a.leido.resto ? Nombres.terceroDeResto(a.leido.resto) : '');

        function mirar() { refrescar(caja, campoDato, categoria, quien, select.value); }
        select.addEventListener('change', mirar);
        mirar();
      }, 0);
      return promesa;
    };
  })();

})();
