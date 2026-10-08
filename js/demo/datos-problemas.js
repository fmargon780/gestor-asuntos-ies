/* ============================================================
   demo/datos-problemas.js — lo que enseña Ajustes → Problemas en la copia de pruebas (fila 291,
   docs/PROBLEMAS-CON-SU-SOLUCION.md), además del asunto sin carpeta de la fila 288
   (`crearFichaSinCarpeta` en js/demo/datos.js):
     - la carpeta que alguien le cambió de nombre a mano (sin tildes y con el tipo en plural), sin asunto: la que se elige al
       «Buscar su carpeta» (fila 292: la que encaja; y otra que no encaja, para ver el orden);
     - hitos guardados de un asunto que ya no existe y, para ver que no salen dos veces, hitos
       del asunto que ha perdido su carpeta;
     - fila 292: hitos guardados bajo un nombre viejo (mismo número, otra fecha) de un asunto que SIGUE ABIERTO
       con otro nombre y no tiene hitos («Son de este asunto…» lo propone y «Pasar los hitos» los pasa; para
       «Unir los hitos», se elige cualquier asunto de los de Inicio, que ya tienen los suyos); los hitos
       del primer nombre viejo no se parecen a nada abierto, y la caja sale vacía;
     - fila 303: tres asuntos que han perdido su carpeta, además del de la fila 288: uno cuya carpeta está en el ARCHIVO,
       en la de su persona, con el tipo abreviado y su `_ficha.json` con una nota propia; otro cuya carpeta no está en
       ningún sitio; y una carpeta archivada de otra persona, para encontrarla escribiendo. La de la fila 288 es la que
       está en asuntos abiertos con otro nombre y sin asunto;
     - un asunto que se repite y toca crearlo, y una aspirante sin Nº de identificación escolar (los dos
       avisos de Inicio de la fila 292);
     - una lista guardada a la vez en dos ordenadores (la de tipos de documento), con dos diferencias;
     - lo que la app recuerda de lo borrado («Borrados que se fusionan»);
     - el fichero de alumnado de hace tres meses;
     - un script de Gmail visto con una versión anterior (en la demostración, «Probar» lo deja al día);
     - el contacto de los asuntos abiertos ya guardado, para que «Problemas» enseñe solo lo que se quiere.
   Todo inventado. Lo llama `Demo.datos.construir` (js/demo/datos.js) con los tipos ya creados.
   ============================================================ */
