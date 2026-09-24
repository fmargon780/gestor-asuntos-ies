/* Prueba de lógica (jsdom, sin navegador de verdad) de "Datos y
   contacto" nuevo (17-sep-2026, fila 37 de la cola,
   docs/FICHA-DEL-ASUNTO-NUEVA.md).

   Mismo patrón que pruebas/lo-pide.mjs: se cargan los ficheros de
   verdad en una página jsdom y se llama a sus funciones públicas, sin
   Playwright ni Chromium. Las dos funciones nuevas viven en
   js/datos.js (`Datos.tutoresDe`, `Datos.resumenDeTercero`), puras y
   probables sin navegador, tal y como pide el encargo (5).

   Los ocho escenarios de la sección 6 del encargo:
     1. `tutoresDe` con títulos "Tutor1 - ..." / "Tutor 2 ...": dos
        tarjetas, cada dato en la suya.
     2. Lo mismo con "Primer tutor" / "Segundo tutor".
     3. Una columna de familia sin número: no se pierde, cae en "otros".
     4. Un alumno sin tutores: ninguna tarjeta, sin romper nada.
     5. `resumenDeTercero` de un menor: el teléfono es el del primer
        tutor.
     6. `resumenDeTercero` de un mayor de edad: el teléfono es el suyo.
     7. Alumno no matriculado: etiqueta ámbar y renglón de última
        matrícula.
     8. Solicitante: etiqueta azul, sin renglón de última matrícula. */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../js/', import.meta.url));

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function comprobarQue(titulo, condicion, detalle) {
  if (!condicion) { fallos++; console.log('FALLA  ' + titulo + (detalle ? '\n   ' + detalle : '')); }
  else console.log('bien   ' + titulo);
}

const dom = new JSDOM('<!doctype html><html><body></body></html>', { runScripts: 'outside-only' });
const win = dom.window;

for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'datos.js', 'datos-alumnado.js', 'datos-personal.js', 'datos-resumen.js', 'datos-listas.js', 'datos-tutores.js', 'dni.js', 'ficha-tercero-alumno.js']) {
  win.eval(fs.readFileSync(RAIZ + f, 'utf8'));
}
const { Datos } = win;

comprobarQue('el módulo Datos existe', typeof Datos === 'object');
comprobarQue('Datos.tutoresDe existe (si esto falla, falta la función nueva)', typeof Datos.tutoresDe === 'function');
comprobarQue('Datos.resumenDeTercero existe (si esto falla, falta la función nueva)', typeof Datos.resumenDeTercero === 'function');

/* Una fecha de nacimiento que da exactamente `anios` de edad hoy,
   nazca cuando nazca quien ejecute la prueba: el 1 de enero ya ha
   pasado siempre en cualquier otro día del año. */
function fechaParaEdad(anios) {
  const hoy = new Date();
  return '01/01/' + (hoy.getFullYear() - anios);
}

/* ============================================================
   1. Tutor1 / Tutor 2: dos tarjetas, cada dato en la suya.
   ============================================================ */
{
  const alumno = {
    nombre: 'Pérez Ruiz, Ana', id: '12345', ano: 2026, categoria: 'ALUMNADO',
    matriculado: true, unidad: '2º ESO B', curso: '2º ESO', fechaNac: fechaParaEdad(15),
    anoUltima: 0, unidadUltima: '', cursoUltima: '',
    campos: {
      'Tutor1 - Nombre': 'María Ruiz Gómez',
      'Tutor1 - Teléfono': '612345678',
      'Tutor1 - Correo': 'maria@ejemplo.es',
      'Tutor 2 Nombre': 'Juan Pérez Soto',
      'Tutor 2 Móvil': '698765432'
    }
  };
  const tutores = Datos.tutoresDe(alumno);
  comprobarQue('1. dos tarjetas de tutor', tutores.length === 2, JSON.stringify(tutores));
  comprobar('1. el tutor 1 trae su nombre, teléfono y correo, y solo los suyos', tutores[0], {
    numero: 1, nombre: 'María Ruiz Gómez', relacion: '',
    telefonos: ['612345678'], correos: ['maria@ejemplo.es'], documento: '', otros: [], sexo: '', iniciales: 'MR'
  });
  comprobar('1. el tutor 2 trae su nombre y su móvil, sin mezclarse con el 1', tutores[1], {
    numero: 2, nombre: 'Juan Pérez Soto', relacion: '',
    telefonos: ['698765432'], correos: [], documento: '', otros: [], sexo: '', iniciales: 'JP'
  });
}

