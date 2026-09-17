/* Prueba de la fila 37 (docs/FICHA-DEL-ASUNTO-NUEVA.md): los tutores
   agrupados por persona (`Datos.tutoresDe`) y la línea resumen
   (`Datos.resumenDeTercero`), las dos puras, sin navegador. Mismo
   patrón que pruebas/dni-personal.mjs: un contexto de mentira con
   `vm`, sin DOM de verdad. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = {
  console, TextDecoder, Blob, window: {}, indexedDB: null,
  App: { E: {} }, $: function () { return {}; }
};
vm.createContext(contexto);
for (const f of ['util.js', 'nombres.js', 'datos.js', 'dni.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { Datos } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

const HOY = new Date();
function hace(anos) {
  const d = new Date(HOY.getFullYear() - anos, HOY.getMonth(), HOY.getDate());
  return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
}

/* ---------- 1. "Tutor1 - ..." / "Tutor 2 ..." ---------- */
const alumno1 = {
  nombre: 'Pérez Ruiz, Ana', fechaNac: hace(15), matriculado: true, unidad: '2º ESO B', curso: '26-27',
  campos: {
    'Tutor1 - Nombre': 'Pérez López, Juan', 'Tutor1 - Teléfono': '612345678',
    'Tutor1 - Correo': 'juan@example.com',
    'Tutor 2 Nombre': 'Ruiz García, María', 'Tutor 2 Móvil': '699888777'
  }
};
const t1 = Datos.tutoresDe(alumno1);
comprobar('1. dos tarjetas', t1.length, 2);
comprobar('1. la primera es el tutor 1, con su nombre y teléfono',
  { numero: t1[0].numero, nombre: t1[0].nombre, telefonos: t1[0].telefonos, correos: t1[0].correos },
  { numero: '1', nombre: 'Pérez López, Juan', telefonos: ['612345678'], correos: ['juan@example.com'] });
comprobar('1. la segunda es el tutor 2, con su nombre y móvil',
  { numero: t1[1].numero, nombre: t1[1].nombre, telefonos: t1[1].telefonos },
  { numero: '2', nombre: 'Ruiz García, María', telefonos: ['699888777'] });

/* ---------- 2. "Primer tutor" / "Segundo tutor" ---------- */
const alumno2 = {
  nombre: 'Gómez Ortiz, Luis', fechaNac: hace(10), matriculado: true, unidad: '5º Primaria A', curso: '26-27',
  campos: {
    'Primer tutor - Nombre y apellidos': 'Gómez Vela, Carlos', 'Primer tutor - Teléfono': '655111222',
    'Segundo tutor: nombre': 'Ortiz Mena, Laura', 'Segundo tutor: correo': 'laura@example.com'
  }
};
const t2 = Datos.tutoresDe(alumno2);
comprobar('2. dos tarjetas también con "Primer/Segundo tutor"', t2.length, 2);
comprobar('2. el primer tutor trae su nombre y teléfono',
  { nombre: t2[0].nombre, telefonos: t2[0].telefonos }, { nombre: 'Gómez Vela, Carlos', telefonos: ['655111222'] });
comprobar('2. el segundo tutor trae su nombre y correo',
  { nombre: t2[1].nombre, correos: t2[1].correos }, { nombre: 'Ortiz Mena, Laura', correos: ['laura@example.com'] });

/* ---------- 3. columna de familia sin número: cae en "otros" ---------- */
const alumno3 = {
  nombre: 'Salas Reina, Iker', fechaNac: hace(9), matriculado: true, unidad: '4º Primaria B', curso: '26-27',
  campos: {
    'Tutor1 - Nombre': 'Salas Ferrer, Pedro', 'Tutor1 - Teléfono': '644000111',
    'Observaciones familia': 'Familia numerosa'
  }
};
const t3 = Datos.tutoresDe(alumno3);
comprobar('3. una tarjeta (el tutor 1)', t3.length, 1);
comprobar('3. la columna sin número no se pierde: cae en .otros',
  t3.otros, [{ titulo: 'Observaciones familia', valor: 'Familia numerosa' }]);

/* ---------- 4. alumno sin tutores ---------- */
const alumno4 = { nombre: 'Solo Cano, Marta', fechaNac: hace(11), matriculado: true, unidad: '6º Primaria A', curso: '26-27', campos: {} };
comprobar('4. sin tutores: ninguna tarjeta', Datos.tutoresDe(alumno4), []);
const resumen4 = Datos.resumenDeTercero(alumno4, 'ALUMNADO');
comprobar('4. resumenDeTercero no revienta sin tutores', resumen4.telefono, null);

/* ---------- 5. resumenDeTercero de un menor: el teléfono es el del primer tutor ---------- */
const resumen1 = Datos.resumenDeTercero(alumno1, 'ALUMNADO');
comprobar('5. el teléfono del menor es el del tutor legal 1',
  resumen1.telefono, { etiqueta: 'Tutor legal 1:', valor: '612345678' });

/* ---------- 6. resumenDeTercero de un mayor de edad: el teléfono es el suyo ---------- */
const mayor = {
  nombre: 'Ferrer Nuño, Alba', fechaNac: hace(19), matriculado: true, unidad: '2º Bachillerato A', curso: '26-27',
  campos: { 'Teléfono': '677123456', 'Tutor1 - Teléfono': '600000000' }
};
const resumenMayor = Datos.resumenDeTercero(mayor, 'ALUMNADO');
comprobar('6. el teléfono de un mayor de edad es el suyo, no el del tutor',
  resumenMayor.telefono, { etiqueta: '', valor: '677123456' });

/* ---------- 7. alumno no matriculado: etiqueta ámbar y última matrícula ---------- */
const noMatriculado = {
  nombre: 'Vidal Soto, Pau', fechaNac: hace(14), matriculado: false, solicitante: false,
  anoUltima: 2025, unidadUltima: '4º ESO A', cursoUltima: '25-26', campos: {}
};
const resumenNoMat = Datos.resumenDeTercero(noMatriculado, 'ALUMNADO');
comprobar('7. etiqueta ámbar', resumenNoMat.etiqueta.clase, 'ambar');
comprobar('7. el texto empieza por NO MATRICULADO', resumenNoMat.etiqueta.texto.indexOf('NO MATRICULADO') === 0, true);
comprobar('7. renglón de última matrícula, con el curso y el grupo',
  resumenNoMat.etiqueta.sub, 'última matrícula: 25-26  ·  4º ESO A');

/* ---------- 8. solicitante: etiqueta azul, sin renglón de última matrícula ---------- */
const solicitante = { nombre: 'Roldán Vera, Nora', fechaNac: hace(6), matriculado: false, solicitante: true, campos: {} };
const resumenSol = Datos.resumenDeTercero(solicitante, 'ALUMNADO');
comprobar('8. etiqueta azul', resumenSol.etiqueta, { texto: 'SOLICITANTE', clase: 'azul', sub: '' });

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
