# OmniTask — Paquete Listo para Google Play Store (`cl.vorax2009.micalendario`)

Este proyecto está configurado para compilar automáticamente en **GitHub Actions**:
1. **`app-release.aab` (Firmado digitalmente con Keystore + Target SDK 36 Android 16)** listo para subir a **Google Play Console**.
2. **`app-release.apk` y `app-debug.apk`** listos para instalar directamente en tu teléfono Android.

---

## 1. Archivos incluidos en esta versión

| Archivo | Propósito |
| :--- | :--- |
| `.github/workflows/android-debug.yml` | Flujo de GitHub Actions actualizado (`ubuntu-24.04`, Node 22, `actions/setup-java@v5`, Target SDK 36, `versionCode` automático y firma `release`). |
| `feature-graphic-1024x500.png` | Gráfico de funciones obligatorio de **1024 × 500 px** para la ficha de Google Play Store. |
| `playstore-icon-512x512.png` | Ícono de **512 × 512 px** con fondo sólido `#020617` para la ficha de Google Play Store. |
| `privacy.html` | Política de Privacidad y Aviso Médico para enlazar en Google Play Console (`https://vorax2009.github.io/mi-calendario/privacy.html`). |

### Firma segura con GitHub Secrets
La llave de subida (`.jks`) y sus contraseñas **no se guardan en el repositorio**. Configura estos 4 secretos en **Settings → Secrets and variables → Actions** de tu repositorio privado `omnitask-capacitor`:
* `KEYSTORE_BASE64`: contenido de tu archivo `.jks` codificado en Base64 (una sola línea).
* `KEYSTORE_PASSWORD`: contraseña del almacén (`storePassword`).
* `KEY_ALIAS`: alias de tu llave (por ejemplo, `omnitask`).
* `KEY_PASSWORD`: contraseña de la llave (`keyPassword`).

## 2. Respuestas exactas para los cuestionarios de Google Play Console

Cuando entres a **Contenido de la aplicación** en el menú inferior izquierdo de Google Play Console, completa cada sección así:

### A. Política de privacidad
* **URL de la política de privacidad:** `https://vorax2009.github.io/mi-calendario/privacy.html` *(asegúrate de subir `privacy.html` también a tu repositorio `mi-calendario` de GitHub Pages)*.

### B. Seguridad de los datos (Data Safety)
1. **¿Tu app recopila o comparte alguno de los tipos de datos de usuario requeridos?**
   * Marca **Sí** (por la sincronización familiar opcional en Firebase Realtime Database y el respaldo opcional en Google Drive).
   * **¿Están cifrados en tránsito todos los datos de usuario que recopila tu app?** → **Sí** (usa HTTPS/TLS).
   * **¿Ofreces una forma para que los usuarios soliciten que se borren sus datos?** → **Sí** (desde *Ajustes y Respaldos → Borrar Todos los Datos* y desconexión de sala familiar, explicado en `privacy.html`).
2. **Tipos de datos que debes marcar:**
   * **Salud y bienestar (`Health and fitness`) → Información de salud (`Health info`):**
     * Se recopila: **Sí** (de forma opcional cuando el usuario activa la sincronización familiar o el respaldo en la nube).
     * Se comparte con terceros: **No**.
     * ¿Se procesa de forma efímera?: **No**.
     * ¿Es obligatorio o los usuarios pueden elegir?: **Los usuarios pueden elegir si se recopila** (la app funciona 100% local por defecto).
     * Propósito: **Funcionalidad de la app (`App functionality`)**.

### C. Aplicaciones de salud (Health Apps Declaration)
* Marca la categoría: **Control de medicamentos y manejo de tratamientos (`Medication and treatment management`)**.
* Si solicita aclaración adicional, indica que OmniTask es una agenda personal donde el usuario registra sus propios recordatorios de medicamentos, turnos y cuidados del bebé sin conexión a hardware médico ni funciones de diagnóstico clínico.

### D. Público objetivo y contenido (Target Audience)
* **Grupo de edad objetivo:** Marca **18 años y más** (aunque tenga módulo para registrar datos del bebé, la aplicación es utilizada exclusivamente por **padres/adultos y trabajadores por turnos**).
* **¿Tu ficha de Play Store podría atraer sin intención a niños?** → **No**.

### E. Permisos y declaraciones adicionales
* **Anuncios (`Ads`):** **Sí, mi aplicación contiene anuncios** (anuncios de video recompensado opcionales mediante Google AdMob).
* **Acceso a la aplicación (`App access`):** **Todas las funciones están disponibles sin restricciones de acceso especial** (no exige usuario ni contraseña para entrar a usar la app).
* **Clasificación de contenido (IARC):** Categoría **Utilidades, productividad, comunicación u otro** → Responde **No** a todo (quedará clasificada para **Todos / ESRB Everyone**).
* **Categoría de la tienda:** **Productividad**.
   * **Data Safety adicional (AdMob / Billing / Prueba gratuita):** Declara recopilación de **ID del dispositivo o de otro tipo** (ID de publicidad de AdMob y hash SHA-256 anti-reinstalación) e **Información financiera → Historial de compras** (Google Play Billing para Lifetime Premium).
