/* ============================================================
   tablon-compacto-formulario.js — el formulario de la nota nueva y pegarla, marcarla o borrarla (fila 536: trozo de js/tablon-compacto.js, que sigue
   siendo el que explica el conjunto; mismas funciones, solo cambian de
   fichero). Se carga antes de js/tablon-compacto.js.
   ============================================================ */
var TablonCompactoNucleo = TablonCompactoNucleo || {};
(function () {

  var I = TablonCompactoNucleo;
  I.S = I.S || {};
  var COLORES = I.COLORES;
  function $() { return I.$.apply(this, arguments); }
  function cambiar() { return I.cambiar.apply(this, arguments); }
  function pintar() { return I.pintar.apply(this, arguments); }
  function casillaSoloParaMi() { return I.casillaSoloParaMi.apply(this, arguments); }
  function boton() { return I.boton.apply(this, arguments); }

  /* `abierta`: con el campo cerrado, se ve solo la línea de "Escribir
     una nota…". Al pulsarlo (onfocus, más abajo) o si ya hay algo
     escrito o una fecha puesta, se abre y aparece el resto (colores,
     fecha, "Solo para mí", "Pegar la nota"), sin perder el propio
     campo (mismo id, mismo elemento lógico:
     pruebas/tablon-no-se-borra.mjs escribe directamente en
     #tablon-texto sin tener que abrir nada antes). */
  function formulario(escrito, fechaPuesta, abierta, horaPuesta, antesPuesto) {
    var caja = document.createElement('div');
    caja.className = 'tablon-nueva' + (abierta ? ' tablon-nueva-abierta' : '');

    /* Lo que haya ahora mismo pasa a ser el borrador: así, si algo de
       fuera destruye la columna sin avisar, el próximo pintado parte
       de aquí y no de un campo vacío (fila 33, 17-sep-2026). */
    I.S.borrador = escrito;
    I.S.borradorFecha = fechaPuesta;
    I.S.borradorHora = fechaPuesta ? (horaPuesta || '') : '';
    I.S.borradorAntes = typeof antesPuesto === 'number' ? antesPuesto : null;

    var texto = document.createElement('textarea');
    texto.id = 'tablon-texto';
    texto.className = 'campo';
    texto.rows = abierta ? 2 : 1;
    texto.placeholder = 'Escribir una nota…';
    texto.value = escrito;
    texto.oninput = function () { I.S.borrador = texto.value; };
    texto.onfocus = function () {
      if (I.S.notaAbierta) return;
      I.S.notaAbierta = true;
      pintar();
    };
    caja.appendChild(texto);

    if (!abierta) return caja;

    var fila = document.createElement('div');
    fila.className = 'tablon-fila';

    var colores = document.createElement('div');
    colores.className = 'tablon-colores';
    COLORES.forEach(function (col) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tablon-color color-' + col + (col === I.S.colorElegido ? ' elegido' : '');
      b.title = 'Nota de color ' + col;
      b.onclick = function () { I.S.colorElegido = col; pintar(); };
      colores.appendChild(b);
    });
    fila.appendChild(colores);

    var para = document.createElement('input');
    para.type = 'date';
    para.id = 'tablon-para';
    para.className = 'campo tablon-fecha';
    para.setAttribute('data-ayuda-clave', 'para-que-dia-es-si-tiene');
    para.value = fechaPuesta;
    fila.appendChild(para);

    caja.appendChild(fila);

    /* Fila 372: hora y «Avisar», junto al día; sin día no hay hora. */
    var horaCtl = TablonHora.controles('tablon-hora', 'tablon-antes', I.S.borradorHora, I.S.borradorAntes, function (h, a) {
      I.S.borradorHora = h; I.S.borradorAntes = a;
    });
    horaCtl.fijarFecha(fechaPuesta);
    para.onchange = function () { I.S.borradorFecha = para.value; horaCtl.fijarFecha(para.value); };
    caja.appendChild(horaCtl);

    caja.appendChild(casillaSoloParaMi('tablon-solo-mia', I.S.soloParaMi, function (valor) {
      I.S.soloParaMi = valor;
    }));

    var pegar = document.createElement('button');
    pegar.type = 'button';
    pegar.className = 'boton boton-principal tablon-pegar';
    pegar.textContent = 'Pegar la nota';
    pegar.onclick = function () { pegarNota(); };
    caja.appendChild(pegar);

    texto.onkeydown = function (ev) {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); pegarNota(); }
    };
    return caja;
  }

  function pegarNota() {
    var campo = $('tablon-texto');
    var texto = (campo.value || '').trim();
    if (!texto) { campo.focus(); return; }
    var campoFecha = $('tablon-para');
    var para = campoFecha ? (campoFecha.value || '') : '';
    var campoHora = $('tablon-hora'), campoAntes = $('tablon-antes');
    var hora = para && campoHora ? (campoHora.value || '') : '';
    var antes = hora && campoAntes ? Number(campoAntes.value) : (hora ? Tablon.ANTES_DE_FABRICA : 0);
    var quien = Tablon.quienSoy();
    var privada = I.S.soloParaMi;
    campo.value = '';
    if (campoFecha) campoFecha.value = '';
    I.S.borrador = '';
    I.S.borradorFecha = '';
    I.S.borradorHora = '';
    I.S.borradorAntes = null;
    I.S.notaAbierta = false;
    cambiar(function (lista) {
      var nota = {
        id: 'n' + Date.now() + Math.floor(Math.random() * 1000),
        texto: texto, color: I.S.colorElegido, autor: quien,
        creado: new Date().toISOString(), para: para, privada: privada,
        hora: hora, antes: antes, atendido: [],
        hecha: false, hechaPor: '', hechaEl: ''
      };
      darPorAtendidoSiPasado(nota);
      lista.push(nota);
      return lista;
    });
  }

  /* Fila 372, decisión 9: una nota que nace (o cambia) con su aviso ya
     pasado la da por atendida quien la escribe; a los demás les sale. */
  function darPorAtendidoSiPasado(nota) {
    var aviso = Tablon.momentoAviso(nota), quien = Tablon.quienSoy();
    if (aviso && quien && aviso.getTime() <= TablonAvisos.ahora().getTime()) {
      nota.atendido.push({ q: quien, m: Tablon.claveAviso(nota) });
    }
  }

  /* ---------- marcar hecha y borrar: comunes al papel entero (dentro
     del overlay) y a la fila compacta ---------- */

  function marcarHecha(n) {
    var quien = Tablon.quienSoy();
    cambiar(function (lista) {
      lista.forEach(function (x) {
        if (x.id !== n.id) return;
        x.hecha = true; x.hechaPor = quien; x.hechaEl = new Date().toISOString();
      });
      return lista;
    });
  }

  /* Desde el 11-sep-2026 esto pasa por la papelera, igual que lo demás:
     se puede devolver desde Ajustes › Papelera. */
  async function borrarNota(n) {
    if (!window.Papelera) return;
    var ok = await window.Papelera.preguntarBorrar(n.texto);
    if (!ok) return;
    try {
      await window.Papelera.mandarDato('nota-tablon', n.texto, null, n);
      await cambiar(function (lista) {
        return lista.filter(function (x) { return x.id !== n.id; });
      });
    } catch (e) {
      U.aviso('No he podido mandarla a la papelera: ' + U.mensajeDeError(e), 'malo');
    }
  }

  /* ---------- cada papel (dentro del overlay) ---------- */

  I.formulario = formulario;
  I.darPorAtendidoSiPasado = darPorAtendidoSiPasado;
  I.marcarHecha = marcarHecha;
  I.borrarNota = borrarNota;
})();
