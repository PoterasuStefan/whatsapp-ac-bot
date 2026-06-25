const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { exec } = require('child_process');
const path = require('path');

const GROUP_ID = '40735515900-1625633920@g.us';
const PYTHON = path.join(__dirname, 'venv/bin/python3');
const SCRIPT = path.join(__dirname, 'smartthings_ac.py');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: '/usr/bin/chromium-browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('\n📱 Scanează codul QR cu WhatsApp:\n');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('\n✅ Bot conectat! Ascult grupul...\n');
});

async function intreabăOllama(mesaj) {
    const prompt = `Ești un asistent smart home amuzant. Ai acces doar la aerul conditionat. Analizează mesajul și răspunde în formatul:
ACTIUNE: <actiunea>
MESAJ: <mesajul tău>

Unde actiunea este EXACT unul din:
- PORNESTE_AC (dacă e cald sau vrea AC pornit)
- OPRESTE_AC (dacă e frig sau vrea AC oprit)
- IGNORA (altceva - nu răspunde nimic)

Mesaj: "${mesaj}"`;

    try {
        const response = await fetch('http://127.0.0.1:11434/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3.2',
                prompt: prompt,
                stream: false
            })
        });
        const data = await response.json();
        const raspuns = data.response.trim();
        console.log(`🤖 Ollama a răspuns:\n${raspuns}`);

        const actiuneLinie = raspuns.split('\n').find(l => l.startsWith('ACTIUNE:'));
        const mesajLinie = raspuns.split('\n').find(l => l.startsWith('MESAJ:'));

        const actiune = actiuneLinie ? actiuneLinie.replace('ACTIUNE:', '').trim().toUpperCase() : 'IGNORA';
        const mesajOllama = mesajLinie ? mesajLinie.replace('MESAJ:', '').trim() : '';

        return { actiune, mesajOllama };
    } catch (error) {
        console.error('❌ Eroare Ollama:', error.message);
        return { actiune: 'IGNORA', mesajOllama: '' };
    }
}

async function handleMessage(msg) {
    if (msg.from !== GROUP_ID) return;

    const text = msg.body;
    console.log(`📨 Mesaj detectat: "${text}"`);

    const { actiune, mesajOllama } = await intreabăOllama(text);

    if (actiune === 'PORNESTE_AC') {
        msg.reply(`🤖 *[SISTEM AUTOMATIZARE AC]*\n----------------------------------\n${mesajOllama}\n----------------------------------\n⚙️ _Rulat via SmartThings Bot_`);
        ruleazaAC('on', msg);
    } else if (actiune === 'OPRESTE_AC') {
        msg.reply(`🤖 *[SISTEM AUTOMATIZARE AC]*\n----------------------------------\n${mesajOllama}\n----------------------------------\n⚙️ _Rulat via SmartThings Bot_`);
        ruleazaAC('off', msg);
    } 
    else {
        console.log('💬 Mesaj ignorat.');
    }
}
function ruleazaAC(comanda, msg) {
    exec(`${PYTHON} ${SCRIPT} ${comanda}`, (error, stdout) => {
        if (error) {
            console.error(`❌ Eroare: ${error.message}`);
            msg.reply('❌ Eroare la comunicarea cu AC-ul.');
            return;
        }
        console.log(`✅ AC ${comanda}: ${stdout}`);
        msg.reply(
            `🤖 *[SISTEM AUTOMATIZARE AC]*\n` +
            `----------------------------------\n` +
            `✅ AC ${comanda === 'on' ? 'pornit' : 'oprit'} cu succes!\n` +
            `----------------------------------\n` +
            `⚙️ _Rulat via SmartThings Bot_`
        );
    });
}
client.on('message', handleMessage);
client.on('message_create', (msg) => {
    if (msg.fromMe) handleMessage(msg);
});

client.initialize();