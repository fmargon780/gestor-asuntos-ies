/* Prueba de la lógica del gestor con un disco de mentira en memoria. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, TextDecoder, Blob, window: {}, indexedDB: null };
vm.createContext(contexto);
for (const f of ['util.js', 'carpetas.js', 'nombres.js', 'datos.js']) {
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
comprobar('tercero de personal: cuatro últimos del documento',
  Nombres.terceroPersonal({ nombre: 'Ruiz Mena, Luis', documento: '12345678Z' }), 'Ruiz Mena, Luis 5678');
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

/* ---------- la edad ---------- */
comprobar('edad de quien ya ha cumplido este año', U.edadDesde('14/03/2013'), 13);
comprobar('edad de quien todavía no ha cumplido', U.edadDesde('27/11/2011'), 14);
comprobar('cumple hoy mismo', U.edadDesde('07/09/2012'), 14);
comprobar('cumple mañana', U.edadDesde('08/09/2012'), 13);
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

/* ---------- personal del RelPerCen de Séneca ---------- */
Datos.olvidar();
const datosPer = dirFalso('datos');
await Carpetas.escribirTexto(datosPer, 'RelPerCen.csv',
  '"Empleado/a","DNI/Pasaporte","Puesto","Fecha de toma de posesión","Fecha de cese","Teléfono","Móvil avisos de emergencia","Usuario IdEA","Cuenta Google/Microsoft"\r\n' +
  '"Aguado Ranea, Marcos Antonio","33357591R","Música P.E.S.","01/09/2011","","952276078","620177026","maguran591","maguran591@g.educaand.es"\r\n' +
  '"Bonilla Cascado, Manuel","52561060B","Música P.E.S.","01/09/2003","15/09/2026","952594821","606557122","mboncas060","mboncas060@g.educaand.es"\r\n' +
  '"Sánchez Alegría, María José","07862312S","Dibujo P.E.S.","01/09/2005","06/09/2026","656633968","656633968","msanale312","msanale312@g.educaand.es"\r\n');

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
comprobar('cesó ayer, ya no está en el centro', mariaJose.enElCentro, false);
comprobar('y se guarda la fecha del cese', mariaJose.fechaCese, '06/09/2026');
comprobar('cuenta bien cuántos siguen en el centro', P.enElCentro, 2);

comprobar('el nombre del tercero lleva los cuatro últimos dígitos',
  Nombres.terceroPersonal(marcos), 'Aguado Ranea, Marcos Antonio 7591');

comprobar('se puede buscar por la asignatura',
  Datos.buscar(P.lista, 'musica').length, 2);

const fichaPer = Datos.destacadosPersona(mariaJose);
comprobar('la ficha empieza por el puesto', fichaPer.destacados[0].titulo, 'Puesto');
comprobar('y avisa de que ya no está',
  fichaPer.destacados[1].valor.indexOf('Ya no está en el centro'), 0);

/* Quien se da de alta a mano se suma a los de Séneca. */
await Datos.anadirALista(datosPer, 'PERSONAL',
  { 'Nombre': 'Marmolejo González, Francisco', 'Documento': '11112222X', 'Puesto': 'Auxiliar administrativo' });
const P2 = await Datos.cargar(datosPer, 'PERSONAL');
comprobar('el alta a mano se suma a la lista de Séneca', P2.lista.length, 4);
comprobar('y se cuenta aparte', P2.manuales, 1);
comprobar('el fichero de Séneca no se ha tocado',
  (await Carpetas.leerTexto(datosPer, 'RelPerCen.csv')).split('\n').length, 5);

comprobar('una fecha de ayer ya pasó', U.yaPaso('06/09/2026'), true);
comprobar('la de hoy todavía no', U.yaPaso('07/09/2026'), false);
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
comprobar('lee un CSV en cp1252 sin romper las tildes', texto1252.indexOf('Muñoz, José') !== -1, true);

console.log(fallos ? '\n' + fallos + ' PRUEBAS FALLAN' : '\nTodas las pruebas pasan.');
process.exit(fallos ? 1 : 0);
