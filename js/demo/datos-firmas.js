/* ============================================================
   demo/datos-firmas.js — la copia de pruebas de la fila 515 (tema 392, docs/515-DETECTAR-DOCUMENTOS-FIRMADOS.md).

   En el asunto de Pablo Aguilar hay cuatro documentos de prueba («Firmas: …» en el texto adicional) y, abajo a la
   derecha, una cajita «Prueba tema 392 (fuera de la app)» con lo que haría Francisco fuera de la aplicación:
   pulsar «Ruta» en un documento y guardar encima un PDF distinto. Cada botón hace las dos cosas (la copia que hace
   «Ruta» y el guardado encima) y lanza la mirada; el resultado se ve en la ficha del asunto, igual que en producción.

     - «Guardar encima el PDF firmado»        → documento 1 (sin firma antes).
     - «Guardar encima uno con más firmas»    → documento 2 (ya firmado, con 1 firma).
     - «Guardar encima el registrado en Séneca» → documento 3.
     - «Guardar encima un PDF sin firma ni sello» → documento 4 (sin firma antes).
     - «Guardar encima un PDF sin firma» sobre el 2 (firmado) → la pregunta; botón aparte «… sobre el firmado».
     - «Llega un firmado con otro nombre»      → un PDF firmado suelto en la carpeta.
   `Demo.firmas.simular(<caso>)` hace lo mismo desde un script del revisor. Nada se guarda fuera de la memoria.
   ============================================================ */