/* ============================================================
   2. "Primer tutor" / "Segundo tutor".
   ============================================================ */
{
  const alumno = {
    nombre: 'García López, Luis', id: '22222', categoria: 'ALUMNADO',
    matriculado: true, unidad: '1º ESO A', curso: '1º ESO', fechaNac: fechaParaEdad(12),
    campos: {
      'Primer tutor: nombre': 'Elena López Vidal',
      'Primer tutor: correo': 'elena@ejemplo.es',
      'Segundo tutor - Teléfono': '611222333'
    }
  };
  const tutores = Datos.tutoresDe(alumno);
  comprobarQue('2. dos tarjetas con "Primer/Segundo tutor"', tutores.length === 2, JSON.stringify(tutores));
  comprobar('2. el primer tutor', tutores[0], {
    numero: 1, nombre: 'Elena López Vidal', relacion: '',
    telefonos: [], correos: ['elena@ejemplo.es'], documento: '', otros: [], sexo: '', iniciales: 'EL'
  });
  comprobar('2. el segundo tutor', tutores[1], {
    numero: 2, nombre: '', relacion: '',
    telefonos: ['611222333'], correos: [], documento: '', otros: [], sexo: '', iniciales: ''
  });
}

/* ============================================================
   3. Una columna de familia sin número: no se pierde, cae en "otros".
   ============================================================ */
{
  const alumno = {
    nombre: 'Ortega Ruiz, Marta', id: '33333', categoria: 'ALUMNADO',
    matriculado: true, unidad: '3º ESO C', curso: '3º ESO', fechaNac: fechaParaEdad(14),
    campos: {
      'Tutor1 - Nombre': 'Sonia Ruiz Cano',
      'Tutor1 - Teléfono': '655444333',
      'Domicilio familiar': 'Calle Mayor 4'
    }
  };
  const tutores = Datos.tutoresDe(alumno);
  comprobarQue('3. una tarjeta de tutor', tutores.length === 1);
  comprobarQue('3. la columna sin número cae en "otros", no se pierde',
    tutores.otros.some((f) => f.titulo === 'Domicilio familiar' && f.valor === 'Calle Mayor 4'),
    JSON.stringify(tutores.otros));
}

/* ============================================================
   4. Un alumno sin tutores: ninguna tarjeta, sin romper nada.
   ============================================================ */
{
  const alumno = {
    nombre: 'Solo Solo, Pedro', id: '44444', categoria: 'ALUMNADO',
    matriculado: true, unidad: '4º ESO A', curso: '4º ESO', fechaNac: fechaParaEdad(16),
    campos: { 'Teléfono': '600111222' }
  };
  const tutores = Datos.tutoresDe(alumno);
  comprobar('4. sin columnas de familia, ninguna tarjeta', tutores, []);
  comprobarQue('4. `.otros` sigue siendo un array vacío, no null ni undefined',
    Array.isArray(tutores.otros) && tutores.otros.length === 0);
}

