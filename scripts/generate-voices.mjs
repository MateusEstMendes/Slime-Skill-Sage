import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT_DIR, "apps", "api", ".env");
const CONFIG_PATH = path.join(__dirname, "voice-config.json");
const OUTPUT_DIR = path.join(ROOT_DIR, "apps", "pwa", "public", "audio", "voice");

// 1. Carregar .env
function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error(`❌ Arquivo de ambiente não encontrado: ${ENV_PATH}`);
    process.exit(1);
  }
  const content = fs.readFileSync(ENV_PATH, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (key && rest.length > 0) {
      const val = rest.join("=").replace(/^["']|["']$/g, "").trim();
      process.env[key.trim()] = val;
    }
  }
}

loadEnv();

const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_FALLBACK,
  process.env.GEMINI_API_KEY_RESERVE,
].filter(Boolean);

if (API_KEYS.length === 0) {
  console.error("❌ GEMINI_API_KEY não foi encontrada em apps/api/.env");
  process.exit(1);
}
const API_KEY = API_KEYS[0];

// 2. Carregar configuração
if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`❌ Arquivo de configuração não encontrado: ${CONFIG_PATH}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

// Suporte a flags CLI: --force, --speed <num>, --pitch <num>
const args = process.argv.slice(2);
const forceOverwrite = args.includes("--force");

const speedIndex = args.indexOf("--speed");
const cliSpeed = speedIndex !== -1 && args[speedIndex + 1] ? parseFloat(args[speedIndex + 1]) : null;

const pitchIndex = args.indexOf("--pitch");
const cliPitch = pitchIndex !== -1 && args[pitchIndex + 1] ? parseFloat(args[pitchIndex + 1]) : null;

const speed = cliSpeed ?? config.speed ?? 1.0;
const pitch = cliPitch ?? config.pitch ?? 1.0;
const voiceName = config.voice ?? "Kore";
const systemInstruction = config.systemInstruction;

console.log("==================================================");
console.log("🎙️  GERADOR DE VOZES DO SISTEMA — GEMINI (Tensura)");
console.log("==================================================");
console.log(`• Voz Oficial: ${voiceName}`);
console.log(`• Velocidade (Speed): ${speed}x`);
console.log(`• Afinação (Pitch): ${pitch}x`);
console.log(`• Modo Sobrescrita (--force): ${forceOverwrite ? "ATIVADO" : "DESATIVADO"}`);
console.log(`• Diretório de Saída: ${OUTPUT_DIR}\n`);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Verifica disponibilidade do ffmpeg
function checkFfmpeg() {
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const hasFfmpeg = checkFfmpeg();
if (hasFfmpeg) {
  console.log("✅ ffmpeg detectado: aceleração, desaceleração e ajuste de pitch DSP ativos.");
} else {
  console.log("⚠️  ffmpeg não encontrado: o áudio original será empacotado diretamente.");
}

// Helper para converter PCM 24kHz para WAV com cabeçalho padrão
function pcmToWav(pcmBuffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write("RIFF", 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

let currentKeyIndex = 0;

// Chamada direta à API do Gemini com retry e rotação de chaves
async function synthesizeWithGemini(phraseText, maxRetries = 6) {
  const payload = {
    contents: [
      {
        parts: [
          {
            text: phraseText
          }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceName
          }
        }
      }
    }
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const activeKey = API_KEYS[currentKeyIndex % API_KEYS.length];
    currentKeyIndex++;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash-tts:generateContent?key=${activeKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (response.status === 429) {
      if (API_KEYS.length > 1 && attempt <= API_KEYS.length) {
        console.log(`   🔄 Chave ${((currentKeyIndex - 1) % API_KEYS.length) + 1} atingiu cota. Alternando para chave reserva...`);
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      console.log(`   ⏳ Limite de taxa da API atingido. Aguardando 20s para janela de cota reiniciar (tentativa ${attempt}/${maxRetries})...`);
      await new Promise((r) => setTimeout(r, 20000));
      continue;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Erro na API do Gemini (${response.status}): ${errorBody}`);
    }

    const json = await response.json();
    const candidate = json.candidates?.[0];
    const part = candidate?.content?.parts?.find((p) => p.inlineData);

    if (!part || !part.inlineData || !part.inlineData.data) {
      throw new Error(`Resposta do Gemini não contém áudio válido: ${JSON.stringify(json)}`);
    }

    const mimeType = part.inlineData.mimeType || "audio/wav";
    const rawAudioBuffer = Buffer.from(part.inlineData.data, "base64");
    return { rawAudioBuffer, mimeType };
  }

  throw new Error("Número máximo de tentativas excedido devido ao limite de taxa.");
}

