/* ============================================================
   demo/datos-perfil.js — lo que necesita el perfil directivo (fila 287,
   docs/PERFIL-DIRECTIVO.md) en la copia de pruebas:
     1. el órgano de cada tipo (Jefatura, Secretaría, Dirección, Varios y uno sin asignar);
     2. tres nombres más con su perfil: «Directora de prueba» (Dirección), «Secretario de
        prueba» (Secretaría) y «Jefa de estudios de prueba» (Jefatura de Estudios);
     3. asuntos abiertos y archivados de cada órgano, de «Varios» y sin asignar, y un
        asunto reservado de Jefatura.
   Todo inventado. `Demo.perfil.construir({ tipos, crearAsunto, archivar, hace })` lo llama
   js/demo/datos-hacer-hito.js al montar los asuntos. Para entrar con uno de esos
   nombres: `?demo=1&auto=1&usuario=Jefa de estudios de prueba`.
   ============================================================ */
(function () {
  'use strict';

  var DIRECTIVOS = [
    { nombre: 'Directora de prueba', perfil: 'DIRECCION', correo: 'directora@correo-demo.es' },
    { nombre: 'Secretario de prueba', perfil: 'SECRETARIA', correo: 'secretario@correo-demo.es' },
    { nombre: 'Jefa de estudios de prueba', perfil: 'JEFATURA', correo: 'jefatura@correo-demo.es' }
  ];

  async function construir(o) {
    var tipos = o.tipos;
    /* 1. El órgano de cada tipo. */
    var organos = { MATRICULA: 'JEFATURA', CERTIFICADO: 'SECRETARIA', 'BAJA MEDICA': 'DIRECCION', FACTURA: 'SECRETARIA',
      'SEGURO ESCOLAR': 'VARIOS', 'CERTIFICADO MIEMBRO CONSEJO ESCOLAR': '', 'CERTIFICADO DE NOTAS': 'SECRETARIA' };
    Object.keys(organos).forEach(function (n) { if (tipos[n]) tipos[n].organo = organos[n]; });
    App.E.tipos.forEach(function (t) { if (/^Reclamaci/i.test(t.tipo)) t.organo = 'JEFATURA'; });
    await App.guardarTipos();

    /* 2. Los tres nombres, con su perfil. */
    for (var i = 0; i < DIRECTIVOS.length; i++) {
      await Usuarios.anadirSiHaceFalta(App.E.gestor, DIRECTIVOS[i].nombre);
      await Perfil.guardar(DIRECTIVOS[i].nombre, { perfil: DIRECTIVOS[i].perfil, correo: DIRECTIVOS[i].correo });
    }

    /* 3. Lo que le falta a cada órgano. */
    await o.crearAsunto(tipos.MATRICULA, 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Lara Quintero, Bruno', id: '2100013' }), o.hace(8), {
      abiertoEl: o.hace(8) + 'T09:00:00.000Z', datos: { reservado: true }
    });
    var archivadoJefatura = await o.archivar(tipos.MATRICULA, 'ALUMNADO', Nombres.terceroAlumno({ nombre: 'Klein Soto, Ana', id: '2100012' }), o.hace(30), true);
    await o.archivar(tipos['BAJA MEDICA'], 'PERSONAL', Nombres.terceroPersonal({ nombre: 'Vidal Cano, Ramón', documento: '44556677D' }), o.hace(15), true);
    await o.archivar(tipos['CERTIFICADO MIEMBRO CONSEJO ESCOLAR'], 'PERSONAL', Nombres.terceroPersonal({ nombre: 'Uceda Molina, Patricia', documento: '33445566C' }), o.hace(20), true);
    await o.archivar(tipos.FACTURA, 'EMPRESAS', Nombres.terceroEmpresa({ nombre: 'Copistería Central', nif: '99887766X' }), o.hace(25), true);

    /* 4. Los encargos de los directivos (fila 289). */
    if (window.Demo.encargos) await Demo.encargos.construir(o, { archivadoJefatura: archivadoJefatura });
    /* 5. Las notas de la Jefa de estudios en dos asuntos (fila 290). */
    if (window.Demo.notas) await Demo.notas.construir(o);
  }

  window.Demo = window.Demo || {};
  window.Demo.perfil = { construir: construir, DIRECTIVOS: DIRECTIVOS };
})();
