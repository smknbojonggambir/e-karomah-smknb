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

    // ================= ICONS (SVG) =================
    const iconSend = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`;
    const iconChat = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    const iconClose = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    // ================= STYLE =================
    document.head.insertAdjacentHTML("beforeend", `
    <style>
        :root {
            --chat-primary: #008069; /* Warna Utama mirip WA */
            --chat-bg: #e5ddd5;
            --msg-me: #dcf8c6;
            --msg-other: #ffffff;
        }
        
        /* Tombol Mengambang */
        #chatBtn {
            position: fixed; bottom: 20px; right: 20px;
            background: var(--chat-primary); color: white;
            width: 60px; height: 60px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            cursor: pointer; z-index: 9999;
            transition: transform 0.3s ease;
        }
        #chatBtn:hover { transform: scale(1.1); }

        /* Kotak Chat */
        #chatBox {
            position: fixed; bottom: 90px; right: 20px;
            width: 350px; height: 500px;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 5px 25px rgba(0,0,0,0.2);
            display: none; flex-direction: column;
            z-index: 9999; overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            animation: slideIn 0.3s ease-out;
        }

        /* Header */
        #chatHeader {
            background: var(--chat-primary); color: white;
            padding: 15px; display: flex;
            justify-content: space-between; align-items: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        #headerTitle { font-weight: 600; font-size: 16px; }
        #btnClose { cursor: pointer; opacity: 0.8; }
        #btnClose:hover { opacity: 1; }

        /* Area Pesan */
        #chatMessages {
            flex: 1; overflow-y: auto; padding: 15px;
            background-color: var(--chat-bg);
            background-image: url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png"); /* Pattern background optional */
            display: flex; flex-direction: column; gap: 8px;
        }

        /* Bubble Pesan */
        .msg {
            max-width: 80%; padding: 8px 12px;
            border-radius: 8px; font-size: 14px;
            line-height: 1.4; position: relative;
            box-shadow: 0 1px 1px rgba(0,0,0,0.1);
            word-wrap: break-word;
        }
        .me {
            background: var(--msg-me);
            align-self: flex-end;
            border-top-right-radius: 0;
        }
        .other {
            background: var(--msg-other);
            align-self: flex-start;
            border-top-left-radius: 0;
        }
        .sender-name {
            font-size: 11px; font-weight: bold;
            color: #d85a07; margin-bottom: 2px; display: block;
        }

        /* Input Area */
        .input-area {
            padding: 10px; background: #f0f0f0;
            display: flex; align-items: center; gap: 10px;
        }
        #chatInput {
            flex: 1; padding: 10px 15px; border-radius: 20px;
            border: 1px solid #ccc; outline: none; font-size: 14px;
        }
        #chatInput:focus { border-color: var(--chat-primary); }
        #chatSend {
            background: var(--chat-primary); color: white;
            border: none; width: 40px; height: 40px;
            border-radius: 50%; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
        }
        #chatSend:hover { opacity: 0.9; }

        /* Scrollbar Halus */
        #chatMessages::-webkit-scrollbar { width: 6px; }
        #chatMessages::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 3px; }

        @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
            #chatBox { width: 90%; right: 5%; bottom: 85px; height: 60vh; }
        }
    </style>
    `);

    // ================= HTML STRUCTURE =================
    document.body.insertAdjacentHTML("beforeend", `
    <div id="chatBtn" title="Buka Chat">${iconChat}</div>
    <div id="chatBox">
        <div id="chatHeader">
            <div>
                <div id="headerTitle">Grup: ${selectedKelompok}</div>
                <div style="font-size:11px; opacity:0.9;">🟢 Online</div>
            </div>
            <div id="btnClose">${iconClose}</div>
        </div>
        <div id="chatMessages">
            <div style="text-align:center; color:#888; font-size:12px; margin-top:10px;">
                Memuat percakapan...
            </div>
        </div>
        <div class="input-area">
            <input id="chatInput" type="text" placeholder="Ketik pesan..." autocomplete="off">
            <button id="chatSend">${iconSend}</button>
        </div>
    </div>
    `);

    // ================= LOGIC & EVENTS =================
    const btn = document.getElementById("chatBtn");
    const box = document.getElementById("chatBox");
    const closeBtn = document.getElementById("btnClose");
    const msgContainer = document.getElementById("chatMessages");

    // Toggle Chat
    function toggleChat() {
        if(box.style.display === "flex"){
            box.style.display = "none";
            btn.style.display = "flex";
        } else {
            box.style.display = "flex";
            btn.style.display = "none"; // Hide button when chat is open (optional)
            loadChat(); // Load immediately when opened
        }
    }

    btn.onclick = toggleChat;
    closeBtn.onclick = toggleChat;

    // Send Logic
    document.getElementById("chatSend").onclick = sendChat;
    document.getElementById("chatInput").addEventListener("keypress", e => {
        if(e.key === "Enter") sendChat();
    });

    async function sendChat(){
        const input = document.getElementById("chatInput");
        const pesan = input.value.trim();
        if(!pesan) return;

        // Optimistic UI: Tampilkan pesan user langsung sebelum request selesai
        appendMessage({
            username: user.username,
            nama: "Anda",
            pesan: pesan
        }, true);
        
        input.value = "";
        
        try{
            await fetch(CHAT_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "sendChat",
                    username: user.username,
                    nama: user.nama,
                    kelompok: selectedKelompok,
                    role: user.role,
                    pesan: pesan
                })
            });
            loadChat(); // Refresh to sync
        } catch(err){
            console.log("Send error:", err);
            // Opsional: Beri notifikasi error di UI
        }
    }

    // Helper untuk render pesan
    function appendMessage(c, isMe) {
        // Cek agar tidak duplikat jika dipanggil loop (untuk loadChat)
        // Di sini kita biarkan simple string injection
        const nameHtml = !isMe ? `<span class="sender-name">${c.nama}</span>` : "";
        return `
            <div class="msg ${isMe ? 'me' : 'other'}">
                ${nameHtml}
                ${c.pesan}
            </div>
        `;
    }

    // Load Chat
    async function loadChat(){
        if(box.style.display !== "flex") return; // Jangan load jika chat tertutup

        try{
            const res = await fetch(`${CHAT_URL}?action=getChat&kelompok=${selectedKelompok}`);
            const data = await res.json();

            let html = "";
            data.slice(-50).forEach(c => {
                const isMe = c.username === user.username;
                html += appendMessage(c, isMe);
            });
            
            // Cek apakah user sedang scroll ke atas. Jika ya, jangan auto-scroll ke bawah.
            const isScrolledToBottom = msgContainer.scrollHeight - msgContainer.scrollTop <= msgContainer.clientHeight + 100;

            msgContainer.innerHTML = html;

            if(isScrolledToBottom) {
                msgContainer.scrollTop = msgContainer.scrollHeight;
            }
        } catch(err){
            console.log("Load error:", err);
        }
    }

    // Auto refresh setiap 3 detik
    setInterval(loadChat, 3000);

});
