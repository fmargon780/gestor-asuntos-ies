/* ============================================================
   demo/datos-actividades.js — actividades extraescolares (fila 306,
   docs/ACTIVIDADES-EXTRAESCOLARES.md) en la copia de pruebas:
     - el tipo ACTIVIDAD EXTRAESCOLAR, con su marca `actividades`;
     - una actividad PREVISTA (dentro de nueve días): un asunto abierto, dos unidades
       (2º B y 3º A), ocho alumnos y tres profesores, uno de ellos «Organiza»;
     - una REALIZADA (fecha pasada) y una ANULADA, también con su asunto.
   Fila 309: y el grupo «Profesorado» (cuatro personas, una sin correo). Todo inventado. Lo llama js/demo/datos.js al montar los asuntos
   (`Demo.actividades.construir({ crearTipoConGuia, crearAsunto, hace })`).
   ============================================================ */
(function () {
  'use strict';

  async function construir(o) {
    if (!window.Actividades) return;
    var tipo = await o.crearTipoConGuia('ACTIVIDAD EXTRAESCOLAR', 'OTROS', [
      { titulo: 'Recoger las autorizaciones', cuerpo: '<p>Las firmadas por las familias.</p>', responsable: 'yo' },
      { titulo: 'Avisar al claustro', cuerpo: '<p>Con la lista del alumnado que va.</p>', responsable: 'yo' }
    ], 0);
    tipo.actividades = true;
    await App.guardarTipos();

    var todos = await Actividades.alumnadoMatriculado();
    var personal = [];
    try { personal = (await Datos.cargar(App.E.datos, 'PERSONAL')).lista || []; } catch (e) { personal = []; }
    function alumno(id) { return todos.filter(function (p) { return String(p.id) === id; })[0]; }
    function profe(trozo, papel) {
      var p = personal.filter(function (x) { return x.nombre.indexOf(trozo) !== -1; })[0];
      return p ? { nombre: App.textoTercero(p), clave: Datos.clavePersona(p.documento, p.nombre), papel: papel } : null;
    }

    async function actividad(corto, nombre, inicioHace, finHace, ids, profes, extra) {
      var gente = ids.map(alumno).filter(Boolean);
      var inicio = o.hace(inicioHace), fin = o.hace(finHace);
      var tercero = 'GRUPO ' + corto;
      var id = U.nuevoId('act');
      var clave = await o.crearAsunto(tipo, 'OTROS', tercero, inicio, {
        abiertoEl: inicio + 'T09:00:00.000Z',
        datos: {
          grupo: { nombre: corto, origen: 'actividad', creado: inicio + 'T09:00:00.000Z' }, actividad: { id: id },
          relacionados: gente.map(function (p) { return { categoria: 'ALUMNADO', nombre: App.textoTercero(p) }; })
        }
      });
      var numero = (App.E.registro.asuntos[clave] || {}).numero || '';
      var a = Actividades.construir(Object.assign({
        id: id, nombre: nombre, inicio: inicio, fin: fin, salida: '08:30', regreso: '15:00', lugar: 'Granada',
        departamento: 'Geografía e Historia', horas: 6, alumnos: gente, matriculados: todos,
        profesorado: profes.filter(Boolean), asunto: { numero: numero, nombre: clave }
      }, extra || {}), null);
      await Actividades.guardarActividad(a);
    }

    /* Prevista: ocho alumnos de dos unidades (no entran Castro Reina, Noa ni Navarro Gil, Lucía: otras pruebas cuentan sus asuntos) y tres profesores. */
    await actividad('Visita Granada', 'Visita a la Alhambra y al Albaicín', -9, -9,
      ['2100005', '2100013', '2100015', '2100016', '2100002', '2100010', '2100020', '2100041'],
      [profe('Otero Campos', 'organiza'), profe('Reyes Palma', 'acompana'), profe('Uceda Molina', 'acompana')]);
    /* Realizada: su fecha ya pasó. */
    await actividad('Museo de Ciencias', 'Visita al Parque de las Ciencias', 20, 20,
      ['2100005', '2100013'], [profe('Reyes Palma', 'organiza'), profe('Otero Campos', 'acompana')]);
    /* Anulada. */
    await actividad('Excursion Sierra', 'Ruta por la Sierra de Grazalema', -14, -14,
      ['2100002', '2100010'], [profe('Uceda Molina', 'organiza')], { anulada: true });
    await Actividades.cambiar(function (d) { d.tipoMarcado = true; });

    /* Fila 310: dos actividades antiguas de cursos anteriores, sin asunto ni alumnado; una con una profesora que ya no está en el centro. */
    await Actividades.guardarAntigua({
      nombre: 'Viaje a Cádiz de 4º de ESO', inicio: o.hace(400), fin: o.hace(399), lugar: 'Cádiz', departamento: 'Geografía e Historia', horas: 12,
      profesorado: [profe('Otero Campos', 'organiza'), { nombre: 'Salas Pérez, Rosario', clave: Datos.clavePersona('12345678', 'Salas Pérez, Rosario'), papel: 'acompana' }].filter(Boolean)
    });
    await Actividades.guardarAntigua({
      nombre: 'Taller de robótica en el CEIP', inicio: o.hace(700), fin: o.hace(700), lugar: 'Sevilla', departamento: 'Tecnología', horas: 4,
      profesorado: [profe('Reyes Palma', 'organiza')].filter(Boolean)
    });

    /* Fila 309: el grupo «Profesorado», que recibe el aviso al claustro; una de las cuatro personas no tiene correo. */
    if (window.Grupos) {
      try {
        await Grupos.cargar();
        var miembros = ['Otero Campos', 'Reyes Palma', 'Uceda Molina', 'Cabello Ruiz'].map(function (t) { return profe(t, 'acompana'); }).filter(Boolean)
          .map(function (p) { return { categoria: 'PERSONAL', nombre: p.nombre }; });
        if (miembros.length && !Grupos.lista().some(function (g) { return g.nombre === 'Profesorado'; })) await Grupos.crear('Profesorado', miembros);
      } catch (e) { /* sin el grupo, la copia de pruebas enseña la línea ámbar */ }
    }
  }

  window.Demo = window.Demo || {};
  window.Demo.actividades = { construir: construir };
})();
