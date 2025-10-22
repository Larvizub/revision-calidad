# Revision Calidad

Un sistema completo de gestión de revisiones de calidad diseñado para el control y monitoreo de procesos en entornos de producción. Esta aplicación web progresiva (PWA) permite realizar evaluaciones detalladas de parámetros de calidad en diferentes áreas, generar reportes profesionales y mantener un registro completo de todas las revisiones realizadas.

## 🚀 Características Principales

### 📊 **Módulos del Sistema**
- **Dashboard**: Vista general del estado de revisiones y métricas clave
- **Áreas**: Gestión de áreas de producción y espacios de trabajo
- **Parámetros**: Configuración de estándares y criterios de evaluación
- **Eventos**: Registro y seguimiento de eventos de producción
- **Revisiones de Calidad**: Evaluación detallada de parámetros por área
- **Revisiones de Áreas**: Control general de cumplimiento por zona
- **Reportes**: Generación de informes en PDF y Excel con datos completos
- **Usuarios**: Gestión de perfiles y permisos de acceso
- **Perfil**: Configuración personal del usuario

### 🎯 **Funcionalidades Avanzadas**
- **Evaluación de Parámetros**: Verificación individual de cada criterio de calidad
- **Comentarios Detallados**: Registro de observaciones específicas por parámetro
- **Estados de Cumplimiento**: Seguimiento visual de parámetros cumplidos/pendientes/no cumplidos
- **Búsqueda y Filtrado**: Localización rápida de revisiones y eventos
- **Exportación de Datos**: Reportes profesionales en múltiples formatos

### 📱 **Progressive Web App (PWA)**
- **Instalación Nativa**: Funciona como aplicación nativa en escritorio y móvil
- **Modo Offline**: Acceso a datos cacheados sin conexión
- **Notificaciones**: Actualizaciones automáticas y recordatorios
- **Rendimiento Optimizado**: Carga rápida y experiencia fluida

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **React 19** - Framework moderno para interfaces de usuario
- **TypeScript** - Tipado estático para mayor robustez
- **Vite** - Herramienta de construcción rápida y eficiente
- **Tailwind CSS** - Framework de estilos utilitario
- **Radix UI** - Componentes accesibles y personalizables

### **Backend & Base de Datos**
- **Firebase** - Plataforma backend como servicio
  - Firestore: Base de datos NoSQL en tiempo real
  - Firebase Auth: Autenticación de usuarios
  - Firebase Storage: Almacenamiento de archivos

### **Funcionalidades Adicionales**
- **React Hook Form** - Gestión eficiente de formularios
- **Zod** - Validación de esquemas de datos
- **Lucide React** - Iconografía moderna y consistente
- **jsPDF & html2canvas** - Generación de PDFs profesionales
- **XLSX** - Exportación de datos a Excel
- **File Saver** - Descarga de archivos generados

## 📋 Requisitos del Sistema

- **Node.js** versión 18 o superior
- **npm** o **yarn** para gestión de dependencias
- Navegador moderno con soporte PWA (Chrome, Edge, Firefox, Safari)

## 🚀 Instalación y Configuración

### 1. Clonar el Repositorio
```bash
git clone https://github.com/Larvizub/revision-calidad.git
cd revision-calidad
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar Firebase
1. Crear un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilitar Firestore, Authentication y Storage
3. Copiar las credenciales al archivo `.env`
4. Configurar las reglas de seguridad en Firebase

### 4. Ejecutar en Desarrollo
```bash
npm run dev
```

### 5. Construir para Producción
```bash
npm run build
npm run preview
```

## 📱 Instalación como PWA

### En Escritorio
1. Abrir la aplicación en el navegador
2. Esperar el prompt de instalación o usar el menú del navegador
3. Hacer clic en "Instalar"

### En Móvil
1. Abrir en Chrome (Android) o Safari (iOS)
2. Usar la opción "Agregar a pantalla de inicio"

## 📊 Generación de Reportes

### Excel Mejorado
- **Información del Evento**: Datos completos del evento de producción
- **Resumen de Revisiones**: Métricas de cumplimiento generales
- **Parámetros Detallados**: Evaluación individual de cada parámetro
- **Estadísticas**: Análisis completo con porcentajes y totales

### PDF Profesional
- **Diseño Corporativo**: Header con branding y colores institucionales
- **Información Completa**: Todos los datos relevantes del evento
- **Tablas Estilizadas**: Presentación clara y organizada
- **Footer Informativo**: Paginación y metadatos

## 🔧 Scripts Disponibles

```bash
npm run dev          # Inicia servidor de desarrollo
npm run build        # Construye para producción
npm run preview      # Vista previa de la build
npm run lint         # Ejecuta ESLint
```

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base (botones, tablas, etc.)
│   └── ...
├── contexts/           # Contextos de React (Auth, Toast)
├── features/           # Módulos principales de la aplicación
│   ├── Areas/
│   ├── Dashboard/
│   ├── Eventos/
│   ├── Parametros/
│   ├── Perfil/
│   ├── Reportes/
│   ├── RevisionAreas/
│   ├── RevisionCalidad/
│   └── Usuarios/
├── hooks/              # Hooks personalizados
├── lib/                # Utilidades y configuraciones
├── services/           # Servicios (Firebase, Database)
└── types/              # Definiciones TypeScript
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama para nueva funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema, por favor contactar al equipo de desarrollo.

---

**Desarrollado con ❤️ para optimizar procesos de calidad y control de producción.**
