/* Prueba de los pasos de un campo creado a partir de otros (fila 529,
   docs/529-CREAR-CAMPOS-POR-PASOS.md), sin navegador: solo la cuenta
   (js/campos-pasos.js y js/campos-calculo.js), con `vm`, como
   pruebas/campos-calculo.mjs. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, window: {} };
vm.createContext(contexto);
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'nombres-tipos.js', 'nombres-montar.js', 'nombres-terceros.js', 'nombres.js', 'campos-normalizar.js', 'campos-guardar.js', 'campos-valores.js', 'campos.js', 'campos-datos-cache.js', 'campos-pasos.js', 'campos-calculo.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
contexto.window.CamposPasos = contexto.CamposPasos;
contexto.window.CamposDatosCache = contexto.CamposDatosCache;
contexto.window.Calculo = contexto.Calculo;
const { Calculo, CamposPasos, Campos } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const col = (c) => ({ clase: 'columna', columna: c });
const persona = (campos) => ({ campos: campos || {} });
function por(desde, pasos, p, config) {
  return Calculo.evaluar({ id: 'x', nombre: 'X', categorias: ['ALUMNADO'], origen: desde, operacion: 'pasos', pasos }, p, config || {});
}
const uno = (paso, valor, extra) => por(col('X'), [paso], persona(Object.assign({ X: valor }, extra || {})));

console.log('--- 1. pasos de texto ---');
comprobar('juntar detrás', uno({ op: 'juntar', campo: col('Y'), sep: ' ', lado: 'final' }, 'Ana', { Y: 'Pons' }), 'Ana Pons');
comprobar('juntar delante', uno({ op: 'juntar', campo: col('Y'), sep: ', ', lado: 'principio' }, 'Ana', { Y: 'Pons' }), 'Pons, Ana');
comprobar('juntar con el otro vacío deja el de arriba', uno({ op: 'juntar', campo: col('Y'), sep: ' ', lado: 'final' }, 'Ana', { Y: '' }), 'Ana');
comprobar('texto fijo delante', uno({ op: 'texto', txt: 'Don ', lado: 'principio' }, 'Luis'), 'Don Luis');
comprobar('texto fijo detrás', uno({ op: 'texto', txt: ' (baja)', lado: 'final' }, 'Luis'), 'Luis (baja)');
comprobar('texto fijo sobre vacío sigue vacío', uno({ op: 'texto', txt: 'Don ', lado: 'principio' }, ''), '');
comprobar('quitar los últimos', uno({ op: 'quitarFin', n: 2 }, 'ABCDE'), 'ABC');
comprobar('quitar los primeros', uno({ op: 'quitarIni', n: 2 }, 'ABCDE'), 'CDE');
comprobar('partir: la primera parte', uno({ op: 'partir', signo: ',', parte: '1' }, 'Pons, Ana'), 'Pons');
comprobar('partir: la segunda parte', uno({ op: 'partir', signo: ',', parte: '2' }, 'Pons, Ana'), 'Ana');
comprobar('partir: la tercera que no hay queda vacía', uno({ op: 'partir', signo: ',', parte: '3' }, 'Pons, Ana'), '');
comprobar('partir: la última parte', uno({ op: 'partir', signo: ' ', parte: 'u' }, 'Ana María Pons'), 'Pons');
comprobar('mayúsculas', uno({ op: 'letras', modo: 'mayus' }, 'Ana Pons'), 'ANA PONS');
comprobar('minúsculas', uno({ op: 'letras', modo: 'minus' }, 'Ana Pons'), 'ana pons');
comprobar('cada palabra con mayúscula', uno({ op: 'letras', modo: 'cada' }, 'aNA maría pONS'), 'Ana María Pons');

console.log('--- 2. pasos para decidir ---');
const si = (cond, val) => ({ op: 'si', campo: col('Y'), cond, val, ent: 'SÍ', sino: 'NO' });
comprobar('si es igual a', uno(si('igual', 'a'), 'x', { Y: 'A' }), 'SÍ');
comprobar('si es distinto de', uno(si('distinto', 'a'), 'x', { Y: 'A' }), 'NO');
comprobar('si contiene', uno(si('contiene', 'ar'), 'x', { Y: 'Mar' }), 'SÍ');
comprobar('si empieza por', uno(si('empieza', 'ma'), 'x', { Y: 'Mar' }), 'SÍ');
comprobar('si está vacío', uno(si('vacio', ''), 'x', { Y: '' }), 'SÍ');
comprobar('si tiene dato', uno(si('lleno', ''), 'x', { Y: '' }), 'NO');
comprobar('si sin campo mira el valor de arriba', uno({ op: 'si', campo: null, cond: 'igual', val: 'x', ent: 'SÍ', sino: 'NO' }, 'x'), 'SÍ');
comprobar('casilla vacía: sigue el valor de arriba', uno({ op: 'si', campo: col('Y'), cond: 'igual', val: 'zzz', ent: 'SÍ', sino: '' }, 'tal', { Y: 'A' }), 'tal');
comprobar('si está vacío, usa otro campo', uno({ op: 'vacio', campo: col('Y') }, '', { Y: 'reserva' }), 'reserva');
comprobar('si no está vacío, no lo toca', uno({ op: 'vacio', campo: col('Y') }, 'mío', { Y: 'reserva' }), 'mío');
const tabla = { op: 'equiv', filas: [{ de: 'ALU', a: 'Alumnado' }, { de: 'PER', a: 'Personal' }], ignorarMayusculas: true, siNoEsta: 'seguir' };
comprobar('equivalencias', uno(tabla, 'alu'), 'Alumnado');
comprobar('equivalencias: lo que no está sigue igual', uno(tabla, 'OTRO'), 'OTRO');
comprobar('equivalencias: lo que no está, vacío', uno(Object.assign({}, tabla, { siNoEsta: 'vaciar' }), 'OTRO'), '');

console.log('--- 3. pasos de fechas ---');
const f = (paso, v, hitos) => {
  contexto.window.Hitos = hitos ? { ultimosLeidos: () => ({ ajustes: { festivos: hitos } }) } : undefined;
  return uno(paso, v);
};
comprobar('sumar días naturales', f({ op: 'fechaSuma', cant: 10, uni: 'dias' }, '05/11/2026'), '15/11/2026');
comprobar('sumar meses', f({ op: 'fechaSuma', cant: 3, uni: 'meses' }, '30/11/2026'), '28/02/2027');
comprobar('sumar días hábiles salta el fin de semana', f({ op: 'fechaSuma', cant: 3, uni: 'habiles' }, '06/11/2026'), '11/11/2026');
comprobar('sumar días hábiles salta un festivo de la app', f({ op: 'fechaSuma', cant: 3, uni: 'habiles' }, '06/11/2026', ['2026-11-10']), '12/11/2026');
comprobar('restar días hábiles', f({ op: 'fechaSuma', cant: -1, uni: 'habiles' }, '09/11/2026'), '06/11/2026');
comprobar('una fecha que no lo es da vacío', f({ op: 'fechaSuma', cant: 3, uni: 'dias' }, 'hola'), '');
comprobar('fecha larga', f({ op: 'fechaFormato', f: 'larga' }, '05/11/2026'), '5 de noviembre de 2026');
comprobar('día de la semana', f({ op: 'fechaFormato', f: 'dia' }, '05/11/2026'), 'jueves');
comprobar('mes en letra', f({ op: 'fechaFormato', f: 'mes' }, '05/11/2026'), 'noviembre');
comprobar('solo el año', f({ op: 'fechaFormato', f: 'anio' }, '2026-11-05'), '2026');
comprobar('edad', typeof f({ op: 'fechaFormato', f: 'edad' }, '05/11/2000'), 'string');
comprobar('edad con fecha de nacimiento de hace 10 años justos o menos es un número', /^\d+$/.test(f({ op: 'fechaFormato', f: 'edad' }, '05/11/2000')), true);

console.log('--- 4. pasos de números ---');
comprobar('sumar una cifra', uno({ op: 'cuenta', oper: '+', modo: 'num', num: 5 }, '10'), '15');
comprobar('restar otro campo', uno({ op: 'cuenta', oper: '-', modo: 'campo', campo: col('Y') }, '10', { Y: '4' }), '6');
comprobar('multiplicar', uno({ op: 'cuenta', oper: '*', modo: 'num', num: 2 }, '1,5'), '3');
comprobar('dividir entre cero queda vacío', uno({ op: 'cuenta', oper: '/', modo: 'num', num: 0 }, '10'), '');
comprobar('algo que no es número queda vacío', uno({ op: 'cuenta', oper: '+', modo: 'num', num: 1 }, 'abc'), '');
comprobar('número en letra: 21', uno({ op: 'enLetra' }, '21'), 'veintiuno');
comprobar('número en letra: 135', uno({ op: 'enLetra' }, '135'), 'ciento treinta y cinco');
comprobar('número en letra: 2026', uno({ op: 'enLetra' }, '2026'), 'dos mil veintiséis');

console.log('--- 5. varios pasos seguidos y campos sobre campos ---');
comprobar('encadenados: minúsculas y luego añadir texto',
  por(col('X'), [{ op: 'letras', modo: 'minus' }, { op: 'texto', txt: 'Sr. ', lado: 'principio' }], persona({ X: 'PONS' })), 'Sr. pons');
comprobar('el resultado de cada paso, uno a uno',
  Calculo.trazar({ origen: col('X'), operacion: 'pasos', pasos: [{ op: 'letras', modo: 'minus' }, { op: 'texto', txt: 'Sr. ', lado: 'principio' }] }, persona({ X: 'PONS' }), {}),
  ['PONS', 'pons', 'Sr. pons']);
const config = { calculados: [
  { id: 'c1', nombre: 'Apellido', categorias: ['ALUMNADO'], origen: col('X'), operacion: 'pasos', pasos: [{ op: 'partir', signo: ',', parte: '1' }] },
  { id: 'c2', nombre: 'Apellido en mayúsculas', categorias: ['ALUMNADO'], origen: { clase: 'calculado', id: 'c1' }, operacion: 'pasos', pasos: [{ op: 'letras', modo: 'mayus' }] }
] };
comprobar('un campo sobre otro calculado', Calculo.evaluar(config.calculados[1], persona({ X: 'Pons, Ana' }), config), 'PONS');
comprobar('cambiar el de abajo cambia el de arriba', Calculo.evaluar(Object.assign({}, config.calculados[1]), persona({ X: 'Luna, Ana' }), config), 'LUNA');
comprobar('quitar un paso cambia el resultado', por(col('X'), [], persona({ X: 'Pons, Ana' })), 'Pons, Ana');

console.log('--- 6. no se guarda lo que no vale ---');
const valida = (c) => Calculo.validar(Object.assign({ id: 'n', nombre: 'Nuevo', categorias: ['ALUMNADO'], origen: col('X'), operacion: 'pasos', pasos: [{ op: 'letras', modo: 'mayus' }] }, c), config);
comprobar('un campo bueno se guarda', valida({}), []);
comprobar('sin pasos no se guarda', valida({ pasos: [] }), ['Añade al menos un paso.']);
comprobar('un paso sin su dato no se guarda', valida({ pasos: [{ op: 'texto', txt: '', lado: 'final' }] }), ['Paso 1: escribe el texto.']);
comprobar('no puede depender de sí mismo (ciclo directo)',
  Calculo.validar({ id: 'c1', nombre: 'Apellido', categorias: ['ALUMNADO'], origen: { clase: 'calculado', id: 'c1' }, operacion: 'pasos', pasos: [{ op: 'letras', modo: 'mayus' }] }, config).some((m) => m.indexOf('ciclo') !== -1), true);
comprobar('no puede depender de sí mismo por un paso (ciclo por otro campo)',
  Calculo.validar({ id: 'c1', nombre: 'Apellido', categorias: ['ALUMNADO'], origen: col('X'), operacion: 'pasos', pasos: [{ op: 'juntar', campo: { clase: 'calculado', id: 'c2' }, sep: ' ', lado: 'final' }] }, config).some((m) => m.indexOf('ciclo') !== -1), true);
comprobar('dependeDe', [Calculo.dependeDe('c2', 'c1', config), Calculo.dependeDe('c1', 'c2', config)], [true, false]);

console.log('--- 7. los calculados de antes dan lo mismo ---');
const viejas = [
  [{ operacion: 'quitarFinal', parametros: { n: 1, soloSiEsLetra: true } }, '1ºA'], [{ operacion: 'quitarFinal', parametros: { n: 2 } }, 'ABCDE'],
  [{ operacion: 'quitarInicio', parametros: { n: 2 } }, 'Unidad-1ºA'],
  [{ operacion: 'partir', parametros: { signo: '-', lado: 'antes', ocurrencia: 'primera' } }, 'a-b-c'], [{ operacion: 'partir', parametros: { signo: '-', lado: 'despues', ocurrencia: 'primera' } }, 'a-b-c'],
  [{ operacion: 'partir', parametros: { signo: '-', lado: 'antes', ocurrencia: 'ultima' } }, 'a-b-c'], [{ operacion: 'partir', parametros: { signo: '-', lado: 'despues', ocurrencia: 'ultima' } }, 'a-b-c'],
  [{ operacion: 'partir', parametros: { signo: '-', lado: 'antes', ocurrencia: 'primera' } }, 'sinsigno'],
  [{ operacion: 'equivalencias', parametros: { pares: [{ de: 'ALU', a: 'Alumnado' }], ignorarMayusculas: true, siNoEsta: 'seguir' } }, 'alu'],
  [{ operacion: 'equivalencias', parametros: { pares: [{ de: 'ALU', a: 'Alumnado' }], ignorarMayusculas: false, siNoEsta: 'vaciar' } }, 'alu'],
  [{ operacion: 'juntar', parametros: { origen2: col('Y'), separador: ' - ' } }, 'Ana'],
  [{ operacion: 'deFecha', parametros: { que: 'anio' } }, '05/11/2026'], [{ operacion: 'deFecha', parametros: { que: 'anioAcademico' } }, '05/11/2026'], [{ operacion: 'deFecha', parametros: { que: 'anio' } }, 'no es fecha']
];
viejas.forEach(([parte, valor], i) => {
  const vieja = Object.assign({ id: 'v', nombre: 'V', categorias: ['ALUMNADO'], origen: col('X') }, parte);
  const p = persona({ X: valor, Y: 'Pons' });
  const nueva = Object.assign({}, vieja, { operacion: 'pasos', parametros: {}, pasos: CamposPasos.deLegado(vieja) });
  comprobar('la vieja ' + (i + 1) + ' (' + parte.operacion + ') da lo mismo como pasos', Calculo.evaluar(nueva, p, {}), Calculo.evaluar(vieja, p, {}));
});

console.log('--- 7b. partir de un dato que no está en la ficha ---');
const ana = { nombre: 'Ana Pons', campos: {} };
const nie = { clase: 'dato', id: 'h:nie', nombre: 'Nº de identificación escolar' };
comprobar('sin leer el dato, sale vacío', por(nie, [{ op: 'texto', txt: 'Id. ', lado: 'principio' }], ana), '');
contexto.CamposDatosCache.poner('h:nie', ana, '1140233');
comprobar('leído el dato, el campo lo usa', por(nie, [{ op: 'texto', txt: 'Id. ', lado: 'principio' }], ana), 'Id. 1140233');
comprobar('un paso puede usar el dato de otra parte', uno({ op: 'juntar', campo: nie, sep: '-', lado: 'final' }, 'Ana', {}) , 'Ana');
comprobar('los datos de otra parte de una receta', contexto.CamposDatosCache.idsDe({ origen: nie, operacion: 'pasos', pasos: [] }, {}), ['h:nie']);

console.log('--- 8. lo que se guarda en campos.json ---');
const leido = Campos.normalizar({ calculados: [{ id: 'c9', nombre: 'Por pasos', categorias: ['ALUMNADO'], grupo: 'Asunto', origen: col('X'), operacion: 'pasos', pasos: [{ op: 'letras', modo: 'mayus' }, { sinOp: 1 }] }] });
comprobar('un campo por pasos se conserva, con su grupo y sus pasos buenos', [leido.calculados.length, leido.calculados[0].grupo, leido.calculados[0].pasos], [1, 'Asunto', [{ op: 'letras', modo: 'mayus' }]]);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
