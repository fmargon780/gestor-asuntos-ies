#!/usr/bin/env python3
"""Fila 284 (docs/PLAZOS-LEGALES-EN-LA-BIBLIOTECA.md, apartado 3): programa de una sola vez.

Sube la versión de datos-biblioteca/biblioteca-centro.json a 2, pone el plazo en
seis modelos que ya estaban, añade la tabla `plazosPorTipo` y los siete modelos
comunes nuevos. No genera nada desde docs/contenido/: cambia el JSON tal cual.
Se puede lanzar más de una vez: no duplica nada.
"""
import json, os

RUTA = os.path.join(os.path.dirname(__file__), '..', 'datos-biblioteca', 'biblioteca-centro.json')
d = json.load(open(RUTA, encoding='utf-8'))
d['version'] = 2

PLAZOS = {
    'b15': (2, 'lectivos'), 'b32': (10, 'habiles'), 'b120': (2, 'habiles'),
    'b121': (3, 'habiles'), 'b157': (1, 'meses'),
}
por_id = {m['id']: m for m in d['modelos']}
for i, (dias, cuenta) in PLAZOS.items():
    por_id[i]['plazo'] = {'dias': dias, 'cuenta': cuenta}

d['plazosPorTipo'] = {
    'Corrección por conducta contraria a la convivencia': {'b15': 'b13'},
    'Medida disciplinaria por conducta gravemente perjudicial': {'b15': 'b21'},
    'Expediente de cambio de centro docente': {'b32': 'b31'},
    'Reclamación de calificaciones': {'b120': 'b118', 'b121': 'b120'},
    'Solicitud de acceso a datos personales': {'b157': 'b154'},
}


def norma(cita):
    return {'id': 'n0', 'cita': cita, 'bloque': '', 'clave': '', 'url': ''}


def tarea(n, texto, accion='', explicacion=''):
    return {'id': 'g%d' % n, 'texto': texto, 'explicacion': explicacion, 'accion': accion, 'normativa': None}


def modelo(id_, titulo, resp, plazo, cita, explicacion, tareas):
    m = {'id': id_, 'nombre': titulo, 'titulo': titulo, 'explicacion': explicacion, 'responsable': resp,
         'revision': 1, 'requisitos': [], 'soloInformativo': False, 'normativa': [norma(cita)],
         'guion': [tarea(i + 1, *t) for i, t in enumerate(tareas)]}
    if plazo:
        m['plazo'] = {'dias': plazo[0], 'cuenta': plazo[1]}
    return m


CONSTANCIA = 'Enviarlo por un medio que deje constancia de que lo recibe'
NUEVOS = [
    modelo('b-comun-requerir', 'Requerir que completen la solicitud', 'Administración', None, 'Ley 39/2015, art. 68.1',
           'Cuando a la solicitud le falta un documento o un dato obligatorio. Se le dan 10 días hábiles para traerlo y se le avisa de que, si no lo hace, se le tendrá por desistido. Después de este hito va «Esperar a que completen la solicitud».',
           [('Generar el requerimiento', 'generar', 'Con lo que falta, el plazo de 10 días hábiles y el aviso de desistimiento.'),
            ('Registrar la salida en Séneca', 'registrar'),
            (CONSTANCIA, 'comunicar', 'PASEN con acuse o recibí firmado. Un correo normal no prueba que lo recibió.')]),
    modelo('b-comun-esperar-solicitud', 'Esperar a que completen la solicitud', 'tercero', (10, 'habiles'), 'Ley 39/2015, art. 68.1',
           'El plazo legal cuenta desde el día siguiente a aquel en que recibe el requerimiento. La aplicación lo cuenta desde que das por hecho el hito de arriba: si lo recibió más tarde, cambia la fecha a mano. Si le cuesta reunirlo, se puede ampliar hasta 5 días más.',
           [('Añadir lo que traiga', 'anadir'),
            ('Si pasa el plazo sin traerlo, anotarlo y seguir por el desistimiento', '')]),
    modelo('b-comun-audiencia', 'Dar audiencia al interesado', 'Administración', None, 'Ley 39/2015, art. 82',
           'Antes de proponer la resolución, se le enseña el expediente y se le dan entre 10 y 15 días hábiles para alegar. Aquí van 10; si el centro quiere dar más, se cambia el plazo del hito siguiente. Después va «Esperar las alegaciones».',
           [('Generar el escrito de audiencia', 'generar', 'Con el plazo para alegar y dónde ver el expediente.'),
            ('Registrar la salida en Séneca', 'registrar'),
            (CONSTANCIA, 'comunicar')]),
    modelo('b-comun-esperar-alegaciones', 'Esperar las alegaciones', 'tercero', (10, 'habiles'), 'Ley 39/2015, art. 82.2',
           'El plazo legal cuenta desde el día siguiente a aquel en que recibe el escrito. La aplicación lo cuenta desde que das por hecho el hito de arriba: si lo recibió más tarde, cambia la fecha a mano. Si antes de que acabe dice que no va a alegar, el hito se da por hecho.',
           [('Añadir las alegaciones, o la renuncia a alegar', 'anadir')]),
    modelo('b-comun-pedir-informe', 'Pedir informe a otro órgano', 'Administración', None, 'Ley 39/2015, art. 80.2',
           'Cuando para resolver hace falta el informe de otro órgano. Salvo que una norma diga otra cosa, tiene 10 días hábiles para emitirlo. Después va «Esperar el informe».',
           [('Generar la petición de informe', 'generar', 'Citando la norma que lo exige, o por qué hace falta.'),
            ('Registrar la salida en Séneca', 'registrar'),
            ('Enviarla al órgano', 'comunicar')]),
    modelo('b-comun-esperar-informe', 'Esperar el informe', '', (10, 'habiles'), 'Ley 39/2015, art. 80.2',
           'Si pasa el plazo sin informe y no es de los que la norma obliga a esperar, se puede seguir sin él. Pon como responsable al órgano al que se le pide.',
           [('Añadir el informe', 'anadir')]),
    modelo('b-comun-esperar-alzada', 'Esperar el plazo de recurso de alzada', 'tercero', (1, 'meses'), 'Ley 39/2015, arts. 121 y 122',
           'Un mes desde el día siguiente a la notificación. Si no recurre, la resolución queda firme. Si recurre, el centro manda el recurso, con su informe y una copia del expediente, a quien tiene que resolverlo, en 10 días hábiles. La aplicación cuenta el mes desde que das por hecho el hito de arriba: si la notificación la recibió más tarde, cambia la fecha a mano.',
           [('Si llega un recurso, añadirlo y registrar la entrada', 'anadir'),
            ('Si no llega, anotar que la resolución es firme', '')]),
]
ya = set(por_id)
for m in NUEVOS:
    if m['id'] not in ya:
        d['modelos'].append(m)

with open(RUTA, 'w', encoding='utf-8') as f:
    f.write(json.dumps(d, ensure_ascii=False, indent=2) + '\n')
