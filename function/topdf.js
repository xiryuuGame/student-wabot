import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import fsx from 'fs';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import path from 'path';
import Jimp from 'jimp'; // Import Jimp
import AdmZip from 'adm-zip';

const topdf = async (msg, sock) => {
    try {
        let imageMessage;
        let buffer;
        let images = [];

        if (msg.message?.imageMessage) {
            imageMessage = msg.message.imageMessage;
            buffer = await downloadMediaMessage(msg, 'buffer');
        } else if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
            imageMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
            buffer = await downloadMediaMessage(
                { message: { imageMessage: imageMessage } },
                'buffer',
                {},
                { logger: console }
            );
        } else if (msg.message?.documentWithCaptionMessage?.message?.documentMessage) {
            const documentMessage = msg.message.documentWithCaptionMessage.message.documentMessage;

            if (documentMessage.mimetype === 'application/zip') {
                buffer = await downloadMediaMessage(
                    { message: { documentMessage: documentMessage } },
                    'buffer',
                    {},
                    { logger: console }
                );

                const tmpDir = './temp/';
                if (!fsx.existsSync(tmpDir)) {
                    await fs.mkdir(tmpDir, { recursive: true });
                }
                const zipFilePath = path.join(tmpDir, `temp_${Date.now()}.zip`);
                await fs.writeFile(zipFilePath, buffer);

                const zip = new AdmZip(zipFilePath);
                const extractPath = path.join(tmpDir, `extracted_${Date.now()}`);
                zip.extractAllTo(extractPath, true);

                let files = fsx.readdirSync(extractPath);

                // Sort files by name, handling numbers correctly
                files.sort((a, b) => {
                    const numA = parseInt(a);
                    const numB = parseInt(b);
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB;
                    }
                    return a.localeCompare(b);
                });

                for (const file of files) {
                    const filePath = path.join(extractPath, file);
                    const fileBuffer = fsx.readFileSync(filePath);

                    // Determine the mimetype of the extracted file
                    let fileMimetype = '';
                    if (filePath.toLowerCase().endsWith('.png')) {
                        fileMimetype = 'image/png';
                    } else if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
                        fileMimetype = 'image/jpeg';
                    }

                    if (['image/png', 'image/jpeg'].includes(fileMimetype)) {
                        images.push({ buffer: fileBuffer, mimetype: fileMimetype });
                    }
                }
            } else {
                console.log("Unsupported document type. Only ZIP files are supported.");
                await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Unsupported document type. Only ZIP files are supported.', contextInfo: {
                        quotedMessage: msg.message,
                        stanzaId: msg.key.id,
                        participant: msg.key.participant || msg.key.remoteJid
                    }
                });
                return;
            }
        }
        else {
            console.log("No image or document message received.");
            return;
        }

        const pdfDoc = await PDFDocument.create();

        if (imageMessage) {
            if (!buffer) {
                console.error("Failed to download media.");
                return;
            }

            let image;
            let page;
            let jimpImage;

            try {
                jimpImage = await Jimp.read(buffer);
            } catch (error) {
                console.error("Error reading image with Jimp:", error);
                await sock.sendMessage(msg.key.remoteJid, {
                    text: 'Error reading image.', contextInfo: {
                        quotedMessage: msg.message,
                        stanzaId: msg.key.id,
                        participant: msg.key.participant || msg.key.remoteJid
                    }
                });
                return;
            }

            const width = jimpImage.getWidth();
            const height = jimpImage.getHeight();

            page = pdfDoc.addPage([width, height]);

            const imageBytes = await jimpImage.getBufferAsync(Jimp.MIME_JPEG); // Convert to JPEG for PDF
            image = await pdfDoc.embedJpg(imageBytes);

            page.drawImage(image, {
                x: 0,
                y: 0,
                width: width,
                height: height,
            });

        } else if (images.length > 0) {
            for (const img of images) {
                let image;
                let page;
                let jimpImage;

                try {
                    jimpImage = await Jimp.read(img.buffer);
                } catch (error) {
                    console.warn("Error reading image with Jimp, skipping:", error);
                    continue;
                }

                const width = jimpImage.getWidth();
                const height = jimpImage.getHeight();
                page = pdfDoc.addPage([width, height]);

                const imageBytes = await jimpImage.getBufferAsync(Jimp.MIME_JPEG);
                image = await pdfDoc.embedJpg(imageBytes);

                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: width,
                    height: height,
                });
            }
        } else {
            console.log("No images to process.");
            return;
        }

        const pdfBytes = await pdfDoc.save();

        const tmpDir = './temp/';
        if (!fsx.existsSync(tmpDir)) {
            await fs.mkdir(tmpDir, { recursive: true });
        }
        const filename = `temp_${Date.now()}.pdf`;
        const filePath = path.join(tmpDir, filename);

        await fs.writeFile(filePath, pdfBytes);

        await sock.sendMessage(msg.key.remoteJid, {
            document: { url: filePath },
            fileName: filename,
            mimetype: 'application/pdf',
            contextInfo: {
                quotedMessage: msg.message,
                stanzaId: msg.key.id,
                participant: msg.key.participant || msg.key.remoteJid
            }
        });
    } catch (error) {
        console.error('Error in topdf:', error);
        await sock.sendMessage(msg.key.remoteJid, {
            text: 'An error occurred while converting to PDF.',
            contextInfo: {
                quotedMessage: msg.message,
                stanzaId: msg.key.id,
                participant: msg.key.participant || msg.key.remoteJid
            }
        });
    }
};

export default topdf;