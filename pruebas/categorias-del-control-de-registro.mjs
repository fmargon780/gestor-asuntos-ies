/* Prueba (sin navegador), separada de tutores-legales.mjs en la fila 584 (paso 5, «ninguna lista de categorías escrita a mano»):
   js/control-registro-pantalla.js no debe llevar su propia lista de categorías; tiene que salir de Nombres.CATEGORIAS
   para que los tutores legales y las administraciones también se reconozcan al crear un asunto desde el control de registro.
   APARTADA (RETIRADAS de pruebas/ejecutar.mjs): fallo real de la aplicación, idea 594 de docs/COLA.md. */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const texto = fs.readFileSync(raiz + 'js/control-registro-pantalla.js', 'utf8');
const aMano = /\[\s*'ALUMNADO'\s*,\s*'PERSONAL'/.test(texto);
if (aMano) { console.log('FALLA  el control de registro lleva su lista de categorías escrita a mano'); process.exit(1); }
console.log('bien   el control de registro no lleva su lista de categorías escrita a mano');
