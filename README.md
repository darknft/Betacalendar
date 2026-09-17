# 📅 Demo — Calendario de Disponibilidad & Coordinador Horario Global

Mini aplicación web moderna e intuitiva para coordinar reuniones entre equipos distribuidos en múltiples zonas horarias (El Salvador, México, España, etc.), con cálculo inteligente de traslapes en tiempo real, interfaz visual estilo Gantt y personalización de múltiples franjas de disponibilidad.

## 🛠️ Stack Tecnológico
- **Frontend**: React 18, TypeScript.
- **Empaquetador**: Vite.
- **Estilos & UI**: Tailwind CSS, Lucide React (iconografía oficial).
- **Zonas Horarias**: API nativa `Intl.DateTimeFormat` con identificadores canónicos IANA.
- **Persistencia**: LocalStorage seguro con emulación RLS (Row Level Security) y soporte para sincronización de calendarios.
