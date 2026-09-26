/* Prueba de la lógica del gestor con un disco de mentira en memoria. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, TextDecoder, Blob, window: {}, indexedDB: null };
vm.createContext(contexto);
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'reintentar-escritura.js', 'carpetas.js', 'nombres.js', 'datos.js', 'datos-alumnado.js', 'datos-personal.js', 'datos-resumen.js', 'datos-listas.js', 'datos-tutores.js', 'dni.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { U, Carpetas, Nombres, Datos } = contexto;

/* ---------- disco de mentira ---------- */
function dirFalso(nombre) {
  const hijos = new Map();
  const h = {
    kind: 'directory', name: nombre, _hijos: hijos,
    async getDirectoryHandle(n, o) {
      if (!hijos.has(n)) {
        if (!o || !o.create) { const e = new Error('no está'); e.name = 'NotFoundError'; throw e; }
        hijos.set(n, dirFalso(n));
      }
      const x = hijos.get(n);
      if (x.kind !== 'directory') throw new Error('no es carpeta');
      return x;
    },
    async getFileHandle(n, o) {
      if (!hijos.has(n)) {
        if (!o || !o.create) { const e = new Error('no está'); e.name = 'NotFoundError'; throw e; }
        hijos.set(n, ficheroFalso(n, ''));
      }
      return hijos.get(n);
    },
    async removeEntry(n) { hijos.delete(n); },
    async *entries() { for (const [k, v] of hijos) yield [k, v]; }
  };
  return h;
}
function ficheroFalso(nombre, texto) {
  return {
    kind: 'file', name: nombre, _texto: texto,
    async getFile() {
      const self = this;
      return { async arrayBuffer() { return new TextEncoder().encode(self._texto).buffer; },
               size: new TextEncoder().encode(self._texto).length,
               _texto: self._texto };
    },
    async createWritable() {
      const self = this;
      return {
        async write(cosa) {
          if (typeof cosa === 'string') self._texto = cosa;
          else if (cosa && typeof cosa.text === 'function') self._texto = await cosa.text();
          else if (cosa && cosa._texto !== undefined) self._texto = cosa._texto;
        },
        async close() {}
      };
    }
  };
}

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

/* ---------- nombres ---------- */
comprobar('monta el nombre completo',
  Nombres.montar({ fecha: '2026-09-07', tipo: 'matricula', curso: '26-27',
                   descripcion: 'Cambio de optativa', tercero: 'Pérez García, Ana 1234567' }),
  '260907 MATRICULA 26-27 Cambio de optativa Pérez García, Ana 1234567');

comprobar('monta sin curso ni descripción',
  Nombres.montar({ fecha: '2026-09-07', tipo: 'COMPRA', tercero: 'Papelería Sur S.L. B29123456' }),
  '260907 COMPRA Papelería Sur S.L. B29123456');

comprobar('quita los caracteres que Windows no admite',
  Nombres.montar({ fecha: '2026-01-02', tipo: 'SANCION', tercero: 'López/Ruiz: Juan 99' }),
  '260102 SANCION López Ruiz Juan 99');

const tipos = Nombres.POR_DEFECTO;
comprobar('lee un tipo de dos palabras',
  Nombres.leer('260907 SEGURO ESCOLAR 26-27 Pérez García, Ana 1234567', tipos).tipo,
  'SEGURO ESCOLAR');
comprobar('lee un tipo de una palabra',
  Nombres.leer('260907 MATRICULA 26-27 Pérez García, Ana 1234567', tipos).tipo, 'MATRICULA');
comprobar('el resto queda limpio',
  Nombres.leer('260907 MATRICULA 26-27 Pérez, Ana 1234567', tipos).resto, '26-27 Pérez, Ana 1234567');
comprobar('un tipo desconocido se apaña igual',
  Nombres.leer('250301 EVACUACION Simulacro anual', tipos).tipo, 'EVACUACION');
comprobar('una carpeta sin fecha no revienta',
  Nombres.leer('Cosas sueltas', tipos).reconocido, false);
comprobar('tercero de personal: cuatro últimos caracteres del documento',
  Nombres.terceroPersonal({ nombre: 'Ruiz Mena, Luis', documento: '12345678Z' }), 'Ruiz Mena, Luis 678Z');
/* ---------- la abreviatura del grupo ---------- */
comprobar('ESO: 1º A -> 1ºA', Nombres.grupoCompacto('1º A', '1º de E.S.O.'), '1ºA');
comprobar('ESO: 3º B -> 3ºB', Nombres.grupoCompacto('3º B', '3º de E.S.O.'), '3ºB');
comprobar('ESO sin espacio: 4ºD -> 4ºD', Nombres.grupoCompacto('4ºD', '4º de E.S.O.'), '4ºD');
comprobar('ESO con la etapa dentro', Nombres.grupoCompacto('2º ESO C', '2º de E.S.O.'), '2ºC');
comprobar('Bachillerato lleva la etapa',
  Nombres.grupoCompacto('1º Bach A', '1º de Bachillerato'), '1ºBachA');
comprobar('Bachillerato escrito entero',
  Nombres.grupoCompacto('2º Bachillerato B', '2º de Bachillerato'), '2ºBachB');
