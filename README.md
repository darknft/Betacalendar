# 📅 TeamSync — Matriz de Disponibilidad & Coordinador Horario Global

Mini aplicación web moderna e intuitiva para coordinar reuniones entre equipos distribuidos en múltiples zonas horarias (El Salvador, México, España, etc.), con cálculo inteligente de traslapes en tiempo real, interfaz visual estilo Gantt y personalización de múltiples franjas de disponibilidad.

---

## 🚀 Guía de Despliegue en tu Hosting Personal

La aplicación está construida con **React, TypeScript y Vite**. Al compilarse, genera archivos estáticos optimizados (HTML, CSS, JavaScript) dentro de la carpeta `dist/`, lo que permite alojarla en **cualquier servicio de hosting web**.

### Paso 1: Descargar el Código desde Google AI Studio
1. En la esquina superior de Google AI Studio, haz clic en el menú de ajustes o los tres puntos (`...`).
2. Selecciona **"Export as ZIP"** (o conecta tu cuenta de GitHub con **"Export to GitHub"**).
3. Descomprime el archivo ZIP en tu computadora.

### Paso 2: Generar los Archivos de Producción
1. Asegúrate de tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).
2. Abre tu terminal o consola en la carpeta del proyecto y ejecuta:
   ```bash
   # 1. Instalar dependencias
   npm install

   # 2. Compilar la aplicación para producción
   npm run build
   ```
3. Al finalizar, se creará una carpeta llamada **`dist/`** con todos los archivos listos para la web (`index.html`, `assets/`, etc.).

---

### Paso 3: Subir a tu Hosting

#### Opción A: Hosting Tradicional con cPanel (Hostinger, GoDaddy, Namecheap, etc.)
1. Ingresa al **cPanel** o Administrador de Archivos de tu proveedor de hosting.
2. Navega a la carpeta pública de tu dominio o subdominio (generalmente `public_html/` o `public_html/calendario/`).
3. Sube todos los archivos que están **dentro** de la carpeta `dist/` (no subas la carpeta `dist` en sí, sino su contenido).
4. Crea un archivo llamado `.htaccess` en esa misma carpeta con el siguiente contenido para asegurar el enrutamiento correcto:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```
5. ¡Listo! Al visitar tu dominio (ej. `https://tudominio.com`), la aplicación estará funcionando inmediatamente para todo tu equipo.

