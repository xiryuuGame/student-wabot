import axios from 'axios';                                                     
 import dotenv from 'dotenv';                                                   
 import fs from 'fs';                                                           
import path from 'path';
import { downloadMediaMessage } from '@fizzxydev/baileys-pro';

dotenv.config();

const HISTORY_TIMEOUT = 60 * 60 * 1000; // 1 hour in milliseconds

async function getQuotedMessageContent(quotedMessage, sock) {
    if (!quotedMessage) {
        return null;
    }

    let quotedText = '';
    let quotedImageBase64 = null;

    // Handle botInvokeMessage (self-replies)
    if (quotedMessage.botInvokeMessage) {
        const botMessage = quotedMessage.botInvokeMessage.message;
        if (botMessage?.extendedTextMessage?.text) {
            quotedText = botMessage.extendedTextMessage.text;
        }
    }
    // Handle regular quoted messages
    else {
        if (quotedMessage.conversation) {
            quotedText = quotedMessage.conversation;
        } else if (quotedMessage.extendedTextMessage?.text) {
            quotedText = quotedMessage.extendedTextMessage.text;
        } else if (quotedMessage.imageMessage?.caption) {
            quotedText = quotedMessage.imageMessage.caption;
        } else if (quotedMessage.videoMessage?.caption) {
            quotedText = quotedMessage.videoMessage.caption;
        }

        if (quotedMessage.imageMessage) {
            try {
                const buffer = await downloadMediaMessage(
                    { message: { imageMessage: quotedMessage.imageMessage } }, // Reconstruct a minimal message
                    'buffer',
                    {},
                    { logger: console }
                );
                quotedImageBase64 = buffer.toString('base64');
            } catch (error) {
                console.error("Error downloading or processing quoted image:", error);
            }
        }
    }

    return { text: quotedText, imageBase64: quotedImageBase64 };
}

