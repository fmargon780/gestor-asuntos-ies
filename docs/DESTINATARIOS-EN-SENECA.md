# Los destinatarios de un mensaje de Séneca

Acordado con Francisco el 17 de septiembre de 2026. Fila 43 de `docs/COLA.md`.

Viene de `docs/GRUPOS-DE-PERSONAS.md`, que ya dejó los grupos poniendo los destinatarios de un
correo en copia oculta. Ahora toca lo mismo para la mensajería de Séneca, que no funciona con
direcciones de correo sino con **usuarios IdEA**.

## De dónde sale

Francisco mandó a comprobar cómo se eligen los destinatarios en Séneca (Utilidades →
Comunicaciones), y lo contó así:

> "La mensajería de Séneca para poner el destinatario usa dos sistemas, o bien haces un filtro
> dando varios clicks y con el riesgo de poder elegir a más personas de la cuenta, o haces una
> búsqueda en el mismo campo en el que si escribes primero el símbolo @ y después sin espacio el
> usuario IdEA de la persona, te ofrece la persona que dando a la flecha hacia abajo se queda
> elegida."

Y después, probando a pegar en vez de escribir:

> "Si pego el valor con el @ en un segundo o un poco más sí reconoce el destinatario. Pero hay
> que dar a la flecha hacia abajo para que el sistema coja ese destinatario."

O sea: **pegar vale**, hace falta esperar algo más de un segundo, y hace falta una flecha abajo.
Sobre eso se construye todo lo de aquí.

El usuario IdEA del profesorado y del PAS **ya viene** en el CSV de personal que la aplicación
importa. El del alumnado y el de los tutores legales llegará en un fichero aparte, que Francisco
podrá descargar cuando le reactiven el perfil de Gestor de PASEN. Por eso esta fila se hace
entera ahora: con el personal ya se puede usar y probar de verdad.

## 1. El usuario IdEA, leído por el título de la columna

Módulo nuevo `js/idea.js` (`window.IdEA`), sin pantalla, igual de puro que `js/dni.js`:

- `IdEA.usuarioDe(persona)` → el usuario IdEA tal y como viene escrito, o cadena vacía.
- `IdEA.usuariosDeGrupo(miembrosConPersona)` → `{ usuarios: [...], sinUsuario: [...] }`, sin
  repetidos (comparando en minúsculas), como `combinarCorreosDeGrupo` hace con los correos.

Reglas de lectura, calcadas de `js/dni.js` (que busca el DNI por el título, no por la posición):

- Vale la columna cuyo título lleve `idea` o `usuario` (`usuario IdEA`, `Usuario`, `IdEA`…).
- **No vale** un título que lleve `clave`, `contraseña`, `pin` o `correo`.
- Un título con `tutor`, `padre`, `madre`, `responsable` o `familia` es el usuario del tutor
  legal: se guarda aparte, en `IdEA.usuarioDelTutor(persona, 1|2)`, y no se mezcla con el del
  alumno.
- El valor solo se acepta si parece un usuario: de 4 a 30 caracteres, sin espacios y sin arroba.
  Si trae ya la arroba delante, se le quita.
- **`p.campos` solo trae las columnas que traen algo**: para saber si la columna existe hay que
  mirar la cabecera del CSV (`r.cabecera`), como en `js/dni.js`.
- Si ningún CSV trae columna de usuario, no se enseña nada y no se avisa de nada. Callar antes
  que dar por perdido lo que solo pasa que no se ha descargado.

## 2. El desplegable de grupos, también en el cuadro de Séneca

Hoy el desplegable "Añadir un grupo" solo está en el cuadro de Correo (`js/correo.js`, la
variable `porSeneca` distingue los dos cuadros). Se le pone también al de Séneca, con los mismos
contenidos: los grupos propios de `Grupos.lista()` y los tres atajos de alumnado (unidad, nivel,
enseñanza), en sus `<optgroup>`.

La diferencia está en lo que hace al elegir uno: en Correo saca direcciones de correo, y aquí
saca usuarios IdEA.

## 3. La lista de destinatarios

Debajo del desplegable, en el cuadro de Séneca, una caja `#seneca-destinatarios`:

- La cuenta arriba ("12 destinatarios").
- Un chip por usuario, escrito ya con la arroba (`@jlopezg123`), con su × para quitarlo.
- La línea "N sin usuario IdEA: …" con los nombres, cuando alguno no lo tenga. Esos hay que
  buscarlos a mano en Séneca, como siempre.
- El estado se guarda en un objeto tipo `Set`, igual que `cco` en el cuadro de Correo, y se lee
  del propio DOM cuando hace falta (`destinatariosDelCuadro()`, misma técnica que
  `paraDelCuadro()`).

Y dos botones:

- **"Copiar la lista"**: deja los usuarios en el portapapeles, uno por línea. Es lo que lee el
  ayudante del punto 4.