comprobar('Bachillerato pegado', Nombres.grupoCompacto('1ºBachC', '1º de Bachillerato'), '1ºBachC');
comprobar('un 1ºA de Bachillerato NO se confunde con uno de la ESO',
  Nombres.grupoCompacto('1º Bach A', '1º de Bachillerato') === Nombres.grupoCompacto('1º A', '1º de E.S.O.'),
  false);
comprobar('la etapa se ve aunque solo la diga el curso',
  Nombres.grupoCompacto('1º A', '1º de Bachillerato'), '1ºBachA');
comprobar('ciclo formativo', Nombres.grupoCompacto('1º CFGM A', '1º Ciclo Formativo'), '1ºFPA');
comprobar('unidad sin letra', Nombres.grupoCompacto('1º ESO', '1º de E.S.O.'), '1º');
comprobar('unidad vacía usa el curso', Nombres.grupoCompacto('', '3º de E.S.O.'), '3º');
comprobar('sin nada, no inventa', Nombres.grupoCompacto('', ''), '');

comprobar('el grupo entra en el nombre detrás del año académico',
  Nombres.montar({ fecha: '2026-09-07', tipo: 'MATRICULA', curso: '26-27', grupo: '3ºA',
                   descripcion: 'Cambio de optativa', tercero: 'Cordero Navas, Lucía 1139877' }),
  '260907 MATRICULA 26-27 3ºA Cambio de optativa Cordero Navas, Lucía 1139877');
comprobar('sin grupo el nombre queda como antes',
  Nombres.montar({ fecha: '2026-09-07', tipo: 'MATRICULA', curso: '26-27', grupo: '',
                   tercero: 'Cordero Navas, Lucía 1139877' }),
  '260907 MATRICULA 26-27 Cordero Navas, Lucía 1139877');

/* Al cerrar un asunto que no tiene ficha, la carpeta del tercero se propone
   con el resto del nombre. De ahí hay que quitar el año académico y el grupo,
   que van delante. Lo que no se toca es un nombre de empresa. */
comprobar('el tercero propuesto al cerrar no lleva el año académico ni el grupo',
  ['26-27 3ºA Cordero Navas, Lucía 1139877',
   '26-27 Cordero Navas, Lucía 1139877',
   'Papelería Sur, S.L. B12345678'].map(r => Nombres.terceroDeResto(r)),
  ['Cordero Navas, Lucía 1139877',
   'Cordero Navas, Lucía 1139877',
   'Papelería Sur, S.L. B12345678']);

/* ---------- la edad ----------
   Las fechas se calculan a partir de HOY, no de un día fijo: fijas se
   quedaban desfasadas y las pruebas empezaban a fallar solas al pasar
   la fecha (pasó el 8-sep-2026 con U.edadDesde y U.yaPaso). */
const hoyPrueba = new Date();
function fechaHace(anios, diasDeMargen) {
  const d = new Date(hoyPrueba.getFullYear() - anios, hoyPrueba.getMonth(), hoyPrueba.getDate() + (diasDeMargen || 0));
  return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}
comprobar('edad de quien ya ha cumplido este año', U.edadDesde(fechaHace(13, -30)), 13);
comprobar('edad de quien todavía no ha cumplido', U.edadDesde(fechaHace(15, 30)), 14);
comprobar('cumple hoy mismo', U.edadDesde(fechaHace(14, 0)), 14);
comprobar('cumple mañana', U.edadDesde(fechaHace(14, 1)), 13);
comprobar('una fecha ilegible no da edad', U.edadDesde('no consta'), '');

comprobar('curso académico de septiembre', U.cursoActual(), '26-27');
comprobar('fecha legible', U.fechaLegible('260907'), '07/09/2026');

/* ---------- el código del registro de Séneca ---------- */
comprobar('entrada manual', Nombres.codigoRegistro({ ano: '26', sentido: 'E', modo: 'M', numero: '1234' }), '26EM1234');
comprobar('entrada automática', Nombres.codigoRegistro({ ano: '26', sentido: 'E', modo: 'A', numero: '1234' }), '26EA1234');
comprobar('salida manual', Nombres.codigoRegistro({ ano: '26', sentido: 'S', modo: 'M', numero: '1234' }), '26SM1234');
comprobar('salida automática', Nombres.codigoRegistro({ ano: '26', sentido: 'S', modo: 'A', numero: '1234' }), '26SA1234');
comprobar('el número se rellena a cuatro dígitos',
  Nombres.codigoRegistro({ ano: '26', sentido: 'E', modo: 'M', numero: '7' }), '26EM0007');
comprobar('un número de cinco dígitos se respeta',
  Nombres.codigoRegistro({ ano: '26', sentido: 'E', modo: 'M', numero: '12345' }), '26EM12345');
comprobar('el año de cuatro dígitos se recorta',
  Nombres.codigoRegistro({ ano: '2026', sentido: 'E', modo: 'M', numero: '1234' }), '26EM1234');
comprobar('sin número no hay código',
  Nombres.codigoRegistro({ ano: '26', sentido: 'E', modo: 'M', numero: '' }), '');
comprobar('sin registro no hay código', Nombres.codigoRegistro(null), '');

