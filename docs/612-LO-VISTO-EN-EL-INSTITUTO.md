# Lo visto en el instituto al diseñar el tema 607 (fila 612, 11-nov-2026)

Lo averiguado con Francisco en el ordenador «Propietario», para no repetirlo.

## Cómo está Drive en el ordenador «Propietario»
- Drive para ordenadores tiene dos cuentas: la de Francisco (unidad G) y la común de Administración (unidad H).
- En modo «Replicar», Google pone la carpeta en `C:\Users\Propietario\Mi unidad (29700692.administracion@g.educaand.es)`.
  Sí se puede elegir otra carpeta: Preferencias → Google Drive → «Replicar archivos» → «Seleccionar carpeta»
  (Claude dijo antes que no se podía; era falso). Elegir `H:\Mi unidad` da «no se admite el sistema de archivos»:
  tiene que ser una carpeta del disco C.
- La app hoy solo acepta una carpeta llamada exactamente «Mi unidad» o «My Drive»
  (`NOMBRES_DRIVE` en `js/pasar-a-drive.js`, `esTrozoDrive` en `js/copiar-ruta.js`): rechazaría esa.
- El otro ordenador («Usuario») no se ha visto.

## Prueba del modo «Ver archivos sin descargarlos» (unidad H, carpeta marcada «Disponible sin conexión»)
Medido con la página «Medidor de carpetas» (https://claude.ai/artifact/Nuye5Pku25cbtAvMRgzVi5), solo «Leer»:
- ARCHIVO en Dropbox: 1.909 carpetas, 3.954 ficheros, 995,7 MB → 9,9 s y 8,8 s; 1 fichero sin leer.
- Copia en la unidad H: Windows solo copió 1.542 ficheros (313,3 MB), también al repetir; causa sin averiguar → 7,9 s.
  Por fichero, unas dos veces más lenta que Dropbox.
- Lo que entra en una carpeta marcada «Disponible sin conexión» queda también sin conexión (icono verde).
Conclusión de Francisco: descartado ese modo; elegido volver a «Replicar» con dos marcadores (uno por ordenador).

## Lo que hace dudar a Francisco del traslado entero
- Con «Replicar», la raíz es unos 27 caracteres más larga que la de Dropbox (lleva usuario y correo):
  menos sitio para los nombres, al revés de lo que se buscaba (análisis del 21-oct-2026).
- El ARCHIVO ocupa ~1 GB tras dos meses; la cuenta común tiene 50 GB, compartidos con el correo.
Revisado con datos: el Gestor ocupa ~1,4 GB tras dos meses (unos 8 GB por curso); la cuenta común tenía 1,33 GB
usados de 50 GB; Dropbox del centro tiene 2,01 TB. Comprimir el ARCHIVO ahorraría un 13 % (995,9 → 864,6 MB):
descartado. Dejar el ARCHIVO en Dropbox: descartado («no veo bien tener unas cosas en un lugar y otras en otro»).
Decisión: todo a Drive, en `C:\Google Drive`; cuando falte espacio, que lo amplíe la Junta o el centro.

## Carpeta de «Replicar» en `C:\Google Drive` (11-nov-2026, ordenador «Propietario»)
- Francisco eligió `C:\Google Drive` en «Seleccionar carpeta». Drive usa esa carpeta como «Mi unidad» directamente:
  dentro salen `GESTOR-BANDEJA`, los ficheros sueltos de la cuenta común y la carpeta oculta `.tmp.drivedownload`.
- La ruta queda igual en los dos ordenadores si el otro se pone igual (un solo marcador) y la raíz mide 16 caracteres
  (más corta que la de Dropbox).
- La app hoy rechazaría esa carpeta: se llama «Google Drive», no «Mi unidad».
- Visto de paso en esa carpeta: `registro (1).json` y `sin-clasificar (1).json` junto a los originales: es la forma
  de las copias en conflicto de Drive que suponía la fila 457.
