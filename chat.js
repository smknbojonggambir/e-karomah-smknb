// ================= CONFIG =================
const CHAT_URL = "https://script.google.com/macros/s/AKfycbwBANif6CnJjLRowaPcN6fjVeJEmEK8WWKAnEI_MuqXTrcMDdt-IBRhMPJ0ayr3-EUfVQ/exec";

document.addEventListener("DOMContentLoaded", async function() {

    // 1. SIAPKAN DATA USER (DARI LOGIN)
    // Kita ambil dari localStorage item 'user' (hasil login)
    let localData = {};
    try {
        localData = JSON.parse(localStorage.getItem("user")) || {};
    } catch (e) {
        console.log("Belum login / Data korup");
    }

    // Set Default User (Jika belum login = Tamu, Jika sudah = Sesuai Login)
    // Note: Kita gunakan 'let' agar bisa diupdate dari server nanti
    let user = {
        username: localData.username || localData.id || "guest-" + Math.floor(Math.random() * 10000),
        nama: localData.nama || "Tamu",
        kelompok: localData.kelompok || "Umum",
        role: localData.role || "siswa"
    };

    // ================= SHADOW DOM SETUP =================
    const host = document.createElement('div');
    host.setAttribute('id', 'ekar-chat-widget-host');
    host.style.position = 'fixed'; host.style.bottom = '0'; host.style.right = '0';
    host.style.zIndex = '2147483647'; host.style.width = '0'; host.style.height = '0';
    host.style.overflow = 'visible';
    
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });

    let chatState = {
        view: 'list', 
        target: 'group', 
        targetName: user.kelompok
    };

    const icons = {
        send: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>`,
        chat: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
        close: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        back: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
        group: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
        user: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`
    };

    shadow.innerHTML = `
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        :host { --c-primary: #10b981; --c-bg: #e5ddd5; --c-me: #dcf8c6; --c-other: #ffffff; --c-text: #000000; }
        #chatBtn {
            position: fixed; bottom: 20px; right: 20px;
            background: var(--c-primary); color: white;
            width: 60px; height: 60px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); cursor: pointer; z-index: 9999;
            transition: transform 0.2s;
        }
        #chatBtn:active { transform: scale(0.9); }
        #chatBox {
            position: fixed; bottom: 90px; right: 20px;
            width: 350px; height: 500px;
            background: #fff; border-radius: 12px;
            box-shadow: 0 5px 25px rgba(0,0,0,0.2);
            display: none; flex-direction: column; z-index: 9999; overflow: hidden;
            border: 1px solid #ddd;
        }
        #chatHeader { background: var(--c-primary); color: white; padding: 10px 15px; display: flex; align-items: center; height: 50px; flex-shrink: 0; }
        #headerInfo { flex: 1; margin-left: 10px; }
        #headerTitle { font-weight: bold; font-size: 15px; }
        #headerStatus { font-size: 11px; opacity: 0.9; }
        .icon-btn { cursor: pointer; padding: 5px; display: flex; align-items: center; }
        #viewList, #viewChat { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        #userListContainer { flex: 1; overflow-y: auto; padding: 10px; background: #f5f5f5; }
        .user-card {
            background: white; padding: 12px; margin-bottom: 8px; border-radius: 8px;
            display: flex; align-items: center; gap: 12px; cursor: pointer; border-bottom: 1px solid #eee;
        }
        .user-card:hover { background: #f0f0f0; }
        .u-icon { width: 40px; height: 40px; background: #ddd; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #555; }
        .u-icon.grp { background: #e0f2f1; color: var(--c-primary); }
        .u-info { flex: 1; }
        .u-name { font-weight: bold; color: var(--c-text); font-size: 14px; }
        .u-role { font-size: 11px; color: #666; text-transform: capitalize; }
        .role-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #eee; color: #555; margin-left: auto; }
        .role-admin { background: #ffebee; color: #c62828; }
        .role-pembimbing { background: #e3f2fd; color: #1565c0; }
        #chatMessages { flex: 1; overflow-y: auto; padding: 15px; background-color: var(--c-bg); display: flex; flex-direction: column; gap: 8px; }
        .msg { max-width: 80%; padding: 8px 12px; border-radius: 8px; font-size: 14px; position: relative; word-wrap: break-word; box-shadow: 0 1px 1px rgba(0,0,0,0.1); color: var(--c-text) !important; }
        .me { background: var(--c-me); align-self: flex-end; border-top-right-radius: 0; }
        .other { background: var(--c-other); align-self: flex-start; border-top-left-radius: 0; }
        .sender-name { font-size: 10px; font-weight: bold; color: #d85a07; display: block; margin-bottom: 2px; }
        .input-area { padding: 10px; background: #f0f0f0; display: flex; gap: 10px; align-items: center; }
        #chatInput { flex: 1; padding: 10px 15px; border-radius: 20px; border: 1px solid #ccc; outline: none; font-size: 14px; color: black; background: white; }
        #sendBtn { background: var(--c-primary); color: white; border: none; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        @media (max-width: 480px) {
            #chatBox { width: 100%; height: 100%; bottom: 0; right: 0; border-radius: 0; }
            #chatBtn { bottom: 20px; right: 20px; }
        }
    </style>

    <div id="chatBtn">${icons.chat}</div>
    
    <div id="chatBox">
        <div id="chatHeader">
            <div id="btnBack" class="icon-btn" style="display:none;">${icons.back}</div>
            <div id="headerInfo">
                <div id="headerTitle">Chat Room</div>
                <div id="headerStatus">Loading...</div>
            </div>
            <div id="btnClose" class="icon-btn">${icons.close}</div>
        </div>

        <div id="viewList">
            <div id="userListContainer">
                <div style="text-align:center; padding:20px; color:#666;">Memuat kontak...</div>
            </div>
        </div>

        <div id="viewChat" style="display:none;">
            <div id="chatMessages"></div>
            <div class="input-area">
                <input id="chatInput" type="text" placeholder="Ketik pesan..." autocomplete="off">
                <button id="sendBtn">${icons.send}</button>
            </div>
        </div>
    </div>
    `;

    const els = {
        box: shadow.querySelector('#chatBox'),
        btn: shadow.querySelector('#chatBtn'),
        close: shadow.querySelector('#btnClose'),
        back: shadow.querySelector('#btnBack'),
        list: shadow.querySelector('#viewList'),
        chat: shadow.querySelector('#viewChat'),
        uContainer: shadow.querySelector('#userListContainer'),
        msgs: shadow.querySelector('#chatMessages'),
        input: shadow.querySelector('#chatInput'),
        send: shadow.querySelector('#sendBtn'),
        title: shadow.querySelector('#headerTitle'),
        status: shadow.querySelector('#headerStatus')
    };

    // ================= SYNC IDENTITY =================
    // Fungsi ini memastikan nama diambil dari Sheet berdasarkan Username Login
    async function syncIdentityFromSheet() {
        if(user.nama === "Tamu" && user.username.startsWith("guest")) return; // Skip jika memang tamu
        
        try {
            // Kita panggil action 'getProfile' yang sudah kita buat sebelumnya
            const res = await fetch(`${CHAT_URL}?action=getProfile&id=${user.username}`);
            const data = await res.json();
            
            if(data.status === 'ok') {
                console.log("Identitas Tersinkronisasi:", data);
                // Update variable user dengan data terbaru dari Sheet
                user.nama = data.nama;
                user.kelompok = data.kelompok;
                user.role = data.role;
                
                // Update tampilan Status jika sedang buka list
                if(chatState.view === 'list') {
                    els.status.innerText = user.kelompok;
                }
                
                // Simpan lagi ke localStorage agar refresh selanjutnya lebih cepat
                localStorage.setItem("user", JSON.stringify(user));
            }
        } catch (e) {
            console.warn("Gagal sinkronisasi profil chat:", e);
        }
    }

    // Jalankan Sinkronisasi segera setelah widget dimuat
    syncIdentityFromSheet();

    // ================= LOGIC =================
    
    function toggleChat() {
        if(els.box.style.display === 'flex') {
            els.box.style.display = 'none';
            els.btn.style.display = 'flex';
        } else {
            els.box.style.display = 'flex';
            els.btn.style.display = 'none';
            switchView('list');
            loadUsers();
        }
    }
    els.btn.addEventListener('click', toggleChat);
    els.close.addEventListener('click', toggleChat);

    els.back.addEventListener('click', () => {
        switchView('list');
        chatState.target = null;
    });

    function switchView(viewName) {
        chatState.view = viewName;
        if(viewName === 'list') {
            els.list.style.display = 'flex';
            els.chat.style.display = 'none';
            els.back.style.display = 'none';
            els.title.innerText = "Daftar Kontak";
            els.status.innerText = user.kelompok; // Pastikan ini menampilkan kelompok user
            loadUsers();
        } else {
            els.list.style.display = 'none';
            els.chat.style.display = 'flex';
            els.back.style.display = 'flex';
            els.title.innerText = chatState.targetName;
            els.status.innerText = chatState.target === 'group' ? 'Grup Diskusi' : 'Chat Pribadi';
            els.msgs.innerHTML = '<div style="text-align:center;margin-top:20px;color:#888;">Memuat pesan...</div>';
            loadChat();
        }
    }

    async function loadUsers() {
        if(chatState.view !== 'list') return;
        
        try {
            const res = await fetch(`${CHAT_URL}?action=getUsers&kelompok=${user.kelompok}`);
            const users = await res.json();
            
            let html = '';
            
            // GROUP BUTTON
            html += `
            <div class="user-card" id="btnGroupChat">
                <div class="u-icon grp">${icons.group}</div>
                <div class="u-info">
                    <div class="u-name">Grup ${user.kelompok}</div>
                    <div class="u-role">Diskusi Kelompok</div>
                </div>
            </div>
            <div style="font-size:12px; font-weight:bold; color:#888; margin:10px 0 5px;">ANGGOTA & PEMBIMBING</div>
            `;

            // USERS LIST
            users.forEach((u) => {
                if(String(u.username).toLowerCase() === String(user.username).toLowerCase()) return; // Hide self
                
                let badge = '';
                if(u.role === 'admin') badge = `<span class="role-badge role-admin">Admin</span>`;
                else if(u.role === 'pembimbing') badge = `<span class="role-badge role-pembimbing">Guru</span>`;
                
                html += `
                <div class="user-card contact-item" data-username="${u.username}" data-nama="${u.nama}">
                    <div class="u-icon">${icons.user}</div>
                    <div class="u-info">
                        <div class="u-name">${u.nama}</div>
                        <div class="u-role">${u.role}</div>
                    </div>
                    ${badge}
                </div>
                `;
            });

            els.uContainer.innerHTML = html;

            // Attach Listeners
            const btnGroup = shadow.getElementById('btnGroupChat');
            if(btnGroup) {
                btnGroup.addEventListener('click', () => {
                    startChatInternal('group', `Grup ${user.kelompok}`);
                });
            }

            const contacts = shadow.querySelectorAll('.contact-item');
            contacts.forEach(item => {
                item.addEventListener('click', () => {
                    startChatInternal(item.dataset.username, item.dataset.nama);
                });
            });

        } catch(e) {
            console.error(e);
            els.uContainer.innerHTML = '<div style="color:red;text-align:center;">Gagal memuat kontak</div>';
        }
    }

    function startChatInternal(targetId, targetDisplayName) {
        chatState.target = targetId;
        chatState.targetName = targetDisplayName;
        switchView('chat');
    }

    async function loadChat() {
        if(chatState.view !== 'chat') return;

        try {
            const url = `${CHAT_URL}?action=getChat&kelompok=${user.kelompok}&username=${user.username}&target=${chatState.target}`;
            const res = await fetch(url);
            const messages = await res.json();

            let html = '';
            if(messages.length === 0) html = '<div style="text-align:center;color:#999;margin-top:20px;">Belum ada pesan.</div>';

            messages.forEach(m => {
                const isMe = String(m.username).toLowerCase() === String(user.username).toLowerCase();
                html += `
                <div class="msg ${isMe ? 'me' : 'other'}">
                    ${!isMe && chatState.target === 'group' ? `<span class="sender-name">${m.nama}</span>` : ''}
                    ${m.pesan}
                </div>
                `;
            });

            const isAtBottom = els.msgs.scrollHeight - els.msgs.scrollTop <= els.msgs.clientHeight + 100;
            
            els.msgs.innerHTML = html;

            if(isAtBottom || messages.length < 5) {
                els.msgs.scrollTop = els.msgs.scrollHeight;
            }

        } catch(e) {
            console.log("Error loading chat", e);
        }
    }

    els.send.addEventListener('click', sendMessage);
    els.input.addEventListener("keypress", e => { if(e.key==="Enter") sendMessage(); });

    async function sendMessage() {
        const txt = els.input.value.trim();
        if(!txt) return;

        // UI Optimistic Update
        const tempMsg = `
            <div class="msg me" style="opacity:0.7">
                ${txt} <small>⏳</small>
            </div>`;
        els.msgs.insertAdjacentHTML('beforeend', tempMsg);
        els.msgs.scrollTop = els.msgs.scrollHeight;
        els.input.value = '';

        try {
            // KIRIM DATA LENGKAP USER (YANG SUDAH DISINKRON)
            await fetch(CHAT_URL, {
                method: "POST",
                body: JSON.stringify({
                    action: "sendChat",
                    username: user.username,
                    nama: user.nama, // Ini akan menggunakan nama yang sudah disync dari sheet
                    kelompok: user.kelompok,
                    role: user.role,
                    pesan: txt,
                    target: chatState.target
                })
            });
            loadChat();
        } catch(e) {
            alert("Gagal mengirim pesan");
        }
    }

    setInterval(() => {
        if(els.box.style.display === 'flex' && chatState.view === 'chat') {
            loadChat();
        }
    }, 4000);

});
