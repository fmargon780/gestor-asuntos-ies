/* ============================================================
   grupo-generar.js — «Generar para todos»: la muestra, la barra, el PDF de cada persona
   y «Volver a generar» (fila 294, docs/TRABAJO-EN-BLOQUE-PDF-Y-REGISTRO.md).

   Lo llama js/generar-para-relacionados.js (`GenerarParaRelacionados.generar`) en tres sitios:
     - `muestra`: antes de hacer N documentos, el de la primera persona en el visor de Word, sin guardarlo,
       con una franja y los botones «Generar los N» y «Cancelar».
     - `barra`: «Generando 12 de 30…» con «Parar». «Parar» termina el que está a medias y no empieza otro.
     - `hacerPdf`: el PDF de cada Word, con el mismo nombre, sin enseñar el visor (`WordVisor.pdfDe`) y con su
       número de documento escrito como texto («Ref. D26-01234»): es lo que deja saber, al volver sellado de
       Séneca, de quién es (js/grupo-registro.js).
   `ordenar` manda a «Versiones previas» los Word que ya tienen su PDF. `volverAGenerar`: papelera y de nuevo.
   ============================================================ */
var GrupoGenerar = (function () {

  /* ---------- la muestra ---------- */

  function muestra(blob, persona, n) {
    return new Promise(function (resolver) {
      var resuelto = false;
      function fin(valor) { if (resuelto) return; resuelto = true; resolver(valor); }
      (async function () {
        await WordVisor.abrir({ blob: blob, nombre: 'Muestra · ' + persona, alCerrar: function () { fin(false); } });
        var f = WordVisor.franja('Así queda el de ' + persona + '. Se van a hacer ' + n + ' iguales, uno por persona.');
        if (!f) { fin(false); return; }
        f.classList.add('franja-muestra');
        var cajaBotones = document.createElement('span');
        cajaBotones.className = 'franja-botones';
        cajaBotones.innerHTML = '<button type="button" class="boton boton-principal boton-chico muestra-generar">Generar los ' + n + '</button>' +
          '<button type="button" class="boton boton-chico muestra-cancelar">Cancelar</button>';
        f.appendChild(cajaBotones);
        cajaBotones.querySelector('.muestra-generar').onclick = function () { fin(true); WordVisor.cerrar(); };
        cajaBotones.querySelector('.muestra-cancelar').onclick = function () { fin(false); WordVisor.cerrar(); };
      })().catch(function () { fin(false); });
    });
  }

  /* ---------- la barra «Generando 12 de 30…» ---------- */

  function barra(total) {
    var el = document.createElement('div');
    el.id = 'grupo-barra';
    el.className = 'grupo-barra';
    el.innerHTML = '<span class="grupo-barra-texto">Generando 0 de ' + total + '…</span>' +
      '<button type="button" class="boton boton-chico grupo-barra-parar">Parar</button>';
    var parado = false;
    el.querySelector('.grupo-barra-parar').onclick = function (ev) {
      parado = true;
      ev.currentTarget.disabled = true;
      el.querySelector('.grupo-barra-texto').textContent = 'Parando…';
    };
    document.body.appendChild(el);
    return {
      avanzar: function (i) { if (!parado) el.querySelector('.grupo-barra-texto').textContent = 'Generando ' + i + ' de ' + total + '…'; },
      parado: function () { return parado; },
      quitar: function () { el.remove(); }
    };
  }

  /* ---------- el PDF de cada uno ---------- */

  /* Hace el PDF del Word `blob` y lo guarda junto a él, con su nombre. Devuelve el nombre del PDF. */
  async function hacerPdf(a, nombreWord, blob, numeroDoc) {
    var pdf = await WordVisor.pdfDe(blob, { referencia: numeroDoc ? 'Ref. ' + numeroDoc : '' });
    var nombrePdf = WordVisor.nombrePdf(nombreWord);
    await Carpetas.escribirBytes(a.handle, nombrePdf, new Uint8Array(await pdf.arrayBuffer()), 'application/pdf');
    return nombrePdf;
  }

  /* Un Word que ya estaba en la carpeta sin su PDF (se paró a medias): solo se le hace el PDF. */
  async function soloElPdf(a, nombreWord) {
    var fichero = await (await a.handle.getFileHandle(nombreWord)).getFile();
    return hacerPdf(a, nombreWord, fichero, window.Numeros ? Numeros.delNombreDeDocumento(nombreWord) : '');
  }

  /* Cada Word con su PDF a «Versiones previas», y la lista de documentos de la ficha, al día. */
  async function ordenar(a) {
    if (window.VersionesPrevias) await VersionesPrevias.ordenarTrasCambio(a.handle);
    if (window.FichaDocumentos && window.App && App.fichaAbierta && App.fichaAbierta() === a.nombre) {
      try { FichaDocumentos.pintar(a); } catch (e) { /* solo pintar */ }
    }
  }

  /* ---------- «Volver a generar» ---------- */

  /* Los ficheros de ese documento (número) en la carpeta y en «Versiones previas». */
  async function ficherosDe(a, numero) {
    var lista = (await Carpetas.ficheros(a.handle)).map(function (f) { return f.nombre; });
    var propios = lista.filter(function (n) { return n.indexOf(numero) !== -1; });
    if (window.VersionesPrevias) {
      var previas = [];
      try { previas = (await VersionesPrevias.listar(a.handle)).map(function (f) { return f.nombre; }); } catch (e) { previas = []; }
      for (var i = 0; i < previas.length; i++) {
        if (previas[i].indexOf(numero) === -1) continue;
        try { propios.push(await VersionesPrevias.sacar(a.handle, previas[i])); } catch (e1) { /* ese se queda */ }
      }
    }
    return propios;
  }

  /* Manda su Word y su PDF a la papelera y los hace de nuevo. Devuelve si lo ha hecho. */
  async function volverAGenerar(a, rel, hito, plantillaId, numero) {
    var datos = await Plantillas.cargar(App.E.gestor);
    var plantilla = (datos.documentos || []).filter(function (d) { return (d.id || d.nombre || d.tipoDocumento) === plantillaId; })[0];
    if (!plantilla) { U.aviso('Ya no encuentro la plantilla con la que se hizo.', 'ambar'); return false; }
    var persona = String(rel.nombre).replace(/\s+\S*\d\S*\s*$/, '').trim() || rel.nombre;
    var ok = await U.preguntar('Volver a generar',
      '<p>El documento de <strong>' + U.escapar(persona) + '</strong> (su Word y su PDF) irá a la papelera y se hará de nuevo.</p>', 'Volver a generar');
    if (!ok) return false;
    var nombres = await ficherosDe(a, numero);
    for (var i = 0; i < nombres.length; i++) {
      try { await Papelera.mandarDocumentoDeAsunto(a, nombres[i]); }
      catch (e) { U.aviso('No he podido mandar a la papelera «' + nombres[i] + '»: ' + U.mensajeDeError(e), 'malo'); return false; }
    }
    await GenerarParaRelacionados.generar(a, plantilla, hito, { soloA: rel });
    return true;
  }

  return { muestra: muestra, barra: barra, hacerPdf: hacerPdf, soloElPdf: soloElPdf, ordenar: ordenar, volverAGenerar: volverAGenerar };
})();
window.GrupoGenerar = GrupoGenerar;