/* ---------- el nombre del documento ---------- */
comprobar('documento con registro',
  Nombres.montarDocumento({ fecha: '2026-09-07', codigo: '26EM1234', tipo: 'solicitud',
                            curso: '26-27', extension: 'pdf' }),
  '260907 26EM1234 SOLICITUD 26-27.pdf');
comprobar('documento sin registro',
  Nombres.montarDocumento({ fecha: '2026-09-07', codigo: '', tipo: 'FACTURA',
                            curso: '', extension: 'pdf' }),
  '260907 FACTURA.pdf');
comprobar('la extensión se conserva',
  Nombres.montarDocumento({ fecha: '2026-01-02', tipo: 'ACTA', extension: 'DOCX' }),
  '260102 ACTA.docx');
comprobar('extensión de un fichero', Nombres.extensionDe('factura de la papelería.PDF'), 'pdf');
comprobar('fichero sin extensión', Nombres.extensionDe('documento'), '');

/* ---------- el nombre viejo de un tipo se sigue reconociendo ---------- */
const tiposConAlias = [{ tipo: 'EXPEDIENTE DISCIPLINARIO', categoria: 'ALUMNADO', alias: ['SANCION'] }];
comprobar('una carpeta vieja se reconoce por el nombre antiguo',
  Nombres.leer('250401 SANCION 24-25 Pérez, Ana 123', tiposConAlias).tipo, 'EXPEDIENTE DISCIPLINARIO');
comprobar('y se sabe con qué nombre está escrita en el disco',
  Nombres.leer('250401 SANCION 24-25 Pérez, Ana 123', tiposConAlias).nombreViejo, 'SANCION');
comprobar('con el nombre nuevo también',
  Nombres.leer('260401 EXPEDIENTE DISCIPLINARIO 26-27 Pérez, Ana 123', tiposConAlias).tipo,
  'EXPEDIENTE DISCIPLINARIO');
comprobar('el nombre nuevo no marca nombreViejo',
  Nombres.leer('260401 EXPEDIENTE DISCIPLINARIO 26-27 Pérez, Ana 123', tiposConAlias).nombreViejo, '');

/* ---------- CSV ---------- */
const csv = 'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Teléfono\r\n' +
            'Pérez García, Ana;1234567;1º de E.S.O.;1º A;2025;600111222\r\n' +
            'Pérez García, Ana;1234567;2º de E.S.O.;2º B;2026;600111222\r\n' +
            '"Ruiz; Mena, Luis";7654321;1º de E.S.O.;1º C;2026;600333444\r\n';

const raizFalsa = dirFalso('Dropbox');
const abiertos = await raizFalsa.getDirectoryHandle('ASUNTOS ABIERTOS', { create: true });
const archivo = await raizFalsa.getDirectoryHandle('ARCHIVO', { create: true });
const gestor = await abiertos.getDirectoryHandle('_GESTOR', { create: true });
const datos = await gestor.getDirectoryHandle('datos', { create: true });
await Carpetas.escribirTexto(datos, 'RegAlum.csv', csv);

const alum = await Datos.cargar(datos, 'ALUMNADO');
comprobar('se queda con la matrícula más reciente', alum.lista.length, 2);
comprobar('unidad de la matrícula más reciente',
  alum.lista.find(a => a.id === '1234567').unidad, '2º B');
comprobar('las comillas del CSV se respetan',
  alum.lista.find(a => a.id === '7654321').nombre, 'Ruiz; Mena, Luis');
comprobar('la búsqueda encuentra por dos trozos',
  Datos.buscar(alum.lista, 'ana perez', 10).length, 1);

/* ---------- quién sigue matriculado este curso ---------- */
const csvMatriculas = [
  'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Teléfono',
  /* sigue en el centro: tres matrículas, la última de 2026 */
  'Aguilar Ponce, Marina;111;1º de E.S.O.;1º A;2024;Matriculada;600111222',
  'Aguilar Ponce, Marina;111;2º de E.S.O.;2º B;2025;Matriculada;600111222',
  'Aguilar Ponce, Marina;111;3º de E.S.O.;3º C;2026;Matriculada;600111222',
  /* se fue hace dos cursos */
  'Bermúdez Ortiz, Álvaro;222;4º de E.S.O.;4º D;2024;Matriculado;600333444',
  /* este curso tiene matrícula, pero anulada */
  'Cordero Navas, Lucía;333;1º de E.S.O.;1º B;2025;Matriculada;600555666',
  'Cordero Navas, Lucía;333;2º de E.S.O.;2º A;2026;Anulada;600555666'
].join('\r\n') + '\r\n';

Datos.olvidar('ALUMNADO');
const otrosDatos = await gestor.getDirectoryHandle('datos2', { create: true });
await Carpetas.escribirTexto(otrosDatos, 'RegAlum.csv', csvMatriculas);
const M = await Datos.cargar(otrosDatos, 'ALUMNADO');

comprobar('el curso del fichero sale del año más alto', M.curso, '26-27');
comprobar('cuenta bien cuántos siguen matriculados', M.matriculados, 1);

const marina = M.lista.find(a => a.id === '111');
comprobar('la que sigue está marcada como matriculada', marina.matriculado, true);
comprobar('y su grupo es el de este curso, no el de hace dos', marina.unidad, '3º C');
comprobar('su grupo abreviado', Nombres.grupoCompacto(marina.unidad, marina.curso), '3ºC');

