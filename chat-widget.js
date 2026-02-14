const CHAT_URL = "https://script.google.com/macros/s/AKfycbx9ziBKETSpxXTARK6uyFbZaLIVoHO5xodyF_r8rxrFOXwIonB1U7L1KpHNXnOAmF49Kg/exec";

(function(){

// ================= USER =================
const user = {
  username: localStorage.getItem("username") || "guest",
  nama: localStorage.getItem("nama") || "User",
  kelompok: localStorage.getItem("kelompok") || "Umum",
  role: localStorage.getItem("role") || "siswa"
};

let selectedKelompok = user.kelompok;

// ================= STYLE =================
const style = `
#chatBtn{
 position:fixed;bottom:20px;right:20px;
 background:#2e7d32;color:white;
 padding:12px 15px;border-radius:50px;
 cursor:pointer;z-index:9999;font-weight:bold;
}

#chatBox{
 position:fixed;bottom:80px;right:20px;
 width:360px;height:500px;background:white;
 border-radius:15px;box-shadow:0 0 15px rgba(0,0,0,0.3);
 display:none;flex-direction:column;
 z-index:9999;overflow:hidden;font-family:Arial;
}

#chatHeader{
 background:#2e7d32;color:white;padding:10px;
 font-weight:bold;display:flex;
 justify-content:space-between;align-items:center;
}

#chatHeader.red{
 background:#b71c1c;
 animation:blink 1s infinite;
}

@keyframes blink{
 0%{opacity:1;}
 50%{opacity:0.6;}
 100%{opacity:1;}
}

#chatMessages{
 flex:1;overflow:auto;padding:10px;
 background:#f5f5f5;font-size:13px;
}

.msg{
 margin-bottom:8px;
 max-width:75%;
 padding:8px;
 border-radius:10px;
 font-size:13px;
}

.me{
 background:#dcf8c6;
 margin-left:auto;
 text-align:right;
}

.other{
 background:white;
}

.pembimbing{
 background:#fff3cd;
 border-left:4px solid #ff9800;
}

#chatInputBox{
 display:flex;border-top:1px solid #ddd;
}

#chatInput{
 flex:1;border:none;padding:10px;
 font-size:14px;outline:none;
}

#chatSend{
 background:#2e7d32;color:white;
 border:none;padding:10px 15px;
 cursor:pointer;
}

#filterKelompok{
 margin-left:10px;
}
`;

document.head.insertAdjacentHTML("beforeend", `<style>${style}</style>`);

// ================= HTML =================
document.body.insertAdjacentHTML("beforeend", `
<div id="chatBtn">💬 Chat</div>

<div id="chatBox">
  <div id="chatHeader">
    <span id="headerTitle">Kelompok ${selectedKelompok}</span>
    <span id="onlineCount">🟢 0</span>
  </div>
  <div id="chatMessages"></div>
  <div id="chatInputBox">
    <input id="chatInput" placeholder="Ketik pesan...">
    <button id="chatSend">Kirim</button>
  </div>
</div>
`);

const btn = document.getElementById("chatBtn");
const box = document.getElementById("chatBox");
btn.onclick = ()=> box.style.display = box.style.display=="flex" ? "none" : "flex";

// ================= MODE PEMBIMBING =================
if(user.role === "pembimbing"){
  fetch(CHAT_URL+"?action=getKelompok")
  .then(r=>r.json())
  .then(list=>{
    const select = document.createElement("select");
    select.id="filterKelompok";
    list.forEach(k=>{
      const opt=document.createElement("option");
      opt.value=k; opt.text=k;
      select.appendChild(opt);
    });
    document.getElementById("chatHeader").appendChild(select);

    select.onchange=function(){
      selectedKelompok=this.value;
      document.getElementById("headerTitle").innerText="Kelompok "+selectedKelompok;
      loadChat();
    };
  });
}

// ================= NOTIFIKASI =================
const normalSound = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
const guruSound   = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

let lastCount = 0;

// ================= SEND =================
document.getElementById("chatSend").onclick = sendChat;
document.getElementById("chatInput").addEventListener("keypress",e=>{
 if(e.key==="Enter") sendChat();
});

async function sendChat(){
  const pesan = document.getElementById("chatInput").value.trim();
  if(!pesan) return;

  await fetch(CHAT_URL,{
    method:"POST",
    body:JSON.stringify({
      action:"sendChat",
      username:user.username,
      nama:user.nama,
      kelompok:selectedKelompok,
      role:user.role,
      pesan:pesan
    })
  });

  document.getElementById("chatInput").value="";
  loadChat();
}

// ================= LOAD CHAT =================
async function loadChat(){
  let url = `${CHAT_URL}?action=getChat`;

  if(user.role !== "pembimbing"){
    url += `&kelompok=${selectedKelompok}`;
  }

  const res = await fetch(url);
  const data = await res.json();

  if(data.length > lastCount){
    const lastMsg = data[data.length-1];

    if(lastMsg.role === "pembimbing"){
      guruSound.play();
      document.getElementById("chatHeader").classList.add("red");
      setTimeout(()=> {
        document.getElementById("chatHeader").classList.remove("red");
      },3000);
    }else{
      if(lastCount!==0) normalSound.play();
    }
  }

  lastCount = data.length;

  const msg = document.getElementById("chatMessages");
  msg.innerHTML="";

  data.slice(-100).forEach(c=>{
    const isMe = c.username === user.username;
    const isGuru = c.role === "pembimbing";

    msg.innerHTML+=`
      <div class="msg ${isMe?'me':'other'} ${isGuru?'pembimbing':''}">
        ${!isMe ? `<b>${c.nama}${isGuru?' ⭐':'')}</b><br>` : ""}
        ${c.pesan}
      </div>
    `;
  });

  msg.scrollTop = msg.scrollHeight;
}

// ================= ONLINE =================
async function updateOnline(){
  await fetch(CHAT_URL,{
    method:"POST",
    body:JSON.stringify({
      action:"online",
      username:user.username,
      nama:user.nama,
      kelompok:selectedKelompok,
      role:user.role
    })
  });

  const res = await fetch(`${CHAT_URL}?action=getOnline&kelompok=${selectedKelompok}`);
  const data = await res.json();
  document.getElementById("onlineCount").innerText = "🟢 "+data.length;
}

setInterval(loadChat,3000);
setInterval(updateOnline,10000);

loadChat();
updateOnline();

})();