(function () {
  'use strict';

  function hace(dias) {
    var d = new Date(Date.now() - dias * 86400000);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }


  /* Fila 303: asuntos perdidos cuya carpeta está en el ARCHIVO, o en ningún sitio, y una carpeta archivada para buscar. */
  async function construirPerdidas() {
    function hito(id, titulo, estado) {
      return Hitos.normalizarHito({ id: id, titulo: titulo, estado: estado, clase: 'paso', desde: hace(20) });
    }
    var ahora = new Date().toISOString();

    /* 1. Perdido: su carpeta está en el ARCHIVO, en la de su persona, con el tipo escrito abreviado. */
    var lucas = Nombres.terceroAlumno({ nombre: 'Navarro Pons, Lucas', id: '2100123' });
    var perdido = Nombres.montarAsunto({
      fecha: hace(33), tipo: 'TRASLADO MATR VIVA', categoria: 'ALUMNADO', curso: '26-27', grupo: '', campos: [], descripcion: '', tercero: lucas, numero: ''
    }).nombre;
    var archivado = Nombres.montarAsunto({
      fecha: hace(33), tipo: 'TRAS. MATR. VIVA', categoria: 'ALUMNADO', curso: '26-27', grupo: '', campos: [], descripcion: '', tercero: lucas, numero: ''
    }).nombre;
    var carpetaPersona = await Carpetas.bajar(App.E.archivo, ['ALUMNADO', lucas], true);
    var carpetaArchivada = await Carpetas.crear(carpetaPersona, archivado);
    await Carpetas.escribirTexto(carpetaArchivada, 'Solicitud de traslado.txt', 'Solicitud de traslado de matrícula viva.');
    await FichaArchivo.escribir(carpetaArchivada, {
      estado: 'cerrado', tipo: 'TRAS. MATR. VIVA', categoria: 'ALUMNADO', tercero: lucas,
      abiertoEl: hace(33) + 'T09:00:00.000Z', cerradoEl: hace(30) + 'T12:00:00.000Z',
      notas: [{ texto: 'Nota de la carpeta archivada: llegó el traslado.', cuando: hace(31) + 'T10:00:00.000Z', quien: 'Revisor' }]
    });

    /* 3. Perdido: su carpeta no está en ningún sitio. */
    var mateo = Nombres.terceroAlumno({ nombre: 'Rubio Luna, Mateo', id: '2100456' });
    var sinNada = Nombres.montarAsunto({
      fecha: hace(22), tipo: 'JUSTIFICACION AUSENCIA', categoria: 'ALUMNADO', curso: '26-27', grupo: '', campos: [], descripcion: '', tercero: mateo, numero: ''
    }).nombre;

    /* 4. Una carpeta archivada de otra persona, para encontrarla escribiendo. */
    var noelia = Nombres.terceroAlumno({ nombre: 'Santos Gil, Noelia', id: '2100777' });
    var otra = Nombres.montarAsunto({
      fecha: hace(60), tipo: 'CONVALIDACION', categoria: 'ALUMNADO', curso: '26-27', grupo: '', campos: [], descripcion: '', tercero: noelia, numero: ''
    }).nombre;
    var carpetaNoelia = await Carpetas.bajar(App.E.archivo, ['ALUMNADO', noelia], true);
    var cn = await Carpetas.crear(carpetaNoelia, otra);
    await FichaArchivo.escribir(cn, {
      estado: 'cerrado', tipo: 'CONVALIDACION', categoria: 'ALUMNADO', tercero: noelia,
      abiertoEl: hace(60) + 'T09:00:00.000Z', cerradoEl: hace(58) + 'T09:00:00.000Z', notas: []
    });

    await App.guardarRegistroFresco(function (registro) {
      registro.asuntos[perdido] = {
        estado: 'abierto', tipo: 'TRASLADO MATR VIVA', categoria: 'ALUMNADO', tercero: lucas,
        descripcion: '', abiertoEl: hace(33) + 'T09:00:00.000Z', abiertoPor: App.E.usuario || 'Revisor',
        notas: [{ texto: 'Nota del asunto perdido: se pidió el traslado.', cuando: hace(32) + 'T09:30:00.000Z', quien: 'Revisor' }]
      };
      registro.asuntos[sinNada] = {
        estado: 'abierto', tipo: 'JUSTIFICACION AUSENCIA', categoria: 'ALUMNADO', tercero: mateo,
        descripcion: '', abiertoEl: hace(22) + 'T09:00:00.000Z', abiertoPor: App.E.usuario || 'Revisor', notas: []
      };
    });
    await Hitos.cambiar(function (d) {
      d.porAsunto[perdido] = { creados: hace(33), hitos: [hito('demo-p303-1', 'Recibir la solicitud', 'hecho'), hito('demo-p303-2', 'Enviar el expediente al otro centro', 'encurso')] };
      return d;
    });
    /* El índice del ARCHIVO, con las dos carpetas nuevas. */
    if (window.IndiceArchivo) {
      var construido = await IndiceArchivo.construir();
      await IndiceArchivo.guardar(construido);
    }
    return { perdido: perdido, archivado: archivado, sinNada: sinNada, otra: otra };
  }

  async function construir(tipos, sinCarpeta) {
    if (sinCarpeta) {
      var carpetaNueva = await Carpetas.crear(App.E.abiertos, sinCarpeta.replace(' FACTURA ', ' FACTURAS ').replace('Ferretería Los Álamos', 'Ferreteria Los Alamos'));
      await Carpetas.escribirTexto(carpetaNueva, 'Presupuesto.txt', 'Presupuesto de la ferretería.');
      await Carpetas.escribirTexto(carpetaNueva, 'Factura 4471.txt', 'Factura de la ferretería.');
      /* Una carpeta que no encaja con nada, para ver que sale debajo. */
      var otro = Nombres.montarAsunto({
        fecha: hace(25), tipo: 'COMPRA', categoria: 'EMPRESAS',
        curso: '', grupo: '', campos: [], descripcion: '', tercero: Nombres.terceroEmpresa({ nombre: 'Taller Ruiz', nif: '99887766X' }), numero: ''
      }).nombre;
      var carpetaOtra = await Carpetas.crear(App.E.abiertos, otro);
      await Carpetas.escribirTexto(carpetaOtra, 'Certificado.txt', 'Un certificado cualquiera.');
    }
    /* Fila 292: un asunto abierto, con número y sin hitos, cuyos hitos quedaron guardados con su nombre de antes. */
    var terceroSol = Nombres.terceroEmpresa({ nombre: 'Imprenta Sol', nif: '22334455C' });
    /* De un tipo sin guía (PEDIDO), para que nadie le monte hitos solo: así recibe los hitos «tal cual». */
    var vivoSol = Nombres.montarAsunto({
      fecha: hace(30), tipo: 'PEDIDO', categoria: 'EMPRESAS',
      curso: '', grupo: '', campos: [], descripcion: '', tercero: terceroSol, numero: 'A26-0888'
    }).nombre;
    var viejoSol = Nombres.montarAsunto({
      fecha: hace(95), tipo: 'PEDIDO', categoria: 'EMPRESAS',
      curso: '', grupo: '', campos: [], descripcion: '', tercero: terceroSol, numero: 'A26-0888'
    }).nombre;
    await Carpetas.crear(App.E.abiertos, vivoSol);
    /* La puesta al día de una sola vez (js/estado-migracion.js) montaría hitos a todo asunto abierto sin ellos. */
    if (window.EstadoMigracion) await Carpetas.guardarJson(App.E.gestor, EstadoMigracion.MARCA, { hechoEl: U.ahora(), hechoPor: 'Demostración', creados: 0, enEspera: 0 });
    await App.guardarRegistroFresco(function (registro) {
      registro.asuntos[vivoSol] = {
        estado: 'abierto', tipo: 'PEDIDO', categoria: 'EMPRESAS', tercero: terceroSol, numero: 'A26-0888',
        descripcion: '', abiertoEl: hace(30) + 'T09:00:00.000Z', abiertoPor: App.E.usuario || 'Revisor', notas: []
      };
    });
    var tercero = Nombres.terceroEmpresa({ nombre: 'Papelería Nova', nif: '11223344B' });
    var viejo = Nombres.montarAsunto({
      fecha: hace(150), tipo: Nombres.tipoParaCarpeta(tipos.FACTURA), categoria: 'EMPRESAS',
      curso: '', grupo: '', campos: [], descripcion: '', tercero: tercero, numero: ''
    }).nombre;
    function hito(id, titulo, estado) {
      return Hitos.normalizarHito({ id: id, titulo: titulo, estado: estado, clase: 'paso', desde: hace(40) });
    }
    await Hitos.cambiar(function (d) {
      d.porAsunto[viejo] = { creados: hace(150), hitos: [hito('demo-viejo-1', 'Pedir la factura', 'hecho'), hito('demo-viejo-2', 'Pagar la factura', 'encurso')] };
      d.porAsunto[viejoSol] = { creados: hace(95), hitos: [hito('demo-sol-1', 'Pedir presupuesto', 'hecho'), hito('demo-sol-2', 'Encargar la impresión', 'encurso'), hito('demo-sol-3', 'Pagar la factura', 'pendiente')] };
      if (sinCarpeta) d.porAsunto[sinCarpeta] = { creados: hace(40), hitos: [hito('demo-sc-1', 'Recibir la factura', 'encurso')] };
      return d;
    });
    /* La otra versión de la lista de tipos de documento: sin uno de los de aquí y con uno que aquí no está. */
    var tiposDoc = (App.E.tiposDocumento || []).slice();
    var otraVersion = tiposDoc.filter(function (x) { return x !== tiposDoc[2]; }).concat(['Informe de la Inspección']);
    var nombreConflicto = 'tipos-documento (copia en conflicto de PC-Secretaría 2026-10-05).json';
    await Carpetas.escribirTexto(App.E.gestor, nombreConflicto, JSON.stringify(otraVersion));
    try { (await App.E.gestor.getFileHandle(nombreConflicto))._modificado = Date.now() - 2 * 86400000; } catch (e) { /* sin fecha */ }
    /* Lo que la app recuerda de lo borrado (Herramientas → «Borrados que se fusionan»). */
    if (window.Borrados) {
      await Borrados.marcar(App.E.gestor, 'tiposDocumento', 'Certificado antiguo');
      await Borrados.marcar(App.E.gestor, 'estados', 'Pendiente de firma');
    }
    if (window.Conflictos) await Conflictos.revisar();
    try { (await App.E.datos.getFileHandle('RegAlum.csv'))._modificado = Date.now() - 90 * 86400000; } catch (e) { /* sin fichero, ya sale «falta» */ }
    /* Fila 292: dos avisos de Inicio — un asunto que se repite y toca crearlo, y una aspirante sin Nº de identificación escolar. */
    await Carpetas.guardarJson(App.E.gestor, 'recurrentes.json', [{
      id: 'demo-rec-1', tipo: 'FACTURA', categoria: 'EMPRESAS', tercero: 'Copistería Central 99887766X',
      periodo: 'mensual', dia: 1, ultima: hace(40), parado: false
    }]);
    if (window.Recurrentes && Recurrentes._cargar) await Recurrentes._cargar();
    if (window.Datos && Datos.anadirALista) await Datos.anadirALista(App.E.datos, 'ALUMNADO', { 'Nombre': 'Quintana Vega, Elena' });
    if (window.Frescura) await Frescura.repasar();
    if (window.CorreoEnviar) CorreoEnviar._registrarVersionScript('20-sep-2026 · fila 180');
    await construirPerdidas();   /* fila 303: antes de rellenar el contacto, para que sus asuntos también lo lleven */
    try {
      if (window.ContactoMigracion) await ContactoMigracion._rellenarTodos();
      await App.guardarRegistroFresco(function (registro) {
        Object.keys(registro.asuntos).forEach(function (k) {
          var f = registro.asuntos[k];
          if (f.estado === 'abierto' && !f.contacto && f.categoria && f.tercero) f.contacto = Datos.fotoDeContacto({ nombre: f.tercero }, f.categoria);
        });
      });
    } catch (e) { /* si no se puede, sale su tarjeta */ }
    /* Ya montado todo: las tarjetas, calculadas a la fuerza (el cálculo de fondo espera a que no haya guardados). */
    if (window.Problemas) await Problemas.calcular({ forzar: true });
  }

  window.Demo = window.Demo || {};
  window.Demo.problemas = { construir: construir };
})();
