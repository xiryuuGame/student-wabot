import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

const scrapeAndSummarize = async (msg, sock) => {
    const url = (msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text).split(' ')[1];

    if (!url) {
        sock.sendMessage(msg.key.remoteJid, {
            text: 'Please provide a URL to scrape. Example: !scrape https://example.com',
            contextInfo: {
                quotedMessage: msg.message,
                stanzaId: msg.key.id,
                participant: msg.key.participant || msg.key.remoteJid
            }
        });
        return;
    }

    try {
        const response = await axios.get(url);
        const html = response.data;
        const $ = cheerio.load(html);

        // Extract all text from the body
        let text = $('body').text();

        // Clean up the text by removing extra spaces and newlines
        text = text.replace(/\s+/g, ' ').trim();

        if (!text) {
            sock.sendMessage(msg.key.remoteJid, {
                text: 'Could not extract any text from the provided URL.',
                contextInfo: {
                    quotedMessage: msg.message,
                    stanzaId: msg.key.id,
                    participant: msg.key.participant || msg.key.remoteJid
                }
            });
            return;
        }

        const systemPrompt = `Kamu adalah AI yang merangkum isi website dengan lengkap, jelas, dan informatif, tanpa menghilangkan detail penting. Jika website berisi:

- Tutorial atau Panduan: Berikan langkah-langkah detail, termasuk rumus, contoh, atau cara penerapannya.
- Penjelasan Konsep: Sajikan poin-poin utama dengan contoh agar mudah dipahami.
- Cerita atau Artikel Panjang: Buat ringkasan dengan alur yang tetap utuh dan tidak kehilangan makna.
- Daftar atau List: Sajikan dalam format bullet point agar ringkas dan mudah dibaca.
- Promo atau Penawaran: Tampilkan informasi utama, manfaat, dan cara mengaksesnya.

Gunakan format WhatsApp seperti bold, italic, ✅ emoji, list numerik (1., 2., 3.), dan simbol (🔹, 🔸) agar lebih nyaman dibaca. Jangan hanya merangkum singkat! Pastikan pengguna tidak perlu membuka website lagi karena sudah mendapatkan semua informasi penting dari ringkasan ini.`;

        try {
            const API_KEY = process.env.GEMINI_API_KEY;
            const urlGemini =
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    
            const data = {
                contents: [{ parts: [{ text: text }] }],
                "system_instruction": {
                    "parts": {
                        "text": systemPrompt
                    }
                },
                generationConfig: {
                    temperature: 1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "text/plain"
                }
            };
    
            const options = {
                method: 'POST',
                url: urlGemini,
                headers: {
                    'Content-Type': 'application/json'
                },
                data
            };
    
            const response = await axios(options);
            const reply = response.data.candidates[0].content.parts[0].text;
    
            sock.sendMessage(msg.key.remoteJid, {
                text: `Summary of ${url}:\n\n${reply}`,
                contextInfo: {
                    quotedMessage: msg.message,
                    stanzaId: msg.key.id,
                    participant: msg.key.participant || msg.key.remoteJid
                }
            });
        } catch (error) {
            console.error("Gemini API error:", error);
            sock.sendMessage(msg.key.remoteJid, {
                text: 'Bot is currently at its limit, please try again later.',
                contextInfo: {
                    quotedMessage: msg.message,
                    stanzaId: msg.key.id,
                    participant: msg.key.participant || msg.key.remoteJid
                }
            });
        }

    } catch (error) {
        console.error('Error scraping website:', error);
        sock.sendMessage(msg.key.remoteJid, {
            text: 'An error occurred while scraping the website.',
            contextInfo: {
                quotedMessage: msg.message,
                stanzaId: msg.key.id,
                participant: msg.key.participant || msg.key.remoteJid
            }
        });
    }
};

export default scrapeAndSummarize;