const alvaro = M.lista.find(a => a.id === '222');
comprobar('el que se fue no está matriculado', alvaro.matriculado, false);
comprobar('y no se le da ningún grupo', alvaro.unidad, '');
comprobar('pero sí se sabe de cuándo fue su última matrícula',
  U.cursoDeAno(alvaro.anoUltima), '24-25');
comprobar('y cuál era aquel grupo', alvaro.unidadUltima, '4º D');
comprobar('sin grupo, la abreviatura queda vacía',
  Nombres.grupoCompacto(alvaro.unidad, alvaro.curso), '');

const lucia = M.lista.find(a => a.id === '333');
comprobar('una matrícula anulada no cuenta como estar matriculado', lucia.matriculado, false);
comprobar('su última matrícula buena es la del curso anterior',
  U.cursoDeAno(lucia.anoUltima), '25-26');

comprobar('la tabla de grupos solo lista los de este curso',
  Datos.unidadesDistintas(M.lista).map(u => u.unidad), ['3º C']);

comprobar('año de matrícula a curso académico', U.cursoDeAno(2026), '26-27');
comprobar('un año vacío no da curso', U.cursoDeAno(''), '');

Datos.olvidar('ALUMNADO');

Datos.olvidar();
const personal = await Datos.cargar(datos, 'PERSONAL');
comprobar('crea personal.csv vacío', personal.lista.length, 0);
await Datos.anadirALista(datos, 'PERSONAL',
  { 'Nombre': 'Marmolejo González, Francisco', 'Documento': '11112222X', 'Puesto': 'Auxiliar administrativo' });
const personal2 = await Datos.cargar(datos, 'PERSONAL');
comprobar('guarda y relee el alta', personal2.lista[0].nombre, 'Marmolejo González, Francisco');
comprobar('el documento se lee bien', personal2.lista[0].documento, '11112222X');
comprobar('el alta a mano no viene de Séneca', personal2.lista[0].deSeneca, false);

/* ---------- un RegAlum sin columna de año ----------
   Es la descarga "de este curso": una fila por alumno y sin histórico.
   Ahí todo el que no esté anulado cuenta como matriculado, y por tanto
   se le puede poner el grupo. */
Datos.olvidar();
const datosFoto = dirFalso('datos');
await Carpetas.escribirTexto(datosFoto, 'RegAlum.csv',
  'Alumno/a;Nº Id. Escolar;Curso;Unidad;Estado Matrícula;Fecha de nacimiento\r\n' +
  'Aguilar Ponce, Marina;1140233;2º de E.S.O.;2º B;Matriculada;14/03/2013\r\n' +
  'Bermúdez Ortiz, Álvaro;1140501;1º de E.S.O.;1º C;Anulada;02/09/2014\r\n');
const F = await Datos.cargar(datosFoto, 'ALUMNADO');
comprobar('sin columna de año, el fichero es la foto de hoy', F.sinAnos, true);
comprobar('y el curso es el de hoy', F.curso, '26-27');
const marinaF = F.lista.find(x => x.nombre.indexOf('Aguilar') === 0);
comprobar('la alumna cuenta como matriculada', marinaF.matriculado, true);
comprobar('y se le puede poner el grupo',
  Nombres.grupoCompacto(marinaF.unidad, marinaF.curso), '2ºB');
const alvaroF = F.lista.find(x => x.nombre.indexOf('Bermúdez') === 0);
comprobar('una matrícula anulada sigue sin contar', alvaroF.matriculado, false);
comprobar('avisa de la columna que falta', F.faltan, ['Año de la matrícula']);

/* Los títulos se reconocen aunque Séneca los escriba de otra manera. */
Datos.olvidar();
const datosOtros = dirFalso('datos');
await Carpetas.escribirTexto(datosOtros, 'RegAlum.csv',
  'Alumno;Nº Identificación Escolar;Curso;Unidad/Grupo;Año académico;Estado de matrícula;F. Nacimiento\r\n' +
  'Solano Vega, Ruth;1138002;1º de Bachillerato;1º Bach A;2026;Matriculada;11/05/2009\r\n');
const O = await Datos.cargar(datosOtros, 'ALUMNADO');
comprobar('reconoce los títulos escritos de otra forma', O.faltan.length, 0);
const ruthO = O.lista[0];
comprobar('y la alumna sale matriculada', ruthO.matriculado, true);
comprobar('con su grupo de Bachillerato',
  Nombres.grupoCompacto(ruthO.unidad, ruthO.curso), '1ºBachA');

/* ---------- solicitantes: alumnado que aún no está en el RegAlum ---------- */
Datos.olvidar();
const datosSol = dirFalso('datos');
await Carpetas.escribirTexto(datosSol, 'RegAlum.csv',
  'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;Fecha de nacimiento\r\n' +
  'Aguilar Ponce, Marina;1140233;2º de E.S.O.;2º B;2026;Matriculada;14/03/2013\r\n');
