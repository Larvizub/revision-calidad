{
    "resumen": "Especificación re-formateada para que un agente la lea y ejecute pasos de implementación.",
    "meta": {
        "nombrePlataforma": "Revisión de Eventos",
        "rutaArchivoOrigen": "/C:/Dev/React/gh-revision-calidad/.github/instructions/copilot.instructions.md",
        "idioma": "es"
    },
    "stack": {
        "frontend": "React + TypeScript",
        "uiLibrary": "shadcn",
        "backendServicios": "Firebase (Realtime Database, Auth [Microsoft only], Storage)",
        "entregables": ["app SPA", "PDF reports", "Excel import"]
    },
    "diseño": {
        "colores": {
            "primario": "#273c2a",
            "secundario": "#d7c07a"
        },
        "logoPrincipal": "https://costaricacc.com/cccr/Logoheroica.png",
        "faviconYotros": "https://grupoheroica.com/wp-content/uploads/2023/10/Icono-verde.png",
        "estructuraProyecto": "Muy profesional y ordenada (carpetas por features/modules, componentes reutilizables, hooks, servicios, types)"
    },
    "requerimientosGenerales": [
        "Autenticación con Firebase Auth - solo proveedor Microsoft",
        "Conexión a Realtime Database para datos operativos",
        "Storage para archivos (ej. imágenes, PDF generados)",
        "Carga masiva desde Excel para módulo Eventos",
        "Generación de reportes PDF por ID o nombre de evento",
        "Roles: administrador, Estándar, Calidad",
        "Sidebar con navegación por módulos",
        "Interfaz en español"
    ],
    "módulos": [
        {
            "nombre": "Dashboard",
            "objetivo": "Visualizar gráficas y métricas relevantes",
            "ejemplosDatos": ["departamentos que hicieron revisión", "tiempos de revisión", "otros KPIs"],
            "salida": "Gráficas, filtros por rango/evento/departamento"
        },
        {
            "nombre": "Eventos",
            "objetivo": "CRUD de eventos",
            "camposClave": ["ID de Evento (número asignado por usuario)", "Nombre del Evento", "otros campos opcionales"],
            "funcionalidades": ["tabla con listados", "importar desde Excel (mapeo y validación)"]
        },
        {
            "nombre": "Áreas",
            "objetivo": "Definir áreas disponibles para revisiones",
            "uso": "Catálogo usado por Revisión de Areas"
        },
        {
            "nombre": "Parámetros",
            "objetivo": "Parámetros por área (usados en formularios de revisión)",
            "uso": "Catálogo de items/chequeos por área"
        },
        {
            "nombre": "Revisión de Areas",
            "objetivo": "Registrar revisiones por área",
            "flujo": [
                "Buscar evento por ID(Este es un número asignado por el usuario) o nombre",
                "Seleccionar Área (tomada del módulo Áreas)",
                "Mostrar parámetros asociados (desde Parámetros) y rellenar resultados"
            ],
            "salida": "Registro de revisión vinculado a evento + área + resultados"
        },
        {
            "nombre": "Revisión de Calidad",
            "objetivo": "Revisión consolidada y aprobación por Calidad",
            "funcionalidad": ["Listar todas las revisiones de áreas", "Aprobación/rechazo por usuario con rol Calidad", "comentarios y sello temporal"]
        },
        {
            "nombre": "Reportes",
            "objetivo": "Generar PDF de revisiones",
            "filtros": ["ID de Evento", "Nombre de Evento"],
            "requisitos": ["PDF exportable, almacenamiento opcional en Storage"]
        },
        {
            "nombre": "Usuarios",
            "objetivo": "Gestión de roles y permisos",
            "roles": ["administrador", "Estándar", "Calidad"],
            "funciones": ["asignar roles", "listar usuarios", "bloquear/desbloquear"]
        },
        {
            "nombre": "Perfil",
            "objetivo": "Configuración personal del usuario",
            "funciones": ["editar nombre, foto, preferencias"]
        }
    ],
    "criteriosDeAceptacion": [
        "Login Microsoft via Firebase funciona y restringe acceso según roles",
        "Eventos importados desde Excel aparecen correctamente en tabla",
        "Revisiones por área guardan parámetros asociados y se pueden aprobar/rechazar",
        "Reportes PDF pueden generarse y descargarse filtrando por ID o nombre",
        "UI usa colores y logos indicados y diseño consistente con shadcn"
    ],
    "planDeAcciónParaAgente": [
        "1) Validar requisitos y hacer preguntas aclaratorias (ver sección preguntas).",
        "2) Generar estructura inicial del proyecto (mono-repo o app), carpetas por feature, configuración TypeScript, Tailwind + shadcn.",
        "3) Añadir integración Firebase: Auth (Microsoft), Realtime DB, Storage. Environments seguros.",
        "4) Implementar modelos/types para Evento, Área, Parámetro, Revisión y Usuario.",
        "5) Crear componentes de UI: Sidebar, Layout, tablas, formularios, modales.",
        "6) Implementar import desde Excel (leer/validar/mapeo), usar biblioteca (p. ej. xlsx).",
        "7) Implementar generación de PDF (p. ej. jsPDF / pdfmake) y opción de guardar en Storage.",
        "8) Tests básicos y documentación de despliegue.",
        "9) Revisión final y checklist de aceptación."
    ],
    "preguntasParaElUsuario": [
        "¿Deseas que el proyecto incluya configuración para despliegue (Vercel/Azure/GH Pages)?",
        "¿Hay un esquema preexistente para los campos de Evento, Área y Parámetros o debo proponer uno?",
        "¿Los roles y permisos serán gestionados únicamente desde la app o debe sincronizarse con alguna consola externa?",
        "¿Prefieres que los PDFs se generen en cliente o en servidor (si habrá backend)?"
    ],
    "nota": "Confirma si quieres que proceda a crear la estructura inicial del proyecto y los primeros archivos. Si aceptas, indicar si prefieres formato de entrega (repo con commits, ZIP, o instrucciones paso a paso)."
}