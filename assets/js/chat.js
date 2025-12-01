// Basic Chat-with-Santa front-end
// - Local "AI-style" replies (no API key required)
// - Optional text-to-speech
// - Mic input using Web Speech API (where supported)

const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const startVoiceBtn = document.getElementById("startVoiceBtn");
const voiceToggle = document.getElementById("voiceToggle");
const voiceProfileSelect = document.getElementById("voiceProfile");
const yearSpan = document.getElementById("year");

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// ---- MESSAGE UI ----

function addMessage(sender, text) {
  const wrapper = document.createElement("div");
  wrapper.className = `msg msg-${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = sender === "santa" ? "🎅" : "🧑";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";

  const name = document.createElement("div");
  name.className = "msg-name";
  name.textContent = sender === "santa" ? "Santa" : "You";

  const body = document.createElement("div");
  body.className = "msg-text";
  body.textContent = text;

  bubble.appendChild(name);
  bubble.appendChild(body);
  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function santaWelcome() {
  addMessage(
    "santa",
    "Ho ho ho! I'm Santa Claus, chatting live from the North Pole. What would you like to talk about today?"
  );
}

santaWelcome();

// ---- LOCAL SANTA REPLY LOGIC (no external API) ----

function generateLocalSantaReply(userText) {
  const text = userText.toLowerCase();

  if (!text || text.length < 2) {
    return "Ho ho ho, I didn't quite catch that. Could you say it again a bit more clearly?";
  }

  const giftKeywords = ["gift", "present", "ps5", "xbox", "toy", "iphone", "bike"];
  const niceListKeywords = ["nice list", "naughty", "good", "bad"];
  const locationKeywords = ["where are you", "north pole", "where do you live"];

  if (giftKeywords.some((w) => text.includes(w))) {
    return "Gifts, you say? 🎁 My elves and I are hard at work in the workshop. Tell me what you're wishing for, and remember: kindness makes the magic even stronger!";
  }

  if (niceListKeywords.some((w) => text.includes(w))) {
    return "Ah, the famous Nice List! 🎄 I keep a very special magical list. If you've been trying your best to be kind, helpful, and honest, you're absolutely on the right track!";
  }

  if (locationKeywords.some((w) => text.includes(w))) {
    return "I live at the North Pole, of course! 🧊 Surrounded by snow, candy canes, twinkling lights, and a very busy toy workshop.";
  }

  if (text.includes("name")) {
    return "Well, you can call me Santa, St. Nick, or Father Christmas. But I’d love to know your name too!";
  }

  if (text.includes("thank")) {
    return "You're very welcome! Ho ho ho! Spreading joy is my favorite thing to do.";
  }

  if (text.includes("merry christmas")) {
    return "Merry Christmas to you too! 🌟 May your days be merry, bright, and full of cozy hot cocoa.";
  }

  if (text.includes("school") || text.includes("grades")) {
    return "Doing your best at school is a wonderful way to stay on the Nice List. Keep learning and shining — I’m very proud of you!";
  }

  const genericReplies = [
    "That sounds wonderful! Tell me more — Santa loves hearing about your day.",
    "Ho ho ho, that made me smile! What else is going on in your world?",
    "The elves are listening in too and nodding along. Anything special you’re looking forward to this season?",
    "What a magical thought! If you could wish for one thing this year (besides presents!), what would it be?",
    "I love hearing from you. Remember, being kind to others is one of the greatest gifts you can give!"
  ];

  const index = Math.floor(Math.random() * genericReplies.length);
  return genericReplies[index];
}

function handleUserMessage(text) {
  const reply = generateLocalSantaReply(text);
  addMessage("santa", reply);
  speakIfEnabled(reply);
}

// ---- TEXT INPUT HANDLING ----

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;
  addMessage("user", text);
  userInput.value = "";
  handleUserMessage(text);
});

// ---- TEXT-TO-SPEECH ----

let voices = [];
let voicesLoaded = false;

function loadVoices() {
  if (!("speechSynthesis" in window)) return;
  voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    voicesLoaded = true;
  }
}

if ("speechSynthesis" in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

function pickVoiceForProfile(profile) {
  if (!voicesLoaded || !voices || !voices.length) return null;

  // Prefer English voices
  const englishVoices = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith("en"));
  const list = englishVoices.length ? englishVoices : voices;

  switch (profile) {
    case "mrs_claus":
      return list.find((v) =>
        /female|woman|girl/i.test(v.name)
      ) || list[0];
    case "elf":
      return list.find((v) =>
        /child|kid|boy|girl/i.test(v.name)
      ) || list[0];
    case "santa":
    default:
      return list.find((v) =>
        /male|man|david|daniel/i.test(v.name)
      ) || list[0];
  }
}

function speakIfEnabled(text) {
  if (!voiceToggle.checked) return;
  if (!("speechSynthesis" in window)) return;

  const profile = voiceProfileSelect.value;
  const voice = pickVoiceForProfile(profile);

  const utterance = new SpeechSynthesisUtterance(text);
  if (voice) utterance.voice = voice;

  // Adjust pitch/rate per persona
  if (profile === "santa") {
    utterance.pitch = 0.8;
    utterance.rate = 0.95;
  } else if (profile === "mrs_claus") {
    utterance.pitch = 1.2;
    utterance.rate = 1.0;
  } else if (profile === "elf") {
    utterance.pitch = 1.4;
    utterance.rate = 1.05;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// ---- MICROPHONE INPUT (Web Speech API) ----

let recognition = null;
let listening = false;

function setupRecognition() {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    startVoiceBtn.disabled = true;
    startVoiceBtn.textContent = "Voice not supported in this browser";
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.trim();
    if (transcript) {
      addMessage("user", transcript);
      handleUserMessage(transcript);
    }
  };

  recognition.onend = () => {
    listening = false;
    startVoiceBtn.classList.remove("is-recording");
    startVoiceBtn.innerHTML = `<span class="btn-icon">🎙️</span> Hold to talk`;
  };
}

setupRecognition();

function startListening() {
  if (!recognition || listening) return;
  listening = true;
  startVoiceBtn.classList.add("is-recording");
  startVoiceBtn.innerHTML = `<span class="btn-icon">🔴</span> Listening…`;
  try {
    recognition.start();
  } catch (err) {
    // Some browsers throw if start called twice
    console.error("Recognition start error:", err);
  }
}

function stopListening() {
  if (!recognition || !listening) return;
  listening = false;
  try {
    recognition.stop();
  } catch (err) {
    console.error("Recognition stop error:", err);
  }
}

// Use pointer events so it works with mouse + touch
startVoiceBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  startListening();
});

["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
  startVoiceBtn.addEventListener(eventName, (e) => {
    e.preventDefault();
    stopListening();
  });
});
