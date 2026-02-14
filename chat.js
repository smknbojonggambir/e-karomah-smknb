const CHAT_URL = "https://script.google.com/macros/s/AKfycbx9ziBKETSpxXTARK6uyFbZaLIVoHO5xodyF_r8rxrFOXwIonB1U7L1KpHNXnOAmF49Kg/exec";

document.addEventListener("DOMContentLoaded", function(){

// ================= USER =================
const user = {
  username: localStorage.getItem("username") || "guest",
  nama: localStorage.getItem("nama") || "User",
  kelompok: localStorage.getItem("kelompok") || "Umum",
  role: localStorage.getItem("role") || "siswa"
};

let selectedKelompok = user.kelompok;

// ================= STYLE =================
document.head.insertAdjacentHTML("beforeend", `
<style>
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
#chatMessages{
 flex:1;overflow:auto;padding:10px;
 background:#f5f5f5;font-size:13px;
}
.msg{margin-bottom:8px;max-width:75%;padding:8px;border-radius:10px;}
.me{background:#dcf8c6;margin-left:auto;text-align:right;}
.other{background:white;}
</style>
`);

// ================= HTML =================
document.body.insertAdjacentHTML("beforeend", `
<div id="chatBtn">💬 Chat</div>
<div id="chatBox">
  <div id="chatHeader">
    <span id="headerTitle">Kelompok ${selectedKelompok}</span>
    <span id="onlineCount">🟢 0</span>
  </div>
  <div id="chatMessages"></div>
  <div style="display:flex;border-top:1px solid #ddd;">
    <input id="chatInput" style="flex:1;border:none;padding:10px;">
    <button id="chatSend" style="background:#2e7d32;color:white;border:none;padding:10px;">Kirim</button>
  </div>
</div>
`);

const btn = document.getElementById("chatBtn");
const box = document.getElementById("chatBox");
btn.onclick = ()=> {
  box.style.display = box.style.display=="flex" ? "none" : "flex";
};

// ================= SEND =================
document.getElementById("chatSend").onclick = sendChat;
document.getElementById("chatInput").addEventListener("keypress",e=>{
 if(e.key==="Enter") sendChat();
});

async function sendChat(){
  const pesan = document.getElementById("chatInput").value.trim();
  if(!pesan) return;

  try{
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
  }catch(err){
    console.log("Send error:",err);
  }

  document.getElementById("chatInput").value="";
  loadChat();
}

// ================= LOAD CHAT =================
async function loadChat(){
  try{
    const res = await fetch(`${CHAT_URL}?action=getChat&kelompok=${selectedKelompok}`);
    const data = await res.json();

    const msg = document.getElementById("chatMessages");
    msg.innerHTML="";

    data.slice(-50).forEach(c=>{
      const isMe = c.username === user.username;

      msg.innerHTML+=`
        <div class="msg ${isMe?'me':'other'}">
          ${!isMe ? `<b>${c.nama}</b><br>` : ""}
          ${c.pesan}
        </div>
      `;
    });

    msg.scrollTop = msg.scrollHeight;
  }catch(err){
    console.log("Load error:",err);
  }
}

setInterval(loadChat,3000);
loadChat();

});