await Datos.anadirALista(datosSol, 'ALUMNADO', {
  'Nombre': 'Nuevo Aspirante, Lucas', 'Nº Id. Escolar': '',
  'Fecha de nacimiento': '10/04/2012', 'Teléfono de contacto': '600999888'
});
const S = await Datos.cargar(datosSol, 'ALUMNADO');
comprobar('el solicitante se suma al alumnado', S.lista.length, 2);
comprobar('y se cuenta aparte', S.solicitantes, 1);
const lucas = S.lista.find(x => x.nombre.indexOf('Nuevo') === 0);
comprobar('no está matriculado', lucas.matriculado, false);
comprobar('pero está marcado como solicitante', lucas.solicitante, true);
comprobar('sin Nº, la carpeta va solo con el nombre',
  Nombres.terceroAlumno(lucas), 'Nuevo Aspirante, Lucas');
comprobar('se le calcula la edad igual', U.edadDesde(lucas.fechaNac), 14);
const fichaLucas = Datos.destacadosAlumno(lucas);
comprobar('la ficha dice que es solicitante',
  fichaLucas.destacados.some(f => f.valor.indexOf('Solicitante') === 0), true);

/* Con Nº de identificación escolar, la carpeta ya se llama como la que
   montará el RegAlum el día que se matricule. */
await Datos.anadirALista(datosSol, 'ALUMNADO', {
  'Nombre': 'Con Numero, Sara', 'Nº Id. Escolar': '1150999'
});
const S2 = await Datos.cargar(datosSol, 'ALUMNADO');
const sara = S2.lista.find(x => x.nombre.indexOf('Con Numero') === 0);
comprobar('con Nº, la carpeta lo lleva',
  Nombres.terceroAlumno(sara), 'Con Numero, Sara 1150999');

/* Y si el solicitante ya aparece en el RegAlum, no se duplica. */
await Datos.anadirALista(datosSol, 'ALUMNADO', {
  'Nombre': 'Aguilar Ponce, Marina', 'Nº Id. Escolar': '1140233'
});
const S3 = await Datos.cargar(datosSol, 'ALUMNADO');
comprobar('quien ya está matriculado no se duplica',
  S3.lista.filter(x => x.nombre.indexOf('Aguilar') === 0).length, 1);
comprobar('y la ficha buena es la del RegAlum',
  S3.lista.find(x => x.nombre.indexOf('Aguilar') === 0).matriculado, true);

/* Documento de identidad del aspirante (17-sep-2026, fila 42,
   docs/TERCEROS-NUEVOS-DESDE-EL-DOCUMENTO.md): si su documento aparece
   en el RegAlum, se reconoce como matriculado aunque el Nº escolar y el
   nombre no cuadren (alguien pudo escribirlo distinto a mano). */
Datos.olvidar();
const datosDoc = dirFalso('datos');
await Carpetas.escribirTexto(datosDoc, 'RegAlum.csv',
  'Alumno/a;Nº Id. Escolar;Curso;Unidad;Año de la matrícula;Estado Matrícula;' +
  'Fecha de nacimiento;DNI/Pasaporte\r\n' +
  'Perez Soto, David;1160777;1º de E.S.O.;1º A;2026;Matriculado;12/06/2013;55566677Q\r\n');
await Datos.anadirALista(datosDoc, 'ALUMNADO', {
  'Nombre': 'David Perez S.', 'Documento de identidad': '55566677-Q',
  'Nº Id. Escolar': '', 'Fecha de nacimiento': '12/06/2013'
});
const D1 = await Datos.cargar(datosDoc, 'ALUMNADO');
comprobar('reconocido por el documento, no se duplica pese al nombre distinto',
  D1.lista.length, 1);
comprobar('y la ficha buena es la matriculada',
  D1.lista[0].matriculado, true);

/* Con un documento que NO está en el RegAlum, sí se suma como aspirante
   normal, sin número: la carpeta va solo con el nombre. */
await Datos.anadirALista(datosDoc, 'ALUMNADO', {
  'Nombre': 'Otro Aspirante, Vera', 'Documento de identidad': '11223344B'
});
const D2 = await Datos.cargar(datosDoc, 'ALUMNADO');
const vera = D2.lista.find(x => x.nombre.indexOf('Otro Aspirante') === 0);
comprobar('con documento distinto, sí se suma', D2.lista.length, 2);
comprobar('marcado como aspirante, pendiente de número', vera.solicitante && !vera.id, true);
comprobar('la carpeta va solo con el nombre',
  Nombres.terceroAlumno(vera), 'Otro Aspirante, Vera');

/* ---------- personal del RelPerCen de Séneca ----------

   Las fechas de cese, igual que las de la edad de arriba, se calculan
   a partir de HOY: fijas se quedaban desfasadas y la prueba empezaba a
   fallar sola al pasar la fecha (pasó el 15-sep-2026 con una fecha de
   cese escrita a mano). */
Datos.olvidar();
const datosPer = dirFalso('datos');
/* Las dos fechas de cese van contadas desde HOY, no escritas a mano:
   una que aún no ha llegado y otra que ya pasó. Escritas, la prueba se
   ponía en rojo ella sola en cuanto el calendario las alcanzaba. */
function enDias(cuantos) {
  const d = new Date();
  d.setDate(d.getDate() + cuantos);
  return String(d.getDate()).padStart(2, '0') + '/' +
         String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
}
const CESA_PRONTO = enDias(10);
const CESO_YA = enDias(-10);