/* ============================================================
   5. resumenDeTercero de un menor: el teléfono es el del primer tutor.
   ============================================================ */
{
  const alumno = {
    nombre: 'Pérez Ruiz, Ana', id: '12345', ano: 2026, categoria: 'ALUMNADO',
    matriculado: true, unidad: '2º ESO B', curso: '2º ESO', fechaNac: fechaParaEdad(15),
    campos: {
      'Tutor1 - Nombre': 'María Ruiz Gómez',
      'Tutor1 - Teléfono': '612345678',
      'Teléfono del alumno': '699888777'   /* el suyo propio: no debe salir */
    }
  };
  const r = Datos.resumenDeTercero(alumno, 'ALUMNADO');
  comprobar('5. de un menor, el teléfono es el del primer tutor', r.telefono,
    { valor: '612345678', etiqueta: 'Tutor legal 1' });
  comprobar('5. la edad calculada', r.edad, '15 años');
}

/* ============================================================
   6. resumenDeTercero de un mayor de edad: el teléfono es el suyo.
   ============================================================ */
{
  const alumno = {
    nombre: 'Nuevo Mayor, Carla', id: '55555', ano: 2026, categoria: 'ALUMNADO',
    matriculado: true, unidad: '2º BACH A', curso: '2º BACH', fechaNac: fechaParaEdad(19),
    campos: {
      'Tutor1 - Nombre': 'Nombre Que No Debe Salir',
      'Tutor1 - Teléfono': '600000000',
      'Teléfono': '699111222'
    }
  };
  const r = Datos.resumenDeTercero(alumno, 'ALUMNADO');
  comprobar('6. de un mayor de edad, el teléfono es el suyo, sin etiqueta de tutor', r.telefono,
    { valor: '699111222', etiqueta: '' });
}

/* ============================================================
   7. Alumno no matriculado: etiqueta ámbar y renglón de última
   matrícula.
   ============================================================ */
{
  const alumno = {
    nombre: 'Viejo Alumno, Iván', id: '66666', categoria: 'ALUMNADO',
    matriculado: false, solicitante: false, unidad: '', curso: '',
    anoUltima: 2025, unidadUltima: '4º ESO A', cursoUltima: '4º ESO',
    fechaNac: fechaParaEdad(17), campos: {}
  };
  const r = Datos.resumenDeTercero(alumno, 'ALUMNADO');
  comprobar('7. etiqueta ámbar "NO MATRICULADO ..."', r.grupo && r.grupo.clase, 'ambar');
  comprobarQue('7. el texto de la etiqueta empieza por NO MATRICULADO',
    r.grupo.texto.indexOf('NO MATRICULADO') === 0, r.grupo.texto);
  comprobarQue('7. el renglón de última matrícula trae el curso y el grupo',
    r.grupo.detalle.indexOf('25-26') !== -1 && r.grupo.detalle.indexOf('4º ESO A') !== -1,
    r.grupo.detalle);
}

/* ============================================================
   8. Solicitante: etiqueta azul, sin renglón de última matrícula.
   ============================================================ */
{
  const alumno = {
    nombre: 'Nuevo Solicitante, Eva', id: '', categoria: 'ALUMNADO',
    matriculado: false, solicitante: true, unidad: '', curso: '',
    anoUltima: 0, unidadUltima: '', cursoUltima: '',
    fechaNac: fechaParaEdad(6), campos: {}
  };
  const r = Datos.resumenDeTercero(alumno, 'ALUMNADO');
  comprobar('8. etiqueta azul "SOLICITANTE"', r.grupo, { texto: 'SOLICITANTE', clase: 'azul' });
  comprobarQue('8. sin renglón de última matrícula (undefined: no se llegó a poner `detalle`)',
    r.grupo.detalle === undefined);
}