(function () {
  'use strict';
  window.Demo = window.Demo || {};

  var CASOS = {
    firmado:       { doc: 0, boton: 'Guardar encima el PDF firmado' },
    masFirmas:     { doc: 1, boton: 'Guardar encima uno con una firma más' },
    registrado:    { doc: 2, boton: 'Guardar encima el PDF registrado en Séneca' },
    sinFirmaNiSello: { doc: 3, boton: 'Guardar encima un PDF sin firma ni sello' },
    sinFirmaSobreFirmado: { doc: 1, boton: 'Guardar encima un PDF sin firma sobre el firmado' },
    otroNombre:    { doc: -1, boton: 'Llega a la carpeta un firmado con otro nombre' }
  };

  var estado = { asunto: '', docs: [] };

  function fechaDelSello() {
    var d = new Date();
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }

  async function pdf(texto, opciones) {
    var PDFLib = await PdfHerramientas.cargarPdfLib();
    var doc = await PDFLib.PDFDocument.create();
    var fuente = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
    var pagina = doc.addPage([595, 842]);
    pagina.drawText(texto + ' (copia de pruebas)', { x: 50, y: 780, size: 12, font: fuente });
    if (opciones && opciones.sello) pagina.drawText('2026/29700692/M000000000' + opciones.sello + 'ENTRADA Fecha: ' + fechaDelSello() + ' 09:30:00', { x: 50, y: 40, size: 9, font: fuente });
    var bytes = await doc.save();
    var firmas = (opciones && opciones.firmas) || 0;
    if (!firmas) return bytes;
    /* Una firma de mentira por cada /ByteRange: la app solo cuenta firmas, no las comprueba. */
    var cola = '';
    for (var i = 0; i < firmas; i++) cola += '\n% firma ' + (i + 1) + ' << /Type /Sig /Filter /Adobe.PPKLite /ByteRange [0 100 200 300] >>';
    var extra = new TextEncoder().encode(cola);
    var junto = new Uint8Array(bytes.length + extra.length);
    junto.set(bytes, 0); junto.set(extra, bytes.length);
    return junto;
  }

  async function construir(asuntoNombre, hace) {
    estado.asunto = asuntoNombre;
    var carpeta = await App.E.abiertos.getDirectoryHandle(asuntoNombre);
    var previstos = [
      { tipo: 'CERTIFICADO', firmas: 0 }, { tipo: 'INFORME', firmas: 1 }, { tipo: 'RESOLUCION', firmas: 0 }, { tipo: 'ESCRITO', firmas: 0 }
    ];
    estado.docs = [];
    for (var i = 0; i < previstos.length; i++) {
      var p = previstos[i];
      var fecha = hace(2);
      var numeroDoc = (await Numeros.reservar('documentos', '')).numero;
      var nombre = Nombres.montarDocumento({ fecha: fecha, tipo: p.tipo, extension: 'pdf', numeroDoc: numeroDoc });
      await Carpetas.escribirBytes(carpeta, nombre, await pdf('Documento ' + (i + 1) + ' de prueba de firmas', { firmas: p.firmas }), 'application/pdf');
      var datos = { tipo: p.tipo, fecha: fecha, texto: 'Firmas: documento ' + (i + 1), campos: [], valores: {}, registros: [] };
      if (p.firmas) datos.firmas = p.firmas;
      await DocumentosDatos.anotar(asuntoNombre, numeroDoc, datos);
      estado.docs.push(nombre);
    }
    poner();
  }

  function asunto() { return App.E.listaAbiertos.filter(function (x) { return x.nombre === estado.asunto; })[0]; }

  async function escribirEncima(nombre, bytes) {
    var carpeta = await App.E.abiertos.getDirectoryHandle(estado.asunto);
    var w = await (await carpeta.getFileHandle(nombre)).createWritable();
    await w.write(bytes);
    await w.close();
  }

  async function mirar() {
    for (var i = 0; i < 40 && window.ColaGuardado && ColaGuardado.hayGuardado(); i++) await new Promise(function (ok) { setTimeout(ok, 100); });
    window.dispatchEvent(new Event('focus'));
    if (window.RutaCopia) await RutaCopia.mirar();
  }

  /* Pulsar «Ruta» en el documento y guardar encima lo que toque. */
  async function simular(caso) {
    var c = CASOS[caso];
    if (!c || !estado.asunto) throw new Error('Caso desconocido: ' + caso);
    var a = asunto();
    if (caso === 'otroNombre') {
      var carpeta = await App.E.abiertos.getDirectoryHandle(estado.asunto);
      var n = 1, nombre = 'resolución firmada descargada.pdf';
      while (true) { try { await carpeta.getFileHandle(nombre); n++; nombre = 'resolución firmada descargada (' + n + ').pdf'; } catch (e) { break; } }
      await Carpetas.escribirBytes(carpeta, nombre, await pdf('Resolución firmada, descargada con otro nombre', { firmas: 1 }), 'application/pdf');
      if (window.FichaNucleo && FichaNucleo.pintarFirmas && FichaNucleo.actual === a) await FichaNucleo.pintarFirmas(a);
      return nombre;
    }
    var doc = estado.docs[c.doc];
    await RutaCopia.alCopiarRuta(a, 'abierto', { nombre: doc, subcarpeta: '' });
    var bytes;
    if (caso === 'firmado') bytes = await pdf('Documento 1 firmado', { firmas: 1 });
    else if (caso === 'masFirmas') bytes = await pdf('Documento 2 con una firma más', { firmas: 2 });
    else if (caso === 'registrado') bytes = await pdf('Documento 3 registrado', { sello: '000000' + String(Math.floor(Math.random() * 900) + 100) });
    else bytes = await pdf('Versión sin firma ni sello');
    await escribirEncima(doc, bytes);
    await mirar();
    return doc;
  }

  function poner() {
    if (document.getElementById('demo-firmas') || !/(^|[?&])firmas=1(&|$)/.test(location.search)) return;   /* solo con `&firmas=1`: no tapa nada a las demás pruebas */
    var caja = document.createElement('div');
    caja.id = 'demo-firmas';
    var t = document.createElement('strong');
    t.textContent = 'Prueba tema 392 (fuera de la app)';
    caja.appendChild(t);
    var nota = document.createElement('p');
    nota.textContent = 'En el asunto de Pablo Aguilar Ponce, con los cuatro documentos «Firmas: …». Cada botón pulsa «Ruta» y guarda encima.';
    caja.appendChild(nota);
    Object.keys(CASOS).forEach(function (caso) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'boton';
      b.setAttribute('data-caso', caso);
      b.textContent = CASOS[caso].boton;
      b.onclick = function () { b.disabled = true; simular(caso).then(function () { b.disabled = false; }, function (e) { b.disabled = false; U.fallo('No he podido simularlo', e); }); };
      caja.appendChild(b);
    });
    document.body.appendChild(caja);
  }

  window.Demo.firmas = { construir: construir, simular: simular, CASOS: CASOS, _estado: estado };
})();
