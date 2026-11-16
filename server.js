const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Llave configurada internamente desde .env
const INTERNAL_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Modelos disponibles mapeados internamente
app.get('/api/config', (req, res) => {
  res.json({
    models: [
      { id: 'gemini-3.5-flash-lite', name: 'ISA v3.5 (Rápida y Eficiente)' },
      { id: 'gemini-3.5-flash', name: 'ISA Turbo (Avanzada)' },
      { id: 'gemini-3.8-flash', name: 'ISA Plus (Nueva Generación)' }
    ]
  });
});

// Endpoint de chat con streaming SSE
app.post('/api/chat', async (req, res) => {
  const { messages, model = 'gemini-3.5-flash-lite' } = req.body;
  const apiKey = INTERNAL_API_KEY;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Lista de mensajes vacía o inválida.' });
  }

  // Headers para SSE (Server-Sent Events)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Personalidad de ISA: jamás menciona a Gemini ni Google
  const systemInstruction = {
    parts: [
      {
        text: `Eres "ISA", una asistente de inteligencia artificial personal, rápida, empática, inteligente y precisa (con la experiencia y tono conversacional de ChatGPT).
Reglas fundamentales:
1. Tu nombre es ISA. Si te preguntan quién eres, responde con orgullo que eres ISA, tu asistente inteligente.
2. NUNCA menciones a Google, ni a Gemini, ni a ninguna otra empresa o modelo externo. Tu identidad es única y 100% ISA.
3. Responde siempre en el idioma del usuario (generalmente español).
4. Emplea un formato Markdown impecable: encabezados, listas, negritas, citas y tablas.
5. Al mostrar código, incluye siempre el lenguaje (ej: \`\`\`javascript o \`\`\`python) y proporciona explicaciones directas y claras.
6. Sé siempre amable, perspicaz, concisa y orientada a resolver las dudas del usuario.`
      }
    ]
  };

  // Mapear historial de mensajes
  const contents = [];
  for (const msg of messages) {
    const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
    const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    if (!text.trim()) continue;

    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n\n${text}`;
    } else {
      contents.push({
        role,
        parts: [{ text }]
      });
    }
  }

  if (contents.length > 0 && contents[0].role !== 'user') {
    contents.unshift({ role: 'user', parts: [{ text: 'Hola ISA' }] });
  }

  const payload = {
    systemInstruction,
    contents,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95
    }
  };

  const targetModel = model || 'gemini-3.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = 'Error al procesar la solicitud.';
      try {
        const jsonErr = JSON.parse(errText);
        parsedErr = jsonErr.error?.message || errText;
      } catch (e) {}

      res.write(`data: ${JSON.stringify({ error: parsedErr })}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const jsonStr = trimmed.replace(/^data:\s*/, '');
        if (jsonStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const candidate = parsed.candidates?.[0];
          if (candidate?.content?.parts) {
            for (const part of candidate.content.parts) {
              if (part.text) {
                res.write(`data: ${JSON.stringify({ chunk: part.text })}\n\n`);
              }
            }
          }
        } catch (pe) {}
      }
    }

    if (buffer.trim().startsWith('data:')) {
      const jsonStr = buffer.trim().replace(/^data:\s*/, '');
      try {
        const parsed = JSON.parse(jsonStr);
        const parts = parsed.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const p of parts) {
            if (p.text) res.write(`data: ${JSON.stringify({ chunk: p.text })}\n\n`);
          }
        }
      } catch (e) {}
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: `Error de conexión: ${error.message}` })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`           ✨ ISA Chat Activa ✨         `);
    console.log(`========================================`);
    console.log(` Servidor activo en: http://localhost:${PORT}`);
    console.log(` Todo listo para conversar con ISA.`);
    console.log(`========================================\n`);
  });
}

module.exports = app;