// Processamento de áudio com ffmpeg (ajuste de speed e pitch)
function processAudioWithFfmpeg(inputBuffer, mimeType, outputPath, targetSpeed, targetPitch) {
  const tempInput = path.join(OUTPUT_DIR, `temp_in_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.tmp`);
  const isPcm = mimeType.includes("pcm");

  if (isPcm) {
    const wavBuffer = pcmToWav(inputBuffer, 24000, 1, 16);
    fs.writeFileSync(tempInput, wavBuffer);
  } else {
    fs.writeFileSync(tempInput, inputBuffer);
  }

  try {
    // Cálculo do filtro de pitch e velocidade:
    // asetrate varia a taxa de amostragem alterando o tom e o tempo simultaneamente
    // atempo compensa ou aplica a velocidade desejada
    const sampleRate = 24000;
    const adjustedRate = Math.round(sampleRate * targetPitch);
    const tempoCompensation = (targetSpeed / targetPitch).toFixed(4);

    const filter = `asetrate=${adjustedRate},atempo=${tempoCompensation}`;

    const cmd = `ffmpeg -y -i "${tempInput}" -af "${filter}" -codec:a libmp3lame -q:a 2 "${outputPath}"`;
    execSync(cmd, { stdio: "ignore" });
  } finally {
    if (fs.existsSync(tempInput)) {
      fs.unlinkSync(tempInput);
    }
  }
}

// Tarefa de processamento de um item
async function processVoiceItem(filename, text, customSpeed = speed, customPitch = pitch) {
  const destPath = path.join(OUTPUT_DIR, filename);

  if (fs.existsSync(destPath) && !forceOverwrite) {
    console.log(`⏩ [IGNORADO - JÁ EXISTE] ${filename}`);
    return false;
  }

  console.log(`⏳ Gerando: ${filename} ...`);
  console.log(`   Texto: "${text}"`);

  try {
    const { rawAudioBuffer, mimeType } = await synthesizeWithGemini(text);

    if (hasFfmpeg) {
      processAudioWithFfmpeg(rawAudioBuffer, mimeType, destPath, customSpeed, customPitch);
    } else {
      // Salva direto
      if (mimeType.includes("pcm")) {
        const wavBuffer = pcmToWav(rawAudioBuffer, 24000, 1, 16);
        fs.writeFileSync(destPath, wavBuffer);
      } else {
        fs.writeFileSync(destPath, rawAudioBuffer);
      }
    }

    const stat = fs.statSync(destPath);
    console.log(`   ✅ Concluído! Salvo em ${filename} (${(stat.size / 1024).toFixed(1)} KB)\n`);
    return true;
  } catch (err) {
    console.error(`   ❌ Falha ao sintetizar ${filename}:`, err.message);
    return false;
  }
}

// Execução principal
async function main() {
  console.log("--- 1. FRASES CANÔNICAS DO SISTEMA ---");
  for (const [key, text] of Object.entries(config.canonicalPhrases || {})) {
    const filename = `${key}.mp3`;
    const wasGenerated = await processVoiceItem(filename, text);
    if (wasGenerated) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log("--- 2. EVOLUÇÕES DE HABILIDADES CUSTOMIZADAS ---");
  for (const skillItem of config.customSkillEvolutions || []) {
    const baseSkill = skillItem.baseSkill;
    const evolvedSkill = skillItem.evolvedSkill;
    const filename = skillItem.filename || `skill-evolved-${skillItem.id}.mp3`;

    // Fórmula solicitada:
    // Confirmação. Requisitos preenchidos. A habilidade comum [baseSkill] rompeu seus limites, ascendendo à habilidade extra [evolvedSkill].
    const text = `Confirmação. Requisitos preenchidos. A habilidade comum ${baseSkill} rompeu seus limites, ascendendo à habilidade extra ${evolvedSkill}.`;
    
    const wasGenerated = await processVoiceItem(filename, text);
    if (wasGenerated) {
      console.log("   ⏳ Aguardando 60 segundos antes da próxima requisição para renovar a janela de cota...");
      await new Promise((r) => setTimeout(r, 60000));
    }
  }

  console.log("🎉 Processamento de vozes concluído com sucesso!");
}

main().catch((err) => {
  console.error("Erro fatal na geração de vozes:", err);
  process.exit(1);
});
