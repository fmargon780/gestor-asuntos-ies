/* ============================================================
   demo/datos-problemas.js — lo que enseña Ajustes → Problemas en la copia de pruebas (fila 291,
   docs/PROBLEMAS-CON-SU-SOLUCION.md), además del asunto sin carpeta de la fila 288
   (`crearFichaSinCarpeta` en js/demo/datos.js):
     - la carpeta que alguien le cambió de nombre a mano (sin tildes), sin asunto: la que se elige al
       «Buscar su carpeta» (fila 292: la que encaja; y otra que no encaja, para ver el orden);
     - hitos guardados de un asunto que ya no existe y, para ver que no salen dos veces, hitos
       del asunto que ha perdido su carpeta;
     - fila 292: hitos guardados bajo un nombre viejo (mismo número, otra fecha) de un asunto que SIGUE ABIERTO
       con otro nombre y no tiene hitos («Son de este asunto…» lo propone y «Pasar los hitos» los pasa; para
       «Unir los hitos», se elige cualquier asunto de los de Inicio, que ya tienen los suyos); los hitos
       del primer nombre viejo no se parecen a nada abierto, y la caja sale vacía;
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

  async function construir(tipos, sinCarpeta) {
    if (sinCarpeta) {
      var carpetaNueva = await Carpetas.crear(App.E.abiertos, sinCarpeta.replace('Ferretería Los Álamos', 'Ferreteria Los Alamos'));
      await Carpetas.escribirTexto(carpetaNueva, 'Presupuesto.txt', 'Presupuesto de la ferretería.');
      await Carpetas.escribirTexto(carpetaNueva, 'Factura 4471.txt', 'Factura de la ferretería.');
      /* Una carpeta que no encaja con nada, para ver que sale debajo. */
      var otro = Nombres.montarAsunto({
        fecha: hace(200), tipo: Nombres.tipoParaCarpeta(tipos.CERTIFICADO), categoria: 'EMPRESAS',
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
