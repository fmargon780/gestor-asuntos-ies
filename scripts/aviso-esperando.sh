#!/bin/bash
# Fila 225 de la cola (docs/AVISO-ESPERANDO-PERMISO.md). Hook de Claude Code:
# deja una marca en la rama "avisos" cuando la sesión se para a pedir un
# permiso o a hacer una pregunta, para que el Centro de mando no la dé por
# parada. Se llama con un argumento: "esperando" o "libre".
#
# Nunca debe romper la sesión: cualquier error se traga y el script sale
# siempre con 0. No imprime nada en la salida estándar (Claude Code la lee).
set -u

MODO="${1:-}"
FLAG="${TMPDIR:-/tmp}/aviso-esperando.flag"
REPO_ROOT="${CLAUDE_PROJECT_DIR:-}"
if [ -z "$REPO_ROOT" ]; then
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || REPO_ROOT=""
fi

# Construye el JSON de ESPERANDO.json (en node, para no pelear con el
# escapado de comillas en bash) y averigua la fila EN CURSO leyendo
# docs/COLA.md de la copia de trabajo. No toca la copia de trabajo: solo
# la lee.
JS_DATOS='
const fs = require("fs");
const path = require("path");
const modo = process.argv[1] || "";
const repoRoot = process.argv[2] || "";

let entrada = "";
try { entrada = fs.readFileSync(0, "utf8"); } catch (e) { entrada = ""; }

let mensajeOriginal = "";
try {
  const j = JSON.parse(entrada);
  if (j && typeof j.message === "string") mensajeOriginal = j.message;
} catch (e) { /* JSON vacío o roto: mensaje vacío */ }

function filaEnCurso() {
  if (!repoRoot) return "";
  let contenido;
  try { contenido = fs.readFileSync(path.join(repoRoot, "docs/COLA.md"), "utf8"); }
  catch (e) { return ""; }
  const lineas = contenido.split("\n");
  for (const linea of lineas) {
    if (linea.charAt(0) !== "|") continue;
    const celdas = linea.split("|").map((s) => s.trim());
    if (celdas.length < 4) continue;
    const numero = celdas[1];
    const estado = celdas[celdas.length - 2];
    if (/^[0-9]+$/.test(numero) && /^EN CURSO\b/.test(estado)) return numero;
  }
  return "";
}

function recortada(s) {
  return String(s).replace(/\s+/g, " ").trim().slice(0, 200);
}

function ahora() {
  return new Date().toISOString().replace(/\.\d+Z$/, "Z");
}

let salida;
if (modo === "esperando") {
  salida = {
    estado: "esperando",
    fila: filaEnCurso(),
    motivo: /permission/i.test(mensajeOriginal) ? "permiso" : "pregunta",
    desde: ahora(),
    mensaje: recortada(mensajeOriginal),
  };
} else {
  salida = { estado: "libre", fila: "", motivo: "", desde: ahora(), mensaje: "" };
}
process.stdout.write(JSON.stringify(salida));
'

