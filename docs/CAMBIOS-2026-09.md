# Qué ha cambiado — plan de robustez de septiembre de 2026

Resumen en lenguaje llano de los seis bloques. El detalle técnico está en
`docs/CONTEXTO.md`.

1. **Copias de seguridad.** Cada vez que se guarda uno de los ficheros compartidos, se
   guarda antes una copia de cómo estaba. Si algún día un fichero se estropea, al entrar
   la aplicación lo avisa en rojo y ofrece un botón para recuperar la última copia. En
   Ajustes hay un bloque nuevo, **Copias de seguridad**, para verlas y restaurar a mano.
2. **Conflictos de Dropbox.** Si los dos ordenadores guardáis casi a la vez, Dropbox deja
   un fichero de "copia en conflicto". Antes nadie lo miraba. Ahora los asuntos y el
   tablón se unen solos; las demás listas avisan en Ajustes, en el bloque
   **Conflictos de Dropbox**, para elegir con cuál quedarse.
3. **Pruebas automáticas.** Cada vez que se sube algo al repositorio, GitHub comprueba
   solo que la aplicación sigue funcionando. Se ve en la pestaña **Actions** del
   repositorio: verde quiere decir que todo va bien.
4. **Fichas sin carpeta.** Si una carpeta se renombra a mano desde el explorador de
   archivos (no desde el botón Editar), su ficha se queda huérfana. Ajustes tiene un
   bloque nuevo, **Fichas sin carpeta**, que las encuentra y deja enlazarlas o borrarlas.
5. **Limpieza por dentro.** Sin nada que ver en pantalla: un botón que no llegaba a
   usarse se ha quitado, y hay una comprobación nueva para que dos ficheros nunca vuelvan
   a pisarse el nombre de una función sin que nadie se entere.
6. **Esta documentación.**

## Qué vas a ver distinto en pantalla

- En Ajustes, dos bloques nuevos: **Copias de seguridad** y **Fichas sin carpeta**.
- Si Dropbox deja alguna vez una copia en conflicto que no se pueda unir sola, un aviso
  en Ajustes, en el bloque **Conflictos de Dropbox**.
- Si algún día un fichero no se puede leer, al entrar sale un aviso en rojo con un botón
  para arreglarlo, en vez de dejarte fuera sin explicación.

Todo lo demás sigue igual: nada de esto cambia cómo se crean, se cierran o se buscan los
asuntos.
