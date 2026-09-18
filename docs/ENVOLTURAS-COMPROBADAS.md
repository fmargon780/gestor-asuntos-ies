# Fila 70 — Las envolturas, comprobadas al arrancar

Sale del informe `docs/INFORME-CRITICO-2026-09-18.md`, parte 2.5.

---

## 1. Qué pasa hoy

La aplicación está construida "envolviendo" funciones: un fichero se guarda la función que había y
la sustituye por otra suya que llama a la vieja por dentro. En el código se reconocen por
`var comoEra = App.loQueSea;`.

El 11 de septiembre había **17 sitios así**. Hoy hay **38**, repartidos en **23 ficheros**.

Y eso descansa sobre algo frágil: los **103 ficheros de programa** se cargan en `index.html` en un
orden fijo, y ese orden importa. Un fichero que envuelve tiene que cargarse **después** del que
define la función. Si se cuela en el sitio equivocado, la envoltura no se aplica.

**El fallo es silencioso.** No salta ningún error. Simplemente esa función hace menos de lo que
debería: un botón que no aparece, un dato que no se guarda, un aviso que no sale. Y se descubre
semanas después, usando la aplicación.

## 2. Lo que NO se va a hacer

`docs/CONTEXTO-CORTO.md` dice que reescribir la arquitectura de módulos y envolturas está
descartado. **De acuerdo, y así se queda.** Sería reescribir la aplicación entera por un problema
que todavía no ha costado un fallo en producción.

Esta fila no arregla las envolturas. Pone una alarma para que, cuando una falle, se sepa el mismo
día y no dos semanas después.

## 3. Qué hay que hacer

### 3.1 Que cada envoltura se apunte

Una función pequeña en `js/util.js`, algo como `U.envolver(objeto, nombre, hacerNueva)`:

- comprueba que `objeto[nombre]` existe y es una función; si no, **lo apunta como fallo**,
- guarda la vieja, pone la nueva,
- apunta en una lista que esa envoltura se ha aplicado, con el nombre de la función y el fichero.

Después, pasar por ella los 38 sitios. El cambio en cada uno es mecánico: donde hoy hay

    var comoEra = App.abrirFicha;
    App.abrirFicha = async function (a) { ... };

pasa a envolverse con la función nueva. Es el mismo código, solo que apuntado.

**Cuidado**: hay envolturas que no son de `App` sino de otros módulos (`window.Gestor`,
`CorreoNucleo`), y alguna que envuelve dos funciones seguidas. Pasarlas todas, una a una,
comprobando que cada una sigue haciendo lo mismo.

### 3.2 La lista de lo que tiene que estar

Un fichero nuevo, `js/envolturas-esperadas.js`, cargado **el último** de todos, con la lista de las
38 envolturas que deben existir: qué función y desde qué fichero.

Al arrancar, compara esa lista con lo que se ha apuntado de verdad:

- Si están todas, no dice nada.
- Si falta alguna, **aviso rojo en la pantalla de entrada**, diciendo cuáles faltan, y que hay que
  avisar antes de seguir trabajando. No impedir entrar: una envoltura de menos casi nunca es motivo
  para no poder trabajar.

Que la lista se pueda ver siempre en Ajustes → Mantenimiento, con las 38 y su estado.

### 3.3 Una regla para no crecer más

En `docs/CONTEXTO-CORTO.md`, en las reglas de código, sustituir lo que haya por esto:

> Un módulo nuevo **no envuelve**. Se engancha por un punto previsto (`window.Gestor.alRefrescar` y
> los que haya) o se le añade uno. Envolver solo si no hay más remedio, y entonces con `U.envolver`
> y apuntándolo en `js/envolturas-esperadas.js`.

## 4. Cómo se comprueba

Prueba nueva, `pruebas/envolturas.mjs`, en navegador (hace falta cargar `index.html` entera):

1. Al arrancar, las 38 envolturas esperadas están aplicadas y no sale ningún aviso.
2. Si se quita a mano una de la lista de aplicadas, sale el aviso rojo y dice cuál falta.
3. Envolver una función que no existe queda apuntado como fallo, no revienta la carga.
4. La cuenta de `js/envolturas-esperadas.js` coincide con los `U.envolver` que hay en `js/`. Esta
   comprobación es la más útil de las cuatro: salta sola cuando alguien añade una envoltura y se
   olvida de apuntarla.

Y `npm test` entero en verde: **la batería completa es la red de seguridad de esta fila**, porque se
tocan 23 ficheros y lo que hay que demostrar es que nada cambia de comportamiento.

## 5. Qué NO hay que hacer

- **No** cambiar el orden de los `<script>` de `index.html`. Ni uno.
- **No** quitar ninguna envoltura ni convertirla en otra cosa. Esta fila solo las apunta.
- **No** aprovechar para reorganizar módulos.
- **No** meter esta fila en la misma subida que ninguna otra: toca demasiados ficheros.

## 6. Cuánto es

Un día. El trabajo es mecánico pero son 23 ficheros, y lo que cuesta es comprobar que nada se ha
movido.
