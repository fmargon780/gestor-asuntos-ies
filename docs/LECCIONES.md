# Lecciones de Gestor de asuntos

Errores ya conocidos en esta app y qué hacer en su lugar. Claude Code lo lee al empezar.
Máximo 60 líneas. Si una lección deja de ser cierta, se corrige o se borra.

| Qué falló | Por qué, en una frase | Qué hacer en su lugar | Fecha |
|---|---|---|---|
| `npm test` se cae al arrancar con «AssertionError … undici … !this.paused» | Un fallo de `fetch` de Node 22 cuando hay otra tanda o un servidor cargando | Repetirlo hasta que arranque (a veces 3 veces); no es de la app | 4-nov-2026 |
