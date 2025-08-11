// Ynot AI — Web Assistant (app.js)
const micBtn = document.getElementById('micBtn');
const sendBtn = document.getElementById('sendBtn');
const textInput = document.getElementById('textInput');
const log = document.getElementById('log');

let recognizing = false;
let recognition = null;

function appendLog(kind, text){
  const p = document.createElement('p');
  p.innerHTML = `<strong>${kind}:</strong> ${escapeHtml(text)}`;
  log.prepend(p);
}

function speak(text){
  if('speechSynthesis' in window){
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = 'hi-IN';
    ut.rate = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(ut);
  } else {
    alert(text);
  }
}

function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Commands
async function runCommand(cmd){
  appendLog('You', cmd);
  cmd = cmd.toLowerCase().trim();

  if(cmd.includes('youtube')){
    let q = cmd.replace('youtube','').trim() || 'music';
    speak('YouTube pe search kar raha hoon ' + q);
    window.open('https://www.youtube.com/results?search_query='+encodeURIComponent(q),'_blank');
    return;
  }
  if(cmd.includes('weather') || cmd.includes('mausam')){
    speak('Mausam dekh raha hoon...');
    try {
      const res = await fetch('https://wttr.in/?format=3');
      const txt = await res.text();
      speak(txt);
      appendLog('Ynot', txt);
    } catch(e){
      speak('Mausam laane me dikkat hai.');
    }
    return;
  }
  if(cmd.includes('time') || cmd.includes('samay')){
    const t = new Date();
    const s = t.toLocaleTimeString();
    speak('Abhi ka samay hai ' + s);
    appendLog('Ynot', s);
    return;
  }
  if(cmd.includes('news') || cmd.includes('khabar')){
    speak('Taaza khabrein la raha hoon...');
    try {
      const proxy = 'https://api.allorigins.win/raw?url=';
      const url = 'http://feeds.bbci.co.uk/news/world/rss.xml';
      const res = await fetch(proxy + encodeURIComponent(url));
      const txt = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(txt,'text/xml');
      const items = doc.querySelectorAll('item');
      let out = [];
      for(let i=0;i<3 && i<items.length;i++){
        out.push(items[i].querySelector('title').textContent);
      }
      const speakTxt = out.join('. ');
      speak(speakTxt);
      appendLog('Ynot', speakTxt);
    } catch(e){
      speak('News lana mushkil hai.');
    }
    return;
  }
  if(cmd.includes('joke') || cmd.includes('mazak')){
    const jokes = [
      'Ek aadmi doctor ke paas gaya, bola meri biwi bahut zyada baat karti hai.',
      'Teacher ne pucha: agar tumhare paas 10 aam hain aur tum 4 kha lete ho, toh kitne bache? Student: 10, maam, main nahi khaunga.',
      'Pati bola: tum itni khubsurat kaise lag rahi ho? Patni boli: makeup ka kamaal.'
    ];
    const j = jokes[Math.floor(Math.random()*jokes.length)];
    speak(j);
    appendLog('Ynot', j);
    return;
  }
  if(cmd.includes('wikipedia') || cmd.includes('jankari')){
    const q = cmd.replace('wikipedia','').replace('jankari','').trim();
    if(!q){ speak('Kya jankari chahiye?'); return; }
    speak('Wikipedia se dekhta hoon ' + q);
    try {
      const res = await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(q));
      const data = await res.json();
      const extract = data.extract || 'Koi short summary nahi mila.';
      speak(extract);
      appendLog('Ynot', extract);
    } catch(e){
      speak('Wikipedia laane me dikkat hai.');
    }
    return;
  }
  if(cmd.includes('band karo') || cmd.includes('exit')){
    speak('Ynot AI band ho raha hai. Namaste!');
    stopRecognition();
    return;
  }
  speak('Ye command mujhe samajh nahi aayi. Dobara karke dekho.');
}

// Setup Web Speech Recognition
function setupRecognition(){
  if(!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)){
    appendLog('Ynot','Speech recognition not supported in this browser.');
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SR();
  recognition.lang = 'hi-IN';
  recognition.interimResults = false;
  recognition.continuous = true;

  recognition.onstart = () => { recognizing = true; micBtn.textContent = '🎤 Listening... Tap to stop'; appendLog('Ynot','Listening...'); };
  recognition.onend = () => { recognizing = false; micBtn.textContent = '🎤 Start (Auto)'; appendLog('Ynot','Stopped listening'); };
  recognition.onerror = (e) => { appendLog('Ynot','Recognition error: '+ e.error); };

  recognition.onresult = (event) => {
    const last = event.results[event.results.length-1];
    const text = last[0].transcript;
    runCommand(text);
  };
}

// Control functions
function startRecognition(){
  if(!recognition) setupRecognition();
  try{
    recognition.start();
  }catch(e){}
}
function stopRecognition(){
  try{
    recognition && recognition.stop();
  }catch(e){}
}

// UI bindings
micBtn.addEventListener('click', () => {
  if(recognizing) { stopRecognition(); } else { startRecognition(); }
});
sendBtn.addEventListener('click', () => {
  const v = textInput.value.trim();
  if(!v) return;
  runCommand(v);
  textInput.value = '';
});
textInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ sendBtn.click(); } });

// Auto-start recognition if supported
window.addEventListener('load', () => {
  setupRecognition();
  // try to start automatically (may require user gesture on mobile)
  setTimeout(()=>{ try { startRecognition(); } catch(e){} }, 700);
});
