const jadwalpiket = (msg, sock) => {
    try {
        const response =
`JADWAL PIKET XI TKJ4 2024/25

---SENIN---
ARYA APRIYANSYAH
M. FARIQ FIRDAUS
MUHAMMAD TEGAR PARAWANSYAH
RAFAELL RAZAIKA THUNG
MUHAMAD NUR FAUZAN
NADIA
DAFFA ARDI SAPUTRA
RAMDHANI BUSTONI
MUHAMMAD AKMAL KURNIAWAN

---SELASA---
REVAN CAESARIO YUWANDA
SALMA AINI AHWA
LUQMAN HANAFI
AULIA SALSABILLA
FARREL ZACKY RAHMANDA
RAYHAN PRIAMBODO
ADITYA NURPRATAMA
GITA CAHYANI

---RABU---
ANDRE OCTAVIANA
MUHAMMAD HUSNI ABDULLAH
MUHAMMAD FACHRI
RADISTI PUTRI NOVILIA
ARYA PRAMUDITO
MUHAMAD WISNU NUGRAHA
IHSAN RAFI FADHILLAH
RIZKY AL SIVA

---KAMIS---
NEYSA JUWITA
KAYLA DESTIANTY
ALFINO PRATAMA
EKO BUDIYANTO
YOGA PRATAMA
MUHAMMAD ZIDAN
DZAKWAH NUR AQLI
PASYA RAMADAN

---JUM'AT---
IBNU PRAYUGO
GERALDY OMEGA CAHYA TIARA
FEBRIYANA SAFIRA
IYAS ZAKI AHDITIYA
ROMI SAPUTRA
MUHAMAD ADAM FAUZI
NAUFA NABILA PUTRI
AGAM BRAMADITYA APRILANO
MUHAMMAD RAYA ALFAREL`

        sock.sendMessage(msg.key.remoteJid, {text: response}, {quoted: msg})
    } catch (error) {
        console.error('Error in jadwalpiket:', error);
        // Handle errors appropriately, e.g., send an error message to the user
        sock.sendMessage(msg.key.remoteJid, { text: 'An error occurred.', contextInfo: {
            quotedMessage: msg.message,
            stanzaId: msg.key.id,
            participant: msg.key.participant || msg.key.remoteJid
        } });
    }
};

export default jadwalpiket;