#### Opción B: Hosting Gratuito y Moderno (Vercel o Netlify)
Si prefieres no gastar en hosting o no configurar servidores:
1. **Netlify**:
   - Entra en [Netlify.com](https://www.netlify.com/).
   - Arrastra directamente la carpeta `dist/` a la sección "Drop to deploy".
   - En 10 segundos tendrás una URL segura (`https://tu-app.netlify.app`) lista para compartir.
2. **Vercel**:
   - Si subiste el repositorio a GitHub, conéctalo en [Vercel.com](https://vercel.com/) y presiona **Deploy**.

---

## 📖 Documentación de la Mini Aplicación

### 1. Propósito y Funcionalidad
Esta herramienta resuelve la fricción de programar reuniones cuando los colaboradores están en diferentes países y husos horarios:
- **Zonas Horarias Soportadas**: Convierte y sincroniza automáticamente según identificadores IANA (ej. `America/El_Salvador` UTC-6, `America/Mexico_City` UTC-6, `Europe/Madrid` UTC+2 / UTC+1).
- **Formato 12 Horas (AM/PM)**: Todas las cabeceras, slots y tooltips se presentan en formato de 12 horas accesible (ej. `8:00 am`, `10:00 am`, `5:00 pm`), eliminando la confusión de horarios militares.

### 2. Lógica Visual de Coincidencias (Motor de Traslapes)
Cada bloque horario evalúa la disponibilidad de los miembros seleccionados en tiempo real:

| Estado | Apariencia Visual | Comportamiento |
| :--- | :--- | :--- |
| **Todos Coinciden** | Fondo **Verde Esmeralda** (`bg-emerald-100`) con **Borde Verde** (`border-emerald-500`). Etiqueta `✓ Coinciden Todos`. | Habilita el botón **`+ Agendar`** para programar la sesión directamente con todos los participantes. |
| **1 No Coincide** | Fondo **Amarillo** (`bg-amber-100`) con **Borde Ámbar**. Etiqueta `1 No Coincide`. | El miembro ausente se resalta con **borde rojo grueso de 2px** y fondo rojizo para identificarlo al instante. |
| **Nadie Coincide** | Fondo **Rojo Suave** con **Borde Rojo**. Etiqueta `Nadie Coincide (0/N)`. | Indica que ningún miembro tiene disponibilidad en esa hora. |
| **Parcial** | Tonalidad ámbar suave indicando la cantidad disponible (ej. `2/5`). | Los miembros no disponibles conservan su borde rojo. |

### 3. Vistas Disponibles
- **Vista Gantt Semanal**:
  - Tabla de 7 días (Lunes a Domingo) con navegación entre semanas y botón "Semana Actual".
  - Filtro por tipo de jornada: **Solo Horas de Reunión** (recomendado) o **Jornada Laboral Completa**.
  - Selección interactiva de participantes en la barra superior.
- **Vista Gantt Diaria**:
  - Fila superior con las horas del día en formato AM/PM.
  - Celdas con las tarjetas individuales de los miembros (foto de perfil, nombre, apellido y bandera del país).
- **Matriz Semanal**:
  - Resumen visual rápido de los mejores horarios de la semana ordenados por porcentaje de traslape.
- **Directorio de Miembros**:
  - Tarjetas detalladas de cada colaborador con su zona horaria, horario laboral, franjas activas y credenciales de acceso.

### 4. Configuración de Franjas y Slots de Reunión
Desde el perfil de cada usuario (botón "Editar Perfil" o "Miembros"):
- **Múltiples Slots Independientes**: Permite ingresar intervalos libres (por ejemplo, `08:00 - 09:00` y `17:00 - 22:00`).
- **Atajos Rápidos**: Botones preconfigurados para añadir horas comunes (`+ 8:00 am (1h)`, `+ 7:00 am - 8:00 am`, `+ 5:00 pm - 7:00 pm`, `+ 5:00 pm - 10:00 pm`).
- **Selector de Horas Sueltas**: Barra táctil con botones de 7am a 10pm para activar o desactivar horas individuales con un solo clic.

---

## 👥 Usuarios de Prueba Preconfigurados

Puedes ingresar o cambiar de usuario desde el botón **"Acceso" / "Cambiar Usuario"** en el encabezado:

| Nombre | Rol | País / Zona Horaria | Correo Electrónico | Contraseña | Horas Libres de Reunión |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sofía Morales** | Administrador | 🇸🇻 El Salvador (`UTC-6`) | `sofia.morales@team.internal` | `password123` | 09:00 am - 12:00 pm |
| **Pamela Medina** | Miembro | 🇸🇻 El Salvador (`UTC-6`) | `bpamelamedina@gmail.com` | `password123` | 08:00 am - 09:00 am, 10:00 am - 12:00 pm, 05:00 pm - 10:00 pm |
| **Karla Gómez** | Miembro | 🇲🇽 México (`UTC-6`) | `karla.gomez@team.internal` | `password123` | 10:00 am - 12:00 pm |
| **Denisse Alvarado** | Miembro | 🇸🇻 El Salvador (`UTC-6`) | `denisse.alvarado@team.internal` | `password123` | 10:00 am - 02:00 pm |
| **Carlos Méndez** | Miembro | 🇪🇸 España (`Europe/Madrid`) | `carlos.mendez@team.internal` | `password123` | 03:00 pm - 07:00 pm (Hora Madrid) |

*(Nota: Como Administrador, Sofía puede crear nuevos miembros, asignar roles y generar credenciales).*

---

## 🛠️ Stack Tecnológico
- **Frontend**: React 18, TypeScript.
- **Empaquetador**: Vite.
- **Estilos & UI**: Tailwind CSS, Lucide React (iconografía oficial).
- **Zonas Horarias**: API nativa `Intl.DateTimeFormat` con identificadores canónicos IANA.
- **Persistencia**: LocalStorage seguro con emulación RLS (Row Level Security) y soporte para sincronización de calendarios.
