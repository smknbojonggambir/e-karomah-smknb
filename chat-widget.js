const CHAT_URL = "https://script.google.com/macros/s/AKfycbx9ziBKETSpxXTARK6uyFbZaLIVoHO5xodyF_r8rxrFOXwIonB1U7L1KpHNXnOAmF49Kg/exec";

(function(){

const style = `
#chatBtn{
 position:fixed;
 bottom:20px;
 right:20px;
 background:#2e7d32;
 color:white;
 padding:12px 15px;
 border-radius:50px;
 cursor:pointer;
 z-index:9999;
}

#chatBox{
 position:fixed;
 bottom:80px;
 right:20px;
 width:300px;
 height:400px;
 background:white;
 border-radius:10px;
 box-shadow:0 0 10px rgba(0,0,0,0.3);
 display:none;
 flex-direction:column;
 z-index:9999;
}

#chatMessages{
 flex:1;
 overflow:auto;
 padding:10px;
 font-size:14px;
}

#chatInputBox{
 display:flex;
}

#chatInput{
 flex:1;
 border:none;
 padding:8px;
}

#chatSend{
 background:#2e7d32;
 color:white;
 border:none;
 padding:8px;
}
`;

document.head.insertAdjacentHTML("beforeend", `<style>${style}</style>`);

document.body.insertAdjacentHTML("beforeend", `
<div id="chatBtn">💬 Chat</div>

<div id="chatBox">
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

document.getElementById("chatSend").onclick = async ()=>{
  const nama = localStorage.getItem("nama") || "User";
  const pesan = document.getElementById("chatInput").value;

  if(!pesan) return;

  await fetch(CHAT_URL,{
    method:"POST",
    body:JSON.stringify({
      action:"send",
      nama:nama,
      pesan:pesan
    })
  });

  document.getElementById("chatInput").value="";
  loadChat();
};

async function loadChat(){
  const res = await fetch(CHAT_URL+"?action=get");
  const data = await res.json();

  const msg = document.getElementById("chatMessages");
  msg.innerHTML="";

  data.slice(-50).forEach(c=>{
    msg.innerHTML+=`<div><b>${c.nama}</b><br>${c.pesan}</div><hr>`;
  });

  msg.scrollTop = msg.scrollHeight;
}

setInterval(loadChat,3000);
loadChat();

})();