await Carpetas.escribirTexto(datosPer, 'RelPerCen.csv',
  '"Empleado/a","DNI/Pasaporte","Puesto","Fecha de toma de posesión","Fecha de cese","Teléfono","Móvil avisos de emergencia","Usuario IdEA","Cuenta Google/Microsoft"\r\n' +
  '"Aguado Ranea, Marcos Antonio","00000000T","Música P.E.S.","01/09/2011","","600000001","600000002","usuario1","usuario1@ejemplo.invalid"\r\n' +
  '"Bonilla Cascado, Manuel","22222222J","Música P.E.S.","01/09/2003","' + CESA_PRONTO + '","600000003","600000004","usuario2","usuario2@ejemplo.invalid"\r\n' +
  '"Sánchez Alegría, María José","11111111H","Dibujo P.E.S.","01/09/2005","' + CESO_YA + '","600000005","600000005","usuario3","usuario3@ejemplo.invalid"\r\n');

const P = await Datos.cargar(datosPer, 'PERSONAL');
comprobar('lee las tres fichas del RelPerCen', P.lista.length, 3);
comprobar('y dice de qué fichero salen', P.fichero, 'RelPerCen.csv');

const marcos = P.lista.find(x => x.nombre.indexOf('Aguado') === 0);
comprobar('sin fecha de cese, sigue en el centro', marcos.enElCentro, true);
comprobar('le coge el puesto', marcos.puesto, 'Música P.E.S.');
comprobar('y viene de Séneca', marcos.deSeneca, true);

const manuel = P.lista.find(x => x.nombre.indexOf('Bonilla') === 0);
comprobar('cesa dentro de unos días, así que todavía está', manuel.enElCentro, true);

const mariaJose = P.lista.find(x => x.nombre.indexOf('Sánchez') === 0);
comprobar('cesó hace días, ya no está en el centro', mariaJose.enElCentro, false);
comprobar('y se guarda la fecha del cese', mariaJose.fechaCese, CESO_YA);
comprobar('cuenta bien cuántos siguen en el centro', P.enElCentro, 2);

comprobar('el nombre del tercero lleva los cuatro últimos caracteres',
  Nombres.terceroPersonal(marcos), 'Aguado Ranea, Marcos Antonio 000T');

comprobar('se puede buscar por la asignatura',
  Datos.buscar(P.lista, 'musica').length, 2);

const fichaPer = Datos.destacadosPersona(mariaJose);
comprobar('la ficha empieza por el DNI', fichaPer.destacados[0], { titulo: 'DNI', valor: mariaJose.documento });
comprobar('y sigue el puesto', fichaPer.destacados[1].titulo, 'Puesto');
comprobar('y avisa de que ya no está',
  fichaPer.destacados[2].valor.indexOf('Ya no está en el centro'), 0);
comprobar('el DNI no se repite abajo, en "resto"',
  fichaPer.resto.some((f) => String(f.valor).trim() === mariaJose.documento), false);

/* Quien se da de alta a mano se suma a los de Séneca. */
await Datos.anadirALista(datosPer, 'PERSONAL',
  { 'Nombre': 'Marmolejo González, Francisco', 'Documento': '11112222X', 'Puesto': 'Auxiliar administrativo' });
const P2 = await Datos.cargar(datosPer, 'PERSONAL');
comprobar('el alta a mano se suma a la lista de Séneca', P2.lista.length, 4);
comprobar('y se cuenta aparte', P2.manuales, 1);
comprobar('el fichero de Séneca no se ha tocado',
  (await Carpetas.leerTexto(datosPer, 'RelPerCen.csv')).split('\n').length, 5);

/* ---------- varios RelPerCen: cursos anteriores y personal no docente ---------- */
Datos.olvidar();
const datosVarios = dirFalso('datos');
const CAB = '"Empleado/a","DNI/Pasaporte","Puesto","Fecha de toma de posesión","Fecha de cese"';

/* Profesorado de hace dos cursos: uno sigue, otro se fue. */
await Carpetas.escribirTexto(datosVarios, 'RelPerCen 24-25.csv', CAB + '\r\n' +
  '"Aguado Ranea, Marcos Antonio","00000000T","Música P.E.S.","01/09/2011",""\r\n' +
  '"Vieja Guardia, Antonia","11112233A","Latín P.E.S.","01/09/2010",""\r\n');

/* Profesorado de este curso: la que se fue ya no sale. */
await Carpetas.escribirTexto(datosVarios, 'RelPerCen 26-27.csv', CAB + '\r\n' +
  '"Aguado Ranea, Marcos Antonio","00000000T","Jefatura de Estudios","01/09/2011",""\r\n' +
  '"Cherino Elena, Paula","26835483A","Inglés P.E.S.","01/09/2026","31/08/2027"\r\n');

/* Personal no docente de este curso, en su propio fichero. */
await Carpetas.escribirTexto(datosVarios, 'RelPerCenNodocente 2627.csv', CAB + '\r\n' +
  '"Ordóñez Gil, Rafael","44556677B","Ordenanza","01/09/2015",""\r\n');

comprobar('el curso sale del nombre del fichero',
  Datos.cursoDelFichero('RelPerCen PAS 26-27.csv'), '26-27');
