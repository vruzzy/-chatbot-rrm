const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

const SYSTEM_PROMPT = `Eres el asistente virtual de la Residencia Refugio Mendoza, una residencia para adultos mayores ubicada en Mérida, Yucatán, México, con más de 20 años de experiencia.

Tu función es atender a familias interesadas en conocer nuestros servicios. Responde siempre en español, de forma cálida, profesional y concisa.

Información que puedes compartir:
- Somos una residencia con capacidad para adultos mayores que requieren cuidados especializados
- Contamos con personal capacitado las 24 horas
- Ofrecemos atención médica, alimentación, actividades recreativas y cuidados personales
- Para agendar una visita o conocer precios, invita al familiar a contactarnos directamente

Si te preguntan algo que no sabes con certeza, di que con gusto lo consultas y les informas.`;

// Verificación del webhook
app.get("/webhook", (req, res) => {
  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.sendStatus(403);
  }
});

// Recibir mensajes
app.post("/webhook", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message || message.type !== "text") return res.sendStatus(200);

    const from = message.from;
    const text = message.text.body;

    // Llamar a Claude
    const claudeRes = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