const aiFunction = async (message, sock) => {
    const userId = message.participant || message.key.participant || message.key.remoteJid;
    const historyDir = './AIHistory';
    const historyFile = path.join(historyDir, `${userId}.json`);
                                                                                
     if (!fs.existsSync(historyDir)) {                                          
         fs.mkdirSync(historyDir);                                              
     }                                                                          
                                                                                
     let history = {                                                            
         messages: [],                                                          
         lastInteraction: null,                                                 
         messages: []                                                           
     };                                                                         
                                                                                
     if (fs.existsSync(historyFile)) {                                          
         try {                                                                  
             const fileContent = fs.readFileSync(historyFile, 'utf-8');         
             history = JSON.parse(fileContent);                                 
         } catch (error) {                                                      
             console.error("Error parsing history file, resetting history:",    
 error);                                                                        
             history = {                                                        
                 messages: [],                                                  
                 lastInteraction: null                                          
             };                                                                 
         }                                                                      
                                                                                
         if (history.lastInteraction && (Date.now() - history.lastInteraction > 
 HISTORY_TIMEOUT)) {                                                            
             history = {                                                        
                 messages: [],                                                  
                 lastInteraction: null                                          
             };                                                                 
         }                                                                      
        }

        let imageBase64 = null;
        let messageText = message.message?.conversation ||
            message.message?.extendedTextMessage?.text || '';
    
        if (message.message?.imageMessage) {
            try {
                const buffer = await downloadMediaMessage(
                    message,
                    'buffer',
                    {},
                    { logger: console }
                );
                imageBase64 = buffer.toString('base64');
                messageText = message.message.imageMessage.caption || 'Image received';
            } catch (error) {
                console.error("Error downloading or processing image:", error);
                messageText = "Failed to process image.";
            }
        }
    
        // Get quoted message content
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedContent = await getQuotedMessageContent(quotedMessage, sock);
        let quotedMessageText = '';
    
        if (quotedContent) {
            if (quotedContent.imageBase64) {
                quotedMessageText += `[IMAGE]`;
            }
            if (quotedContent.text){
                quotedMessageText += `<reply message>${quotedContent.text}</reply message>`;
            }
        }
    
    
        const newMessage = {
            role: 'user',
            content: quotedMessageText ? `${quotedMessageText} ${messageText}` : messageText
        };
        history.messages.push(newMessage);
    
        if (history.messages.length > 10) {
            history.messages = history.messages.slice(history.messages.length - 5)
        }
    
        try {
            const API_KEY = process.env.GEMINI_API_KEY;
            const url =
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    
                let parts = [];

                // Handle image and text together
                if (imageBase64 || quotedContent?.imageBase64) {
                    let imageData = imageBase64 || quotedContent?.imageBase64;
                    let mimeType = "image/jpeg"; // Default to JPEG, adjust if needed

                    // Add history messages
                    history.messages.forEach(m => {
                        parts.push({
                            role: m.role,
                            parts: [{ text: m.content }]
                        });
                    });
    
                    // Add the current image and text
                    parts.push({
                        role: 'user',
                        parts: [{
                            inline_data: {
                                mime_type: mimeType,
                                data: imageData
                            }
                        },
                        {
                            text: messageText
                        }]
                    });
                } else {
                    // Construct the parts array from the message history
                    history.messages.forEach(m => {
                        parts.push({
                            role: m.role,
                            parts: [{ text: m.content }]
                        });
                    });
                }
    
                const FORMAT_INSTRUCTIONS = `Always respond in Indonesian language 

Use the following WhatsApp formatting for your responses:

1. *Code Blocks*: Use triple backticks for multi-line code snippets.
   *Format:*
   \`\`\`language
   code here
   \`\`\`
   *Example:*
   \`\`\`python
   print("Hello World")
   \`\`\`
   Ensure there is a newline character before and after the code block delimiters (\`\`\`).
   Correct Example: To install, run:\n \`\`\`npm install\`\`\`
   Incorrect Example: To install, run:\n\`\`\`npm install\`\`\`

2. *Inline Code*: Use backticks for inline code, commands, or variables.
   *Format:* \`code\`
   *Example:* Use the command \`npm install\`.
   Ensure there is a single space between the backticks and any surrounding punctuation.
   Correct Example: Run \`npm install\` : to install
   Incorrect Example: Run \`npm install\`: to install

3. *Text Emphasis*:
   * Use \`\`\`italics\`\`\` for light emphasis.
   * Use *(bold)* for strong emphasis.

4. *Lists*:
   * Use - (text) or * (text) for unordered lists.
   * Use numbers (1. text, 2. text, etc.) for ordered lists.

5. *Tables*: Represent tables as lists.
   *Format:*
   - *(Column Header 1)*: Data 1
   - *(Column Header 2)*: Data 2
   *Example:*
   - *(Name)*: John Doe
   - *(Age)*: 25 years old
   - *(Occupation)*: Developer

6. *links*: 
   -dont use this
   *Format:* [link text](link url)
   *Example:* [link text](https://example.com)
   -use this
   *format:* https://example.com
   *example:* https://example.com

Provide responses using the appropriate format as needed.
If you are asked to create a table, use the list format described in number 5 above.
If a response is very long, continue without cutting it off. Let the answer stop in the middle, and I will ask you to continue if needed.
If the user's request is related to coding, provide a complete and detailed answer, including installation instructions, folder structure, files, how to run the project, etc., followed by what you created/changed, the function of what you created/changed, how to use it, etc.
If you are updating code, make sure to rewrite the complete code so that the user can understand what you have fixed and what you have changed. Don't forget to mention what features you have added and where.
if the user asks you to OCR. just write it. dont explain it or add any other text.

Strikethrough text use ~(text)~.
`;

            const data = {
                contents: parts.length > 0 ? parts : [{ parts: [{ text: messageText }] }],
                "system_instruction": {
                    "parts": {
                        "text": FORMAT_INSTRUCTIONS
                    }
                },
                "safetySettings": [
        {
            "category": "HARM_CATEGORY_HATE_SPEECH",
            "threshold": "OFF"
        },
        {
            "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
            "threshold": "OFF"
        },
        {
            "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            "threshold": "OFF"
        },
        {
            "category": "HARM_CATEGORY_HARASSMENT",
            "threshold": "OFF"
        }
    ],
                "tools": [{
    "googleSearch": {}
  }],
                generationConfig: {
                    temperature: 0.0,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                    responseMimeType: "text/plain"
                }
            };

            // fs.writeFileSync('text.json', JSON.stringify(data,0, 4))
    
            const options = {
                method: 'POST',
                url: url,
                headers: {
                    'Content-Type': 'application/json'
                },
                data
            };
    
            const response = await axios(options);
            // fs.writeFileSync('output.json', JSON.stringify(response.data, 0, 4));
    
            let reply = '';
            const parts2 = response.data.candidates[0].content.parts;
    
            if (Array.isArray(parts2)) {
                reply = parts2.map(part => part.text).join('');
            } else if (parts2 && parts2.text) {
                reply = parts2.text;
            }
    
            history.messages.push({ role: 'model', content: reply });
            history.lastInteraction = Date.now();
    
            fs.writeFileSync(historyFile, JSON.stringify(history));
    
            sock.sendMessage(message.key.remoteJid, {
                text: reply, contextInfo: {
                    quotedMessage: message.message,
                    stanzaId: message.key.id,
                    participant: message.key.participant || message.key.remoteJid
                }
            });
            return reply;
        } catch (error) {
            console.error("Gemini API error:", error);
            // fs.writeFileSync('error.json', JSON.stringify(error, 0, 4))
            sock.sendMessage(message.key.remoteJid, {
                text: 'Bot is currently at its limit, please try again later.',
                contextInfo: {
                    quotedMessage: message.message,
                    stanzaId: message.key.id,
                    participant: message.key.participant || message.key.remoteJid
                }
            });
            return null;
        }
    };
    
    export default aiFunction;