comprobar('también escrito con los años enteros',
  Datos.cursoDelFichero('RelPerCen 2024-2025.csv'), '24-25');
comprobar('un solo año también vale',
  Datos.cursoDelFichero('RelPerCen 2025.csv'), '25-26');
comprobar('sin año, se entiende que es el de hoy',
  Datos.cursoDelFichero('RelPerCen.csv'), '26-27');
comprobar('el año pegado, como lo escribe Séneca',
  Datos.cursoDelFichero('RelPerCenNodocente 2627.csv'), '26-27');
comprobar('el año pegado de un curso viejo',
  Datos.cursoDelFichero('RelPerCenNodocente 2425.csv'), '24-25');
comprobar('2026 a secas es un año, no un curso pegado',
  Datos.cursoDelFichero('RelPerCen 2026.csv'), '26-27');
comprobar('2025 a secas es el curso 25-26',
  Datos.cursoDelFichero('RelPerCen 2025.csv'), '25-26');

const V = await Datos.cargar(datosVarios, 'PERSONAL');
comprobar('junta los tres ficheros sin repetir a nadie', V.lista.length, 4);
comprobar('y dice cuál es el curso más reciente', V.curso, '26-27');
comprobar('lista los tres ficheros en Ajustes', V.ficheros.length, 3);

const marcosV = V.lista.find(x => x.nombre.indexOf('Aguado') === 0);
comprobar('quien sale en los dos cursos sigue en el centro', marcosV.enElCentro, true);
comprobar('se le guardan los dos cursos', marcosV.cursos, ['24-25', '26-27']);
comprobar('y vale el puesto del fichero más nuevo', marcosV.puesto, 'Jefatura de Estudios');

const antonia = V.lista.find(x => x.nombre.indexOf('Vieja') === 0);
comprobar('quien solo sale en el fichero viejo ya no está', antonia.enElCentro, false);
comprobar('y se sabe cuál fue su último curso aquí', antonia.cursoUltimo, '24-25');
comprobar('pero se la sigue encontrando', Datos.buscar(V.lista, 'vieja').length, 1);

const ordenanza = V.lista.find(x => x.nombre.indexOf('Ordóñez') === 0);
comprobar('el personal no docente entra igual', ordenanza.enElCentro, true);
comprobar('con su puesto', ordenanza.puesto, 'Ordenanza');

comprobar('cuenta bien cuántos están hoy en el centro', V.enElCentro, 3);

const fichaAntonia = Datos.destacadosPersona(antonia);
comprobar('la ficha dice desde cuándo no está',
  fichaAntonia.destacados[2].valor.indexOf('su último curso aquí fue el 24-25') !== -1, true);

comprobar('una fecha de ayer ya pasó', U.yaPaso(fechaHace(0, -1)), true);
comprobar('la de hoy todavía no', U.yaPaso(fechaHace(0, 0)), false);
comprobar('una fecha vacía no cuenta como pasada', U.yaPaso(''), false);

/* ---------- crear, cerrar y reabrir ---------- */
const nombreAsunto = Nombres.montar({ fecha: '2026-09-07', tipo: 'MATRICULA', curso: '26-27',
                                      tercero: 'Pérez García, Ana 1234567' });
const carpetaAsunto = await Carpetas.crear(abiertos, nombreAsunto);
await Carpetas.escribirTexto(carpetaAsunto, '260907 SOLICITUD 26-27.pdf', 'contenido');
const sub = await Carpetas.crear(carpetaAsunto, 'Comunicaciones');
await Carpetas.escribirTexto(sub, 'hilo.pdf', 'correo');

const abiertasAntes = await Carpetas.subcarpetas(abiertos);
comprobar('la carpeta del asunto está creada',
  abiertasAntes.filter(c => c.nombre.charAt(0) !== '_').length, 1);

const destino = await Carpetas.bajar(archivo, ['ALUMNADO', 'Pérez García, Ana 1234567'], true);
const movidos = await Carpetas.mover(abiertos, nombreAsunto, destino);
comprobar('mueve los dos ficheros', movidos, 2);
comprobar('ya no está en abiertos',
  (await Carpetas.subcarpetas(abiertos)).filter(c => c.nombre.charAt(0) !== '_').length, 0);
comprobar('está en el archivo', (await Carpetas.subcarpetas(destino))[0].nombre, nombreAsunto);
const dentro = await destino.getDirectoryHandle(nombreAsunto);
comprobar('la subcarpeta ha viajado', (await Carpetas.subcarpetas(dentro))[0].nombre, 'Comunicaciones');
const subDentro = await dentro.getDirectoryHandle('Comunicaciones');
comprobar('el contenido del fichero se conserva',
  await Carpetas.leerTexto(subDentro, 'hilo.pdf'), 'correo');

await Carpetas.mover(destino, nombreAsunto, abiertos);
comprobar('reabrir lo devuelve',
  (await Carpetas.subcarpetas(abiertos)).filter(c => c.nombre.charAt(0) !== '_')[0].nombre, nombreAsunto);

