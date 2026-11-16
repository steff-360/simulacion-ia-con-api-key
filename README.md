# 🤖 ISA Chat — Asistente de IA

ISA es una aplicación web de chat moderna inspirada en la interfaz y experiencia de **ChatGPT**, con respuestas en tiempo real (streaming), soporte de Markdown, bloques de código interactivos e historial de conversaciones.

---

## 🌐 Cómo desplegarlo en la nube (Online para compartir con cualquier persona)

Para que tu chat esté disponible en internet las 24 horas y cualquier persona pueda usarlo desde su celular o computadora sin depender de tu máquina:

### Opción A: Desplegar en Render (100% Gratis y Recomendado)
1. Entra a [render.com](https://render.com) e inicia sesión con tu cuenta de GitHub (`steff-360`).
2. Haz clic en **New +** y selecciona **Web Service**.
3. Selecciona tu repositorio: `steff-360/simulacion-ia-con-api-key`.
4. En **Environment Variables**, añade:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Tu API Key de Gemini
5. Haz clic en **Create Web Service**. ¡Listo! En un minuto te dará un enlace público como `https://isa-chat.onrender.com` que puedes compartir con cualquiera.

---

### Opción B: Desplegar en Vercel (100% Gratis y Ultrarrápido)
1. Entra a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub (`steff-360`).
2. Haz clic en **Add New... > Project** e importa el repositorio `simulacion-ia-con-api-key`.
3. En la sección **Environment Variables**, añade:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Tu API Key de Gemini
4. Haz clic en **Deploy**. ¡En 30 segundos tendrás un enlace público como `https://simulacion-ia-con-api-key.vercel.app`!

---

## 💻 Ejecución Local

Si prefieres correrlo en tu propia computadora:
1. Instala las dependencias: `npm install`
2. Configura tu API Key en `.env`: `GEMINI_API_KEY=tu_api_key_aqui`
3. Inicia el servidor: `node server.js` (o haz doble clic en `iniciar_isa.bat`)
4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
