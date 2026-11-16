# 🤖 ISA Chat — Asistente de IA (Powered by Google Gemini)

ISA es una aplicación web de chat moderna inspirada en la interfaz y experiencia de **ChatGPT**, impulsada por los modelos de lenguaje de **Google Gemini** (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`).

---

## ✨ Características

- 💬 **Interfaz estilo ChatGPT**: Diseño oscuro moderno, limpio y profesional.
- ⚡ **Respuestas en tiempo real (Streaming)**: Generación fluida palabra por palabra.
- 📝 **Soporte completo para Markdown**: Títulos, listas, negritas, citas, tablas y bloques de código.
- 💻 **Resaltado de código con botón de copiar**: Soporta múltiples lenguajes de programación.
- 🗂️ **Historial de conversaciones**: Guardado automático en el navegador (puedes crear nuevos chats, volver a chats anteriores o eliminarlos).
- 🧠 **Modelos intercambiables**: Elige entre `Gemini 2.5 Flash`, `Gemini 1.5 Flash` o `Gemini 1.5 Pro` con un solo clic.
- 🛑 **Botón para detener generación**: Detén la respuesta en cualquier momento.
- 🔑 **Configuración sencilla de API Key**: Puedes ingresarla directamente en la ventana de ajustes o en el archivo `.env`.

---

## 🚀 Cómo iniciar la aplicación

### Opción 1 (La más fácil):
Haz doble clic sobre el archivo **`iniciar_isa.bat`**.  
Se abrirá automáticamente tu navegador en `http://localhost:3000`.

### Opción 2 (Desde la terminal):
```bash
npm start
# o
node server.js
```
Luego abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 🔑 Configurar tu API Key de Gemini

1. Obtén tu clave gratuita en [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Puedes colocarla de dos maneras:
   - **En la app**: Haz clic en el botón de ajustes (⚙️) abajo a la izquierda, pega tu API key y haz clic en *Guardar cambios*.
   - **En el archivo `.env`**: Abre el archivo `.env` y edita la línea:
     ```env
     GEMINI_API_KEY=AIzaSy...tu_clave_aqui
     ```