# Escribe el JSON recibido como ESPERANDO.json en la rama "avisos" del
# remoto "origin", con las órdenes de bajo nivel de git: no toca el índice
# ni la rama en la que está la copia de trabajo, ni siquiera lee el HEAD
# actual (solo lee tres ficheros que ya existen, nunca escribe en ellos).
#
# El árbol de "avisos" lleva también vercel.json y
# scripts/vercel-ignore-build.sh (una copia de los de la propia subida,
# tal como están en ese momento): sin ellos, Vercel no tiene ningún
# ignoreCommand que ejecutar PARA ESE COMMIT EN CONCRETO (lee la
# configuración del propio commit que despliega, no una copia guardada
# aparte), y construye siempre, aunque "avisos" esté en
# git.deploymentEnabled (comprobado publicando de verdad, con el árbol
# llevando solo ESPERANDO.json: construyó tres veces seguidas, con y sin
# esa marca, encadenado o no). Con los dos ficheros presentes,
# ignoreCommand ya puede mirar la rama por su nombre y saltarse la
# publicación, como hace con cualquier otra rama que no sea "main" ni
# "pruebas". Cada aviso encadena además con el anterior cuando puede (se
# trae con "git fetch" antes de comitear, sin tocar nada de la copia de
# trabajo), para que el propio historial de la rama tenga sentido; el
# primer aviso de la vida del repositorio, sin nada que encadenar, sigue
# sin padre.
escribir_avisos() {
  local payload="$1"
  [ -n "$REPO_ROOT" ] || return 1
  [ -n "$payload" ] || return 1

  local blob_json blob_vercel blob_script scripts_tree tree padre commit entradas
  blob_json="$(printf '%s' "$payload" | git -C "$REPO_ROOT" hash-object -w --stdin 2>/dev/null)" || return 1
  [ -n "$blob_json" ] || return 1
  entradas="100644 blob $blob_json$(printf '\t')ESPERANDO.json"

  if [ -f "$REPO_ROOT/vercel.json" ]; then
    blob_vercel="$(git -C "$REPO_ROOT" hash-object -w "$REPO_ROOT/vercel.json" 2>/dev/null)"
    if [ -n "$blob_vercel" ]; then
      entradas="$entradas
100644 blob $blob_vercel$(printf '\t')vercel.json"
    fi
  fi

  if [ -f "$REPO_ROOT/scripts/vercel-ignore-build.sh" ]; then
    blob_script="$(git -C "$REPO_ROOT" hash-object -w "$REPO_ROOT/scripts/vercel-ignore-build.sh" 2>/dev/null)"
    if [ -n "$blob_script" ]; then
      scripts_tree="$(printf '100755 blob %s\tvercel-ignore-build.sh\n' "$blob_script" | git -C "$REPO_ROOT" mktree 2>/dev/null)"
      if [ -n "$scripts_tree" ]; then
        entradas="$entradas
040000 tree $scripts_tree$(printf '\t')scripts"
      fi
    fi
  fi

  tree="$(printf '%s\n' "$entradas" | git -C "$REPO_ROOT" mktree 2>/dev/null)" || return 1
  [ -n "$tree" ] || return 1

  padre=""
  if command -v timeout >/dev/null 2>&1; then
    timeout 10 git -C "$REPO_ROOT" fetch origin avisos >/dev/null 2>&1
  else
    git -C "$REPO_ROOT" fetch origin avisos >/dev/null 2>&1
  fi
  padre="$(git -C "$REPO_ROOT" rev-parse --verify -q FETCH_HEAD 2>/dev/null)" || padre=""

  commit=""
  if [ -n "$padre" ]; then
    commit="$(GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-aviso-esperando}" \
              GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-aviso-esperando@localhost}" \
              GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-aviso-esperando}" \
              GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-aviso-esperando@localhost}" \
              git -C "$REPO_ROOT" commit-tree "$tree" -p "$padre" -m "aviso" 2>/dev/null)" || commit=""
  fi
  if [ -z "$commit" ]; then
    commit="$(GIT_AUTHOR_NAME="${GIT_AUTHOR_NAME:-aviso-esperando}" \
              GIT_AUTHOR_EMAIL="${GIT_AUTHOR_EMAIL:-aviso-esperando@localhost}" \
              GIT_COMMITTER_NAME="${GIT_COMMITTER_NAME:-aviso-esperando}" \
              GIT_COMMITTER_EMAIL="${GIT_COMMITTER_EMAIL:-aviso-esperando@localhost}" \
              git -C "$REPO_ROOT" commit-tree "$tree" -m "aviso" 2>/dev/null)" || return 1
  fi
  [ -n "$commit" ] || return 1

  if command -v timeout >/dev/null 2>&1; then
    timeout 10 git -C "$REPO_ROOT" push -f origin "$commit:refs/heads/avisos" >/dev/null 2>&1
  else
    git -C "$REPO_ROOT" push -f origin "$commit:refs/heads/avisos" >/dev/null 2>&1
  fi
}

hacer_esperando() {
  local entrada datos
  entrada="$(cat 2>/dev/null)" || entrada=""
  datos="$(printf '%s' "$entrada" | node -e "$JS_DATOS" -- "esperando" "$REPO_ROOT" 2>/dev/null)" || datos=""
  escribir_avisos "$datos" || true
  : > "$FLAG" 2>/dev/null || true
}

hacer_libre() {
  cat >/dev/null 2>&1 || true
  [ -f "$FLAG" ] || return 0
  local datos
  datos="$(node -e "$JS_DATOS" -- "libre" "$REPO_ROOT" </dev/null 2>/dev/null)" || datos=""
  escribir_avisos "$datos" || true
  rm -f "$FLAG" 2>/dev/null || true
}

case "$MODO" in
  esperando) hacer_esperando ;;
  libre) hacer_libre ;;
  *) : ;;
esac

exit 0
