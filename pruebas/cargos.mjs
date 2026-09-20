/* Prueba de js/cargos.js (20-sep-2026, fila 81, docs/FIRMANTES-Y-MEMBRETE.md,
   parte 1), sin navegador: solo las funciones puras (enFecha, vigente,
   solapes), que son las que de verdad hay que blindar. Nada de fechas
   escritas a mano: todo se cuenta desde hoy (regla de docs/CONTEXTO.md). */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;
const contexto = { console, window: {} };
vm.createContext(contexto);
for (const f of ['util.js', 'cargos.js']) {
  vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
}
const { U, Cargos } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}

function iso(base, dias) {
  const d = new Date(base + 'T00:00:00');
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

const HOY = U.hoyIso();

function datosCon(ocupantes) {
  return { cargos: [{ id: 'direccion', nombre: 'Dirección', orden: 1, tratamiento: 'El Director', ocupantes: ocupantes }] };
}

console.log('--- 1. Un ocupante único, sin cese ---');
{
  const datos = datosCon([{ id: 'o1', persona: 'Ana Pérez', desde: iso(HOY, -400), hasta: '' }]);
  comprobar('vigente hoy', Cargos.vigente(datos, 'direccion'),
    { persona: 'Ana Pérez', tratamiento: 'El Director', nombre: 'Dirección' });
  comprobar('vigente dentro de un año', Cargos.enFecha(datos, 'direccion', iso(HOY, 365)),
    { persona: 'Ana Pérez', tratamiento: 'El Director', nombre: 'Dirección' });
}

console.log('--- 2. Dos ocupantes en cadena ---');
{
  const datos = datosCon([
    { id: 'o1', persona: 'Ana Pérez', desde: iso(HOY, -400), hasta: iso(HOY, -100) },
    { id: 'o2', persona: 'Luis Ruiz', desde: iso(HOY, -99), hasta: '' }
  ]);
  comprobar('vigente hoy es el segundo', Cargos.vigente(datos, 'direccion'),
    { persona: 'Luis Ruiz', tratamiento: 'El Director', nombre: 'Dirección' });
  comprobar('vigente hace 200 días es el primero', Cargos.enFecha(datos, 'direccion', iso(HOY, -200)),
    { persona: 'Ana Pérez', tratamiento: 'El Director', nombre: 'Dirección' });
}

console.log('--- 3. Una fecha anterior a todos ---');
{
  const datos = datosCon([{ id: 'o1', persona: 'Ana Pérez', desde: iso(HOY, -100), hasta: '' }]);
  comprobar('antes de que nadie ocupara el cargo', Cargos.enFecha(datos, 'direccion', iso(HOY, -500)), null);
}

console.log('--- 4. Un hueco entre el cese de uno y el alta del siguiente ---');
{
  const datos = datosCon([
    { id: 'o1', persona: 'Ana Pérez', desde: iso(HOY, -400), hasta: iso(HOY, -100) },
    { id: 'o2', persona: 'Luis Ruiz', desde: iso(HOY, -50), hasta: '' }
  ]);
  comprobar('en el hueco no hay nadie', Cargos.enFecha(datos, 'direccion', iso(HOY, -75)), null);
}

console.log('--- 5. Un solape ---');
{
  const datos = datosCon([
    { id: 'o1', persona: 'Ana Pérez', desde: iso(HOY, -400), hasta: iso(HOY, -50) },
    { id: 'o2', persona: 'Luis Ruiz', desde: iso(HOY, -100), hasta: '' }
  ]);
  const pares = Cargos.solapes(datos.cargos[0]);
  comprobar('un par de ocupantes se solapan', pares.length, 1);
}

console.log('--- 6. Sin solape ---');
{
  const datos = datosCon([
    { id: 'o1', persona: 'Ana Pérez', desde: iso(HOY, -400), hasta: iso(HOY, -100) },
    { id: 'o2', persona: 'Luis Ruiz', desde: iso(HOY, -99), hasta: '' }
  ]);
  comprobar('sin solape', Cargos.solapes(datos.cargos[0]).length, 0);
}

console.log('--- 7. Un cargo sin ocupantes ---');
{
  const datos = datosCon([]);
  comprobar('sin ocupantes, vigente es null', Cargos.vigente(datos, 'direccion'), null);
  comprobar('sin ocupantes, sin solapes', Cargos.solapes(datos.cargos[0]).length, 0);
}

console.log('--- 8. Un cargo que no existe ---');
{
  const datos = datosCon([{ id: 'o1', persona: 'Ana Pérez', desde: iso(HOY, -10), hasta: '' }]);
  comprobar('cargo desconocido', Cargos.enFecha(datos, 'no-existe', HOY), null);
}

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
