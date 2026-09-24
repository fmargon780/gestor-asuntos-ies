/* Prueba de la fila 71 (docs/COSAS-REPETIDAS.md): las cuatro cosas
   repetidas que se juntaron en js/util.js. Sin navegador, con un
   documento y un portapapeles de mentira, mismo estilo que
   pruebas/logica.mjs. */
import fs from 'node:fs';
import vm from 'node:vm';

const raiz = new URL('../js/', import.meta.url).pathname;

/* ---------- documento y portapapeles de mentira ---------- */

function elementoFalso() {
  const clases = new Set();
  return {
    _texto: '',
    get textContent() { return this._texto; },
    set textContent(v) { this._texto = String(v); },
    className: '',
    style: {},
    parentNode: null,
    classList: {
      add: function (c) { clases.add(c); },
      remove: function (c) { clases.delete(c); },
      contains: function (c) { return clases.has(c); }
    },
    setAttribute: function () {},
    select: function () {}
  };
}

const mensajes = { hijos: [] };
let execCommandVale = true;      /* controla si la reserva "a la antigua" funciona */
let clipboardDisponible = true;  /* controla si existe navigator.clipboard */
let clipboardFalla = false;      /* controla si navigator.clipboard.writeText rechaza */
let ultimoCopiado = null;

const cuerpo = {
  appendChild: function (el) { el.parentNode = cuerpo; return el; },
  removeChild: function (el) { el.parentNode = null; }
};

const documentoFalso = {
  getElementById: function (id) { return id === 'mensajes' ? mensajes : null; },
  createElement: function () { return elementoFalso(); },
  body: cuerpo,
  execCommand: function (cual) {
    if (cual !== 'copy') return false;
    return execCommandVale;
  }
};
mensajes.appendChild = function (el) { mensajes.hijos.push(el); return el; };

function navegadorFalso() {
  return {
    get clipboard() {
      if (!clipboardDisponible) return undefined;
      return {
        writeText: function (t) {
          if (clipboardFalla) return Promise.reject(new Error('no se deja'));
          ultimoCopiado = t;
          return Promise.resolve();
        }
      };
    }
  };
}

const contexto = {
  console, window: {}, setTimeout, clearTimeout, Promise,
  document: documentoFalso,
  navigator: navegadorFalso()
};
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(raiz + 'util.js', 'utf8'), contexto, { filename: 'util.js' });
for (const f of ['util-parecidos.js', 'util-pantalla.js']) vm.runInContext(fs.readFileSync(raiz + f, 'utf8'), contexto, { filename: f });
const { U } = contexto;

let fallos = 0;
function comprobar(titulo, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) { fallos++; console.log('FALLA  ' + titulo + '\n   sale: ' + JSON.stringify(real) + '\n   debía: ' + JSON.stringify(esperado)); }
  else console.log('bien   ' + titulo);
}
function esperar(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* ================================================================
   1. U.copiar copia de verdad.
   ================================================================ */
console.log('--- 1. U.copiar copia al portapapeles ---');

ultimoCopiado = null;
const ok1 = await U.copiar('hola mundo');
comprobar('devuelve true', ok1, true);
comprobar('ha copiado el texto pedido', ultimoCopiado, 'hola mundo');

/* ================================================================
   2. Con un botón, pone "Copiado" y lo devuelve a su texto de antes.
   ================================================================ */
console.log('--- 2. con botón, "Copiado" y vuelta a los 1.400 ms ---');

const boton = elementoFalso();
boton.textContent = 'Copiar';
await U.copiar('un dato', boton);
comprobar('nada más copiar, dice "Copiado"', boton.textContent, 'Copiado');
comprobar('se marca con boton-marcado', boton.classList.contains('boton-marcado'), true);

await esperar(1500);
comprobar('al cabo de 1.400 ms, vuelve a su texto', boton.textContent, 'Copiar');
comprobar('y se le quita la marca', boton.classList.contains('boton-marcado'), false);

/* ================================================================
   3. Si el navegador no deja copiar (ni con la reserva), avisa.
   ================================================================ */
console.log('--- 3. si no deja copiar, avisa en vez de callarse ---');

mensajes.hijos.length = 0;
clipboardFalla = true;
execCommandVale = false;
const ok3 = await U.copiar('esto no se copia');
comprobar('devuelve false', ok3, false);
comprobar('ha salido un aviso', mensajes.hijos.length, 1);
comprobar('el aviso es de fallo (clase "malo")', mensajes.hijos[0].className.indexOf('malo') !== -1, true);
comprobar('el aviso, por defecto, dice que no ha podido copiar', mensajes.hijos[0].textContent, 'No he podido copiarlo.');

/* El mensaje se puede personalizar (así lo usan, por ejemplo,
   js/copiar.js y js/relacionados.js, con el texto copiado dentro). */
mensajes.hijos.length = 0;
await U.copiar('NIE 12345678', null, { avisoFallo: 'No he podido copiarlo. Es 12345678.' });
comprobar('el aviso admite un mensaje propio', mensajes.hijos[0].textContent, 'No he podido copiarlo. Es 12345678.');

/* Y se puede callar del todo, para cuando quien llama ya avisa por su
   cuenta (así lo usa `Copiar.copiar`, en js/copiar.js). */
mensajes.hijos.length = 0;
await U.copiar('otra cosa', null, { sinAviso: true });
comprobar('sinAviso no saca ningún mensaje', mensajes.hijos.length, 0);

/* Si falla el portapapeles nuevo pero la reserva sí funciona, no hay
   que avisar: se ha copiado igual. */
mensajes.hijos.length = 0;
execCommandVale = true;
const ok3b = await U.copiar('con reserva');
comprobar('con la reserva funcionando, no falla', ok3b, true);
comprobar('y no avisa de nada', mensajes.hijos.length, 0);
clipboardFalla = false;

/* Navegador sin portapapeles en absoluto: también cae en la reserva. */
mensajes.hijos.length = 0;
clipboardDisponible = false;
execCommandVale = true;
const ok3c = await U.copiar('sin clipboard');
comprobar('sin navigator.clipboard, la reserva copia igual', ok3c, true);
clipboardDisponible = true;

/* ================================================================
   4. U.nuevoId no repite y respeta el prefijo.
   ================================================================ */
console.log('--- 4. U.nuevoId, diez mil tiradas sin chocar ---');

const vistos = new Set();
let chocan = 0, prefijoMal = 0;
for (let i = 0; i < 10000; i++) {
  const id = U.nuevoId('g');
  if (vistos.has(id)) chocan++;
  vistos.add(id);
  if (id.charAt(0) !== 'g') prefijoMal++;
}
comprobar('ninguna de las diez mil se repite', chocan, 0);
comprobar('las diez mil empiezan por el prefijo pedido', prefijoMal, 0);
comprobar('otro prefijo también se respeta', U.nuevoId('hito-').indexOf('hito-'), 0);

console.log(fallos ? '\n' + fallos + ' FALLOS' : '\nTodo bien');
process.exit(fallos ? 1 : 0);