/* ============================================================
   9. El caso real de la fila 108 (docs/CONTACTO-EN-TARJETAS.md): las
      ocho columnas de tutores de Séneca, con «Primer apellido Segundo
      tutor» (el «primer» es del apellido, no del tutor).
   ============================================================ */
{
  const alumno = {
    nombre: 'Bonilla García, Ángel', id: '1234567', categoria: 'ALUMNADO', ano: 2026,
    matriculado: true, unidad: '3º ESO A', curso: '3º de E.S.O.', fechaNac: fechaParaEdad(13),
    campos: {
      'Sexo': 'H',
      'Teléfono': '655645995',
      'Teléfono personal': '655 645 995',
      'Correo electrónico personal': 'abongar2909@g.educaand.es',
      'Primer apellido Primer tutor': 'García',
      'Segundo apellido Primer tutor': 'Gallego',
      'Nombre Primer tutor': 'Isabel María',
      'Sexo Primer tutor': 'M',
      'Teléfono Primer tutor': '655645995',
      'Primer apellido Segundo tutor': 'Bonilla',
      'Segundo apellido Segundo tutor': 'Fernández',
      'Nombre Segundo tutor': 'Jesús',
      'Sexo Segundo tutor': 'H',
      'Correo electrónico Segundo tutor': 'jesus@correo.es'
    }
  };
  const tutores = Datos.tutoresDe(alumno);
  comprobar('9. dos tutores, cada uno con su nombre entero',
    tutores.map((t) => [t.numero, t.nombre, t.sexo, t.iniciales]),
    [[1, 'Isabel María García Gallego', 'M', 'IM'], [2, 'Jesús Bonilla Fernández', 'H', 'JB']]);
  comprobar('9. sin datos sueltos colgando (nada en «otros»)',
    [tutores[0].otros.length, tutores[1].otros.length, tutores.otros.length], [0, 0, 0]);

  const caja = win.document.createElement('div');
  const v = win.FichaTerceroAlumno.ventana(alumno, Datos.resumenDeTercero(alumno, 'ALUMNADO'), null);
  caja.innerHTML = v.html;
  win.document.body.appendChild(caja);
  v.montar(caja);
  const texto = caja.textContent;
  comprobar('9. la cabecera, con el nombre en orden natural',
    caja.querySelector('.vt-nombre').textContent, 'Ángel Bonilla García');
  comprobarQue('9. «nacido el», porque es un chico', caja.querySelector('.vt-sub').textContent.indexOf('nacido el') !== -1);
  comprobar('9. tres tarjetas: el alumno y los dos tutores',
    caja.querySelectorAll('.vt-tarjeta').length, 3);
  comprobar('9. los tutores, con su nombre y su etiqueta',
    Array.from(caja.querySelectorAll('.vt-tarjeta-tutor')).map((t) =>
      [t.querySelector('.vt-tutor-nombre').textContent, t.querySelector('.vt-etq-chica').textContent]),
    [['Isabel María García Gallego', 'Tutora 1'], ['Jesús Bonilla Fernández', 'Tutor 2']]);
  /* Fuera de «Todo lo que trae Séneca», que sigue enseñando las columnas tal cual. */
  const tarjetas = caja.querySelector('#vt-tarjetas').textContent;
  comprobarQue('9. ninguna línea «Sexo…» ni «Primer apellido Segundo tutor…» en las tarjetas',
    tarjetas.indexOf('Sexo') === -1 && tarjetas.indexOf('Primer apellido') === -1);
  const telAlumno = caja.querySelectorAll('.vt-tarjeta-alumno .vt-dato-telefono');
  comprobar('9. el teléfono del alumno, una sola vez y en grupos de tres',
    Array.from(telAlumno).map((d) => d.querySelector('.vt-valor').textContent), ['655 645 995']);
  comprobar('9. con «mismo que la tutora 1»',
    telAlumno[0].querySelector('.vt-pie').textContent, 'mismo que la tutora 1');
  comprobarQue('9. sin «Otros datos de la familia»', texto.indexOf('Otros datos de la familia') === -1);
  comprobar('9. «Copiar todo el contacto», una línea por persona', v.textoDeTodo(), [
    'Ángel Bonilla García (3º ESO A) · 655645995 · abongar2909@g.educaand.es',
    'Tutora 1: Isabel María García Gallego · 655645995',
    'Tutor 2: Jesús Bonilla Fernández · jesus@correo.es'].join('\n'));
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