- **"Copiar el siguiente"**: copia solo el primero que quede sin copiar y lo marca. Es la manera
  de mano, para cuando el ayudante no funcione: pegar, flecha abajo, y volver a pulsar.

## 4. El ayudante de Séneca

Un botón **"Instalar el ayudante de Séneca"**, en Ajustes y también en el cuadro de Séneca. No
es un botón normal: es un enlace que Francisco **arrastra una vez a la barra de marcadores** del
navegador. Al lado, tres frases diciendo exactamente eso, y que se hace una sola vez.

Cómo se usa después:

1. En el gestor, elegir el grupo y pulsar "Copiar la lista".
2. Ir a Séneca, a Utilidades → Comunicaciones, y hacer clic dentro del campo de destinatarios.
3. Pulsar el marcador. Él solo va metiendo a todos, uno detrás de otro.

Cómo funciona por dentro (`js/seneca-ayudante.js`, que genera el texto del marcador; el código
del marcador vive en ese mismo fichero como una cadena, para que se pueda leer y probar):

- Lee la lista del portapapeles con `navigator.clipboard.readText()`. El clic en el marcador es
  el gesto del usuario que Chrome exige; la primera vez el navegador pedirá permiso para leer el
  portapapeles en Séneca, y Francisco tiene que darle a permitir.
- Busca el campo: primero `document.activeElement` si es un `input` de texto; si no, el primer
  `input` de texto visible de la página, mirando también dentro de los `iframe` a los que se pueda
  entrar (Séneca usa marcos).
- Por cada usuario: pone el valor con arroba delante, lanza los eventos que despiertan al campo
  (`input`, `keyup`), **espera 1.400 milisegundos**, lanza `ArrowDown` (`keydown` y `keyup`) y
  después `Enter`. Espera otros 400 y va al siguiente.
- Enseña arriba a la derecha un recuadro con "Metiendo 3 de 12" y un botón "Parar".
- Si no encuentra campo, o el portapapeles viene vacío, lo dice en ese mismo recuadro: "Haz clic
  dentro del campo de destinatarios y vuelve a pulsar".

**El ayudante puede no funcionar**, porque Séneca podría no hacer caso a unos eventos que no
vienen de un teclado de verdad. Por eso el punto 3 se hace entero igual: es la red de seguridad,
y no depende de nada de esto. Si falla, Francisco lo dirá y se quita el botón; nada más.

## 5. Lo que no se hace

- **No se importa todavía el fichero de usuarios del alumnado.** Nadie lo ha visto aún: no
  sabemos cómo se llama ni qué columnas trae. Cuando Francisco lo tenga delante, se apunta una
  fila nueva en la cola para importarlo. Mientras tanto, si ese usuario apareciera en una columna
  del propio RegAlum, el punto 1 ya lo cogería solo.
- No se manda ningún mensaje desde la aplicación. Séneca no lo permite, y sigue sin permitirlo.
- No se toca el cuadro de Correo ni la copia oculta: eso ya está hecho y funciona.
- No se hace el filtro por pantallas de Séneca (el de los clics), que es justo lo que se quiere
  evitar.
- No se guarda ningún usuario IdEA en `_GESTOR`: sale siempre de los CSV, como el DNI.

## 6. Pruebas

- `pruebas/idea.mjs`, sin navegador: `usuarioDe` con títulos buenos y malos, con la arroba
  delante, con valores que no parecen un usuario, con las columnas de tutor; `usuariosDeGrupo`
  con repetidos y con gente sin usuario.
- `pruebas/seneca-destinatarios-navegador.mjs`: que el desplegable de grupos sale en el cuadro de
  Séneca, que al elegir un grupo se pintan los chips y la línea de los que no tienen usuario, y
  que "Copiar el siguiente" avanza de uno en uno.
- El ayudante no se puede probar sin Séneca: se prueba que el texto del marcador se genera y que
  arranca con `javascript:`. Lo demás lo prueba Francisco.

## 7. Al terminar

- `docs/CONTEXTO-CORTO.md`: sustituir la línea de los grupos por una que diga que también ponen
  los destinatarios de un mensaje de Séneca, con su usuario IdEA. En "Qué falta", dejar apuntado
  el fichero de usuarios del alumnado, pendiente del perfil de Gestor de PASEN.
- `docs/CONTEXTO.md`: sección nueva dentro de "Grupos de personas" para el usuario IdEA y el
  ayudante, y el fichero `js/idea.js` y `js/seneca-ayudante.js` en la tabla de ficheros.
- `docs/HISTORIA.md`: esto, con lo que Francisco comprobó en Séneca (pegar vale, hace falta más
  de un segundo y una flecha abajo), que es el porqué de todo.
- Decirle a Francisco, en tres frases: que arrastre una vez el ayudante a la barra de
  marcadores, que el primer día Chrome le pedirá permiso para el portapapeles, y que si el
  ayudante no le hace nada use "Copiar el siguiente".
