/* ============================================================
   entrada-ajustes.js — «Carpeta de entrada de documentos sueltos»
   en Ajustes → Mantenimiento, junto a las demás carpetas
   (fila 455, docs/PASAR-A-DRIVE.md). La carpeta y sus tres casos
   viven en js/entrada.js.
   ============================================================ */
var EntradaAjustes = (function () {
  'use strict';

  async function repintarTodo() {
    if (window.App && App.pintarCarpetasDeEsteOrdenador) App.pintarCarpetasDeEsteOrdenador();
    if (window.App && App.verAbiertos) { try { await App.verAbiertos(); } catch (e) { /* ya se verá al pulsar algo */ } }
  }

  function boton(texto, ayuda, alPulsar) {
    var b = document.createElement('button');
    b.className = 'boton';
    b.textContent = texto;
    b.title = ayuda;
    b.onclick = alPulsar;
    return b;
  }

  function pintar(caja) {
    if (!caja || !window.Entrada) return;
    caja.innerHTML = '';
    var enSolo = !!(window.SoloConsulta && SoloConsulta.activo());

    var titulo = document.createElement('div');
    titulo.className = 'fila-tipo';
    titulo.innerHTML = '<span class="nombre-tipo">Carpeta de entrada de documentos sueltos</span>' +
      '<span class="suave" id="entrada-nombre"></span>';
    titulo.querySelector('#entrada-nombre').textContent = Entrada.senalada() ? Entrada.nombre() : 'La de asuntos vivos';
    caja.appendChild(titulo);

    var fila = document.createElement('div');
    fila.className = 'acciones-fila';
    fila.appendChild(boton('Señalar', 'Elige la carpeta donde el resto del centro deja los documentos', async function () {
      try {
        await Entrada.elegir();
        U.aviso('Carpeta de entrada señalada: ' + Entrada.nombre(), 'bueno');
      } catch (e) {
        if (e && e.name === 'AbortError') return;
        U.aviso('No he podido usar esa carpeta: ' + U.mensajeDeError(e), 'malo');
        return;
      }
      await repintarTodo();
    }));
    var volver = boton('Usar la de asuntos vivos', 'Vuelve a leer los documentos sueltos de la carpeta de asuntos abiertos', async function () {
      await Entrada.quitar();
      U.aviso('Los documentos sueltos se leen otra vez de la carpeta de asuntos vivos.', 'bueno');
      await repintarTodo();
    });
    volver.disabled = !Entrada.senalada();
    fila.appendChild(volver);
    if (enSolo) fila.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
    caja.appendChild(fila);

    var nota = document.createElement('p');
    nota.className = 'nota';
    nota.textContent = 'Es donde el resto del centro deja los documentos para Administración.';
    caja.appendChild(nota);
  }

  return { pintar: pintar };
})();
window.EntradaAjustes = EntradaAjustes;
