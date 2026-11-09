/* Pide una dirección con node:http / node:https y devuelve { ok, status, text() }.
   Sustituye al fetch de Node 22 (undici), que contra el servidor local de las
   pruebas lanza una excepción no capturada (assert(!this.paused)) y mata el
   proceso (fila 563). Los fetch que corren dentro del navegador no se tocan. */
import http from 'node:http';
import https from 'node:https';

export function pedir(direccion) {
  return new Promise((resolver, rechazar) => {
    const cliente = direccion.startsWith('https:') ? https : http;
    const peticion = cliente.get(direccion, { agent: false, timeout: 5000 }, (res) => {
      const trozos = [];
      res.on('data', (t) => trozos.push(t));
      res.on('end', () => {
        const cuerpo = Buffer.concat(trozos).toString('utf8');
        const status = res.statusCode;
        resolver({
          ok: status >= 200 && status < 300,
          status,
          text: async () => cuerpo,
          json: async () => JSON.parse(cuerpo)
        });
      });
      res.on('error', rechazar);
    });
    peticion.on('timeout', () => peticion.destroy(new Error('sin respuesta')));
    peticion.on('error', rechazar);
  });
}
