# 📅 Demo — Calendario de Disponibilidad & Coordinador Horario Global

Mini aplicación web moderna e intuitiva para coordinar reuniones entre equipos distribuidos en múltiples zonas horarias (El Salvador, México, España, etc.), con cálculo inteligente de traslapes en tiempo real, interfaz visual estilo Gantt y personalización de múltiples franjas de disponibilidad.

## 🛠️ Stack Tecnológico
- **Frontend**: React 18, TypeScript.
- **Empaquetador**: Vite.
- **Estilos & UI**: Tailwind CSS, Lucide React (iconografía oficial).
- **Zonas Horarias**: API nativa `Intl.DateTimeFormat` con identificadores canónicos IANA.
- **Base de Datos & Sincronización en la Nube**: Google Firebase Firestore en tiempo real con respaldo local offline.

## 🚀 Despliegue en GitHub Pages (Con sincronización en la nube)

1. En tu repositorio en GitHub, ve a **Settings** > **Pages**.
2. En la sección **Build and deployment**, selecciona **Source: GitHub Actions**.
3. El archivo `.github/workflows/deploy.yml` compilará la aplicación y la publicará automáticamente.
4. Todo el equipo podrá entrar al enlace de GitHub Pages desde cualquier dispositivo y sus disponibilidades se sincronizarán en tiempo real a través de Firebase Firestore.
