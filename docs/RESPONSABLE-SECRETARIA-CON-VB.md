# Responsable «Secretaría con V.º B.º de Dirección» (fila 234)

Aviso de usuario del 30-sep-2026 (pantalla Ficha de un asunto), de Francisco:
https://drive.google.com/file/d/1IWkPcRKm7X_zNIqENKdNy9G6F6aTIMY1/view?usp=drivesdk
Captura: hito «Puesta a la firma» de un «Certificado de desempeño de la función tutorial»; en
«Cambiar este hito», el desplegable «Responsable (opcional)» solo deja elegir Secretaría o
Dirección, y el hito lo firma Secretaría con el visto bueno de Dirección.

## Lo que decidió Francisco (1-oct-2026)

1. **Una opción fija nueva de responsable: «Secretaría con V.º B.º de Dirección».** Fija como
   «Administración» (`js/hitos-administracion.js`, `asegurar`): está siempre, no se quita ni se
   renombra en Ajustes › Hitos. Id propuesto: `secretaria-vb-direccion`. Es del centro, **no** de
   Administración (no lleva la marca `administracion`).
2. **Sale en todos los desplegables de responsable de un hito**: en la mesa de un asunto
   («Cambiar este hito», «Hito ▾ › Crear/Cambiar»), en el editor de guías y en los modelos de la
   biblioteca («Responsable por defecto», `paraGuia`).
3. **El asunto dice «Esperando a Secretaría con V.º B.º de Dirección»** cuando su hito actual es
   de ese responsable, y en Inicio va a «En espera» igual que hoy un hito de Secretaría o de
   Dirección. La columna «Le toca a» y la cabecera de la ficha enseñan el nombre entero.
4. **Filtros: cuenta para las dos.** En el filtro «Responsable» de Inicio (y en «Qué me toca»,
   `cuentaPara`), un hito con este responsable sale al filtrar por Secretaría **y** al filtrar por
   Dirección. Además, la opción sale ella misma en el filtro, por si se quiere ver solo esos.
   Las Cuentas y el informe para dirección lo tratan como un responsable más, con su nombre.
5. Lo que ya existe no se toca: ningún hito ni guía cambia de responsable solo.

## Dónde mirar

- `js/hitos-administracion.js`: `asegurar` (añadir la segunda fija detrás de «Administración»),
  `cuentaPara` (que cuente para `secretaria` y `direccion`), y que `esCargo`/`esPersona` no la
  confundan con una persona. Si el fichero pasa de 600 líneas, la parte nueva a un módulo propio.
- `js/hitos-ajustes.js`: la fila de la fija, sin quitar ni renombrar (como «Administración»).
- `js/estado-hito.js`, `js/hitos-a-quien.js`: el texto «Esperando a…» y el lado del asunto.
- `js/inicio-tabla.js` (selector `inicio-me-toca-responsable`) y `js/que-me-toca.js`.
- Si Secretaría o Dirección tienen otro id en `hitos.json` de un centro (se pueden renombrar),
  reconocerlas también por el nombre, como hace `esCargo` con `hueso`.
- Datos de demostración (`js/demo/`): un asunto con su hito actual de este responsable.

## Cómo sabemos que está bien

1. En la mesa de un hito, «Cambiar este hito»: el desplegable «Responsable» ofrece «Secretaría
   con V.º B.º de Dirección»; se elige, se guarda, y al volver a abrir sigue elegida.
2. El mismo desplegable en el editor de una guía y en un modelo de la biblioteca la ofrece.
3. Con ese hito como hito actual, la cabecera de la ficha dice «Esperando a Secretaría con V.º B.º
   de Dirección» y en Inicio el asunto está en «En espera», con ese nombre en «Le toca a».
4. Filtro «Responsable» de Inicio: el asunto sale con Secretaría, con Dirección y con la opción
   nueva; no sale con Administración ni con Jefatura.
5. En Ajustes › Hitos la opción está, sin botón de quitar ni de cambiar el nombre.
6. Un hito que ya era de Secretaría o de Dirección sigue igual.
7. Prueba nueva `pruebas/responsable-secretaria-con-vb.mjs` con estos casos, en verde, y
   `pruebas/responsable-administracion.mjs` y `pruebas/responsable-organismo.mjs` siguen en verde.

## Al terminar

Poner al día la línea de responsables de la sección 5 de `docs/CONTEXTO-CORTO.md` (sustituirla,
no añadir otra) y el hijo de `docs/contexto/` de los hitos.
