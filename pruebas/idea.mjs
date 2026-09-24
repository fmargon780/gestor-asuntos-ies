/* Prueba de docs/DESTINATARIOS-EN-SENECA.md (fila 47, 17-sep-2026),
   la parte que se puede probar sin datos reales ni navegador: el
   usuario IdEA leído por el título de la columna del CSV.

   Lo que de verdad necesita el navegador (el desplegable "Añadir un
   grupo" también en el cuadro de Séneca, los chips, "Copiar el
   siguiente") se prueba en pruebas/seneca-destinatarios-navegador.mjs.

   Mismo estilo que pruebas/grupos.mjs: los ficheros se cargan tal
   cual en un contexto de Node con `vm`. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, window: {} };
vm.createContext(contexto);
for (const f of ['util.js', 'util-parecidos.js', 'util-pantalla.js', 'idea.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { IdEA } = contexto.window;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

function persona(campos) { return { campos: campos }; }

/* ---------- 1. usuarioDe: títulos buenos ---------- */

comprobar('1a. columna "Usuario IdEA"',
  IdEA.usuarioDe(persona({ 'Usuario IdEA': 'jlopezg123' })), 'jlopezg123');
comprobar('1b. columna "Usuario" a secas',
  IdEA.usuarioDe(persona({ Usuario: 'mgarcia45' })), 'mgarcia45');
comprobar('1c. columna "IdEA" a secas',
  IdEA.usuarioDe(persona({ IdEA: 'psanchez7' })), 'psanchez7');

/* ---------- 2. usuarioDe: títulos malos ---------- */

comprobar('2a. "Clave IdEA" no vale (es la clave, no el usuario)',
  IdEA.usuarioDe(persona({ 'Clave IdEA': 'jlopezg123' })), '');
comprobar('2b. "Contraseña de usuario" no vale',
  IdEA.usuarioDe(persona({ 'Contraseña de usuario': 'jlopezg123' })), '');
comprobar('2c. "PIN de usuario" no vale',
  IdEA.usuarioDe(persona({ 'PIN de usuario': '1234' })), '');
comprobar('2d. "Correo del usuario" no vale (es un correo, no un usuario IdEA)',
  IdEA.usuarioDe(persona({ 'Correo del usuario': 'jlopezg123@correo.es' })), '');
comprobar('2e. una columna sin "idea" ni "usuario" no vale, aunque el valor parezca uno',
  IdEA.usuarioDe(persona({ Empleado: 'jlopezg123' })), '');

/* ---------- 3. la arroba delante se quita ---------- */

comprobar('3. "@jlopezg123" se guarda sin la arroba',
  IdEA.usuarioDe(persona({ Usuario: '@jlopezg123' })), 'jlopezg123');

/* ---------- 4. valores que no parecen un usuario ---------- */

comprobar('4a. muy corto (menos de 4 caracteres)',
  IdEA.usuarioDe(persona({ Usuario: 'abc' })), '');
comprobar('4b. muy largo (más de 30 caracteres)',
  IdEA.usuarioDe(persona({ Usuario: 'a'.repeat(31) })), '');
comprobar('4c. con espacios',
  IdEA.usuarioDe(persona({ Usuario: 'juan lopez' })), '');
comprobar('4d. con arroba en medio (es un correo, no un usuario)',
  IdEA.usuarioDe(persona({ Usuario: 'jlopez@correo.es' })), '');
comprobar('4e. vacío',
  IdEA.usuarioDe(persona({ Usuario: '' })), '');
comprobar('4f. si el primero no vale, se prueba con la siguiente columna buena',
  IdEA.usuarioDe(persona({ 'Usuario 1': '  ', Usuario: 'jlopezg123' })), 'jlopezg123');

/* ---------- 5. columnas de tutor: aparte, nunca mezcladas ---------- */

const ALUMNO = persona({
  Usuario: 'alumno123',
  'Usuario IdEA tutor 1': 'tutor1abc',
  'Usuario IdEA tutor 2': 'tutor2xyz',
  'Usuario IdEA de la madre': 'usomadre1'
});
comprobar('5a. usuarioDe del alumno no coge el de los tutores',
  IdEA.usuarioDe(ALUMNO), 'alumno123');
comprobar('5b. usuarioDelTutor(1) coge el del tutor 1',
  IdEA.usuarioDelTutor(ALUMNO, 1), 'tutor1abc');
comprobar('5c. usuarioDelTutor(2) coge el del tutor 2',
  IdEA.usuarioDelTutor(ALUMNO, 2), 'tutor2xyz');

const SOLO_TUTOR = persona({ 'Usuario IdEA del padre': 'papa9999' });
comprobar('5d. un alumno sin usuario propio pero con el del padre: usuarioDe vacío',
  IdEA.usuarioDe(SOLO_TUTOR), '');
comprobar('5e. y "responsable"/"familia" también cuentan como tutor',
  IdEA.usuarioDe(persona({ 'Usuario del responsable': 'resp1234' })), '');

comprobar('5f. sin ninguna columna de tutor, usuarioDelTutor devuelve vacío',
  IdEA.usuarioDelTutor(persona({ Usuario: 'alumno123' }), 1), '');

/* ---------- 6. usuariosDeGrupo: sin repetidos y con gente sin usuario ---------- */

const CON_USUARIO_A = { nombre: 'Alba García, Ana 1001', persona: persona({ Usuario: 'agarcia1' }) };
const CON_USUARIO_B = { nombre: 'Blanco López, Bea 1002', persona: persona({ Usuario: 'AGARCIA1' }) }; /* mismo, en mayúsculas */
const SIN_USUARIO = { nombre: 'Cortés Ruiz, Carla 1003', persona: persona({}) };
const SIN_PERSONA = { nombre: 'Duque Sanz, Diego 1004', persona: null };

const RESULTADO_6 = IdEA.usuariosDeGrupo([CON_USUARIO_A, CON_USUARIO_B, SIN_USUARIO, SIN_PERSONA]);
comprobar('6a. el usuario repetido (en mayúsculas) no se cuenta dos veces',
  RESULTADO_6.usuarios, ['agarcia1']);
comprobar('6b. quien no tiene usuario (o no se ha encontrado su ficha) va aparte',
  RESULTADO_6.sinUsuario.sort(),
  ['Cortés Ruiz, Carla 1003', 'Duque Sanz, Diego 1004'].sort());

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
