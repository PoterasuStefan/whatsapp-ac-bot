# 🤖 WhatsApp AC Bot

A smart home automation bot that controls an air conditioner via WhatsApp group messages, powered by AI natural language understanding.

## Overview

This bot listens to a WhatsApp group and automatically controls a Samsung SmartThings-connected air conditioner based on natural language messages. Instead of rigid commands, it uses a local LLM (Ollama + LLaMA 3.2) to understand intent — so messages like *"it's boiling in here"* or *"turn on the AC please"* are both understood correctly.

## Features

- 💬 **Natural language understanding** via Ollama (LLaMA 3.2) running locally
- ❄️ **AC control** via Samsung SmartThings API (on/off)
- 📱 **WhatsApp integration** via whatsapp-web.js (no third-party API needed)
- 🔐 **Secure credentials** via `.env` file (API keys never hardcoded)
- 🌿 **Two versions**: full AI branch and lightweight keyword-matching branch

## Architecture

```
WhatsApp Group Message
        ↓
  whatsapp-web.js (Node.js)
        ↓
  Ollama LLaMA 3.2 (local AI)
        ↓
  smartthings_ac.py (Python)
        ↓
  SmartThings API → AC Unit
```

## Tech Stack

- **Node.js** — WhatsApp bridge & orchestration
- **Python 3** — SmartThings API communication
- **Ollama + LLaMA 3.2** — local AI for intent detection
- **whatsapp-web.js** — WhatsApp Web automation
- **Samsung SmartThings API** — smart device control

## Branches

| Branch | Description |
|--------|-------------|
| `main` | Full version with Ollama AI |
| `feature/keyword-matching` | Lightweight version, no AI dependencies |

## Setup

### Prerequisites

- Node.js v20+
- Python 3.12+
- Ollama installed ([ollama.com](https://ollama.com))
- Samsung SmartThings account with a connected AC

### Installation

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/whatsapp-ac-bot.git
cd whatsapp-ac-bot

# Install Node dependencies
PUPPETEER_SKIP_DOWNLOAD=true npm install

# Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install python-dotenv

# Pull the AI model
ollama pull llama3.2
```

### Configuration

```bash
cp .env.example .env
```

Edit `.env` and add your SmartThings Personal Access Token:

```
SMARTTHINGS_API_KEY=your_api_key_here
```

Generate a token at [account.smartthings.com](https://account.smartthings.com) → Personal Access Tokens.

### Running

```bash
node index.js
```

Scan the QR code with WhatsApp on your phone. The bot is now live.

## Usage

Send any of these (or similar) messages in the configured WhatsApp group:

| Intent | Example messages |
|--------|-----------------|
| Turn AC on | *"it's so hot"*, *"turn on the AC"*, *"boiling in here"* |
| Turn AC off | *"it's freezing"*, *"turn off the AC"*, *"too cold"* |

The bot replies with a formatted confirmation message directly in the group.

## Project Structure

```
whatsapp-ac-bot/
├── index.js              # Main bot (WhatsApp + Ollama)
├── smartthings_ac.py     # SmartThings API controller
├── .env.example          # Environment variables template
├── package.json
└── README.md
```

## Notes

- WhatsApp session is saved locally in `.wwebjs_auth/` — you only need to scan the QR once
- SmartThings Personal Access Tokens expire after 24h by default — set a longer expiry when generating
- For 24/7 deployment, use `pm2` on a Linux server

## License

MIT