let choque = '';
await Carpetas.crear(destino, nombreAsunto);
try { await Carpetas.mover(abiertos, nombreAsunto, destino); } catch (e) { choque = 'error'; }
comprobar('no pisa una carpeta que ya existe en el destino', choque, 'error');
comprobar('y el original sigue donde estaba',
  (await Carpetas.subcarpetas(abiertos)).filter(c => c.nombre.charAt(0) !== '_').length, 1);

/* ---------- renombrar ---------- */
const paraRenombrar = await Carpetas.crear(abiertos, '260101 SANCION 26-27 Ruiz, Luis 55');
await Carpetas.escribirTexto(paraRenombrar, 'uno.pdf', 'contenido');
await Carpetas.renombrar(abiertos, '260101 SANCION 26-27 Ruiz, Luis 55',
                                   '260101 EXPEDIENTE DISCIPLINARIO 26-27 Ruiz, Luis 55');
const trasRenombrar = (await Carpetas.subcarpetas(abiertos)).map(c => c.nombre).filter(n => n[0] !== '_');
comprobar('la carpeta se llama como el tipo nuevo',
  trasRenombrar.indexOf('260101 EXPEDIENTE DISCIPLINARIO 26-27 Ruiz, Luis 55') !== -1, true);
comprobar('y la vieja ya no está',
  trasRenombrar.indexOf('260101 SANCION 26-27 Ruiz, Luis 55'), -1);
const renombrada = await abiertos.getDirectoryHandle('260101 EXPEDIENTE DISCIPLINARIO 26-27 Ruiz, Luis 55');
comprobar('el documento de dentro ha viajado',
  await Carpetas.leerTexto(renombrada, 'uno.pdf'), 'contenido');

await Carpetas.renombrarFichero(renombrada, 'uno.pdf', '260101 26EM0007 SOLICITUD 26-27.pdf');
const ficherosDentro = (await Carpetas.ficheros(renombrada)).map(f => f.nombre);
comprobar('el fichero se renombra en el sitio',
  ficherosDentro, ['260101 26EM0007 SOLICITUD 26-27.pdf']);
comprobar('y conserva su contenido',
  await Carpetas.leerTexto(renombrada, '260101 26EM0007 SOLICITUD 26-27.pdf'), 'contenido');

/* ---------- cp1252 ---------- */
const bytes = Buffer.from('Nombre;Puesto\r\nMu\xf1oz, Jos\xe9;Conserje\r\n', 'latin1').toString('binary');
const ficheroRaro = ficheroFalso('personal.csv', null);
ficheroRaro.getFile = async () => ({ async arrayBuffer() { return Uint8Array.from(bytes, c => c.charCodeAt(0)).buffer; } });
datos._hijos.set('cp1252.csv', ficheroRaro);
const texto1252 = await Carpetas.leerTexto(datos, 'cp1252.csv');
/* ---------- renombrar un fichero donde move() no está permitido ----------
   Es lo que pasa en Dropbox: el navegador tiene move(), pero al usarlo
   contesta "The request is not allowed by the user agent or the platform
   in the current context". Hay que copiar y borrar. */
const dirDrop = dirFalso('dropbox');
await Carpetas.escribirTexto(dirDrop, 'f5481d91.pdf', 'el pdf entero');
const hDrop = await dirDrop.getFileHandle('f5481d91.pdf');
hDrop.move = async () => {
  const e = new Error("Failed to execute 'move' on 'FileSystemFileHandle': " +
    'The request is not allowed by the user agent or the platform in the current context.');
  e.name = 'NotAllowedError';
  throw e;
};
await Carpetas.renombrarFichero(dirDrop, 'f5481d91.pdf', '260907 26EM0358 MATRICULA 26-27.pdf');
comprobar('si move() falla, el fichero se renombra igual',
  (await Carpetas.ficheros(dirDrop)).map(f => f.nombre),
  ['260907 26EM0358 MATRICULA 26-27.pdf']);
comprobar('y el contenido llega entero',
  await Carpetas.leerTexto(dirDrop, '260907 26EM0358 MATRICULA 26-27.pdf'), 'el pdf entero');

/* Si la copia sale a medias, no se borra el original. */
const dirMalo = dirFalso('malo');
await Carpetas.escribirTexto(dirMalo, 'original.pdf', 'contenido completo');
const hMalo = await dirMalo.getFileHandle('original.pdf');
hMalo.move = async () => { throw new Error('no se puede'); };
const crearOriginal = dirMalo.getFileHandle.bind(dirMalo);
dirMalo.getFileHandle = async (n, o) => {
  const h = await crearOriginal(n, o);
  if (n === 'copia.pdf') {
    h.createWritable = async () => ({ async write() { h._texto = 'a medias'; }, async close() {} });
  }
  return h;
};
let saltoElAviso = false;
try { await Carpetas.renombrarFichero(dirMalo, 'original.pdf', 'copia.pdf'); }
catch (e) { saltoElAviso = true; }
comprobar('una copia incompleta se detecta', saltoElAviso, true);
comprobar('y el original sigue estando',
  (await Carpetas.ficheros(dirMalo)).map(f => f.nombre), ['original.pdf']);

comprobar('lee un CSV en cp1252 sin romper las tildes', texto1252.indexOf('Muñoz, José') !== -1, true);

console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas pasan.');
process.exit(fallos ? 1 : 0);
