
// ==========================================
// 2. โค้ดฝั่งหน้าเว็บ (ai-chat.js) - ฉบับสมบูรณ์ ปลอดภัย ไม่วนลูป
// ==========================================

// 🤖 ฟังก์ชันส่งคำถามไปที่ Backend ของเรา
async function callGeminiAI(userMessage) {
    const response = await fetch('/api/ai-chat', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Connection error");
    }
    return data.reply;
}

// 🔒 ตรวจสอบสถานะการล็อกอินและ VIP
function checkVipStatus() {
    if (typeof currentUser !== 'undefined' && !currentUser) {
        alert("⚠️ กรุณาเข้าสู่ระบบ หรือ สมัครสมาชิกก่อนใช้งานหมอดู AI ครับ");
        if (typeof openAuthModal === 'function') openAuthModal();
        return false;
    }

    const isVip = (typeof AppState !== 'undefined' && AppState.isVipUser) || localStorage.getItem('ks_vip_active') === 'true';
    if (!isVip) {
        alert("⭐ กรุณาสมัครสมาชิก VIP เพื่อใช้งานระบบหมอดู AI สุริยยาตร์เชิงลึกครับ!");
        if (typeof openFeatureModal === 'function') {
            openFeatureModal('member');
        } else {
            const memberModal = document.getElementById('modal-member');
            if (memberModal) memberModal.style.display = 'flex';
        }
        return false;
    }
    return true;
}

// 👤 ซิงค์ข้อมูลดวงชะตาแบบปลอดภัย (อ่านค่าอย่างเดียว ไม่เรียกคำนวณซ้ำซ้อนเพื่อป้องกันเว็บพัง)
function updateChatProfileCard() {
    try {
        const messagesBox = document.getElementById('ai-chat-messages-box');
        if (!messagesBox) return null;

        const nameVal = document.getElementById('userName')?.value || "เจ้าชะตา";
        const dayEl = document.getElementById('birthDay');
        const yearEl = document.getElementById('birthYearBE');
        
        const dayVal = dayEl ? dayEl.value : "";
        const monthSelect = document.getElementById('birthMonth');
        const monthVal = monthSelect ? (monthSelect.options[monthSelect.selectedIndex]?.text || "") : "";
        const yearVal = yearEl ? yearEl.value : "";
        const hourVal = document.getElementById('birthHour24')?.value || "00";
        const minVal = document.getElementById('birthMinute24')?.value || "00";

        const birthStr = (dayVal && yearVal) ? `${dayVal} ${monthVal} พ.ศ. ${yearVal} (${String(hourVal).padStart(2,'0')}:${String(minVal).padStart(2,'0')} น.)` : "ยังไม่ระบุวันเกิด";
        
        // อ่านค่าจาก ID บนหน้าเว็บแบบปลอดภัย
        let sunSignText = document.getElementById('dispSunSign')?.innerText?.trim() || 
                          document.getElementById('zodiac-sign')?.innerText?.trim() || "-";

        let ascSignText = document.getElementById('dispAscendant')?.innerText?.trim() || 
                          document.getElementById('ascendant-sign')?.innerText?.trim() || 
                          document.getElementById('lakhana')?.innerText?.trim() || "-";

        if (sunSignText !== "-" && !sunSignText.includes("ราศี")) {
            sunSignText = "ราศี" + sunSignText.replace("ราศี", "").trim();
        }
        if (ascSignText !== "-" && !ascSignText.includes("ราศี")) {
            ascSignText = "ราศี" + ascSignText.replace("ราศี", "").trim();
        }

        let cardDiv = document.getElementById('natal-profile-card');
        if (!cardDiv) {
            cardDiv = document.createElement('div');
            cardDiv.id = 'natal-profile-card';
            cardDiv.style.cssText = "background: #1e2530; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; color: #e2e8f0; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.3);";
            messagesBox.insertBefore(cardDiv, messagesBox.firstChild);
        }

        cardDiv.innerHTML = `
            <div style="font-weight: bold; color: #f59e0b; margin-bottom: 6px; font-size: 15px;">👤 เจ้าชะตา: ${nameVal}</div>
            <div style="margin-bottom: 4px;">📅 วันเกิด: ${birthStr}</div>
            <div style="margin-bottom: 4px;">☀️ ราศี: ${sunSignText}</div>
            <div>🌙 ลัคนา: ${ascSignText}</div>
        `;

        return { nameVal, birthStr, sunSignText, ascSignText };
    } catch (e) {
        console.error("updateChatProfileCard error:", e);
        return null;
    }
}

// 💬 ฟังก์ชันหลักในการส่งข้อความแชท
async function handleInplaceAiChat(customText = null) {
    if (!checkVipStatus()) return;

    const bDayEl = document.getElementById('birthDay');
    const bYearEl = document.getElementById('birthYearBE');
    if (bDayEl && (!bDayEl.value || bDayEl.value === "" || !bYearEl || !bYearEl.value)) {
        alert("⚠️ กรุณากรอกข้อมูลวัน/เดือน/ปีเกิด ในฟอร์มด้านบนก่อนเริ่มสนทนากับหมอดู AI ครับ");
        const formEl = document.getElementById('birth-form');
        if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    const chatInputEl = document.getElementById('chat-user-input');
    const messagesBox = document.getElementById('ai-chat-messages-box');
    if (!messagesBox) return;

    const profile = updateChatProfileCard();
    if (!profile) return;

    const userText = customText !== null ? customText : (chatInputEl ? (chatInputEl.innerText ? chatInputEl.innerText.trim() : chatInputEl.value.trim()) : "");
    if (!userText || userText.startsWith("พิมพ์คำถามเรื่องดวง")) return;

    appendMessage(userText, 'user');
    if (chatInputEl) {
        if (chatInputEl.innerText !== undefined) chatInputEl.innerText = "";
        else chatInputEl.value = "";
    }

    const loadingId = appendMessage("หมอดู AI กำลังคำนวณดวงชะตาตามหลักสุริยยาตร์...", 'ai-loading');

    try {
        const prompt = `คุณคือหมอดู AI ผู้เชี่ยวชาญด้านโหราศาสตร์ไทยระบบสุริยยาตร์ ประจำเว็บไซต์ Krit Shine Astrology ผู้ใช้มีข้อมูลดวงชะตาคือ: ชื่อ ${profile.nameVal}, วันเกิด ${profile.birthStr}, ราศี ${profile.sunSignText}, ลัคนา ${profile.ascSignText} จงทำนายและตอบคำถามเรื่อง: "${userText}" ด้วยภาษาที่สุภาพ น่าเชื่อถือ ให้คำทำนายที่เจาะลึก ละเอียดแม่นยำเทียบเท่าหลักการพยากรณ์ชั้นสูง อิงตามหลักดวงดาวและลัคนาจริง`;

        const aiReply = await callGeminiAI(prompt);
        removeMessage(loadingId);
        appendMessage(aiReply, 'ai');
    } catch (error) {
        console.error("AI Chat Error:", error);
        removeMessage(loadingId);
        appendMessage("ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อระบบ AI กรุณาตรวจสอบ API Key หรือลองใหม่อีกครั้ง", 'ai-error');
    }
}

// 🖥️ จัดการแสดงผลแชท
function appendMessage(text, sender) {
    const messagesBox = document.getElementById('ai-chat-messages-box');
    if (!messagesBox) return null;

    const messageDiv = document.createElement('div');
    const msgId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    messageDiv.id = msgId;

    if (sender === 'user') {
        messageDiv.style.cssText = "background: #2b3a4a; color: #fff; padding: 10px 14px; border-radius: 8px; margin: 8px 0; max-width: 80%; margin-left: auto; text-align: right;";
        messageDiv.innerText = text;
    } else if (sender === 'ai-loading') {
        messageDiv.style.cssText = "background: #1e2530; color: #aaa; padding: 10px 14px; border-radius: 8px; margin: 8px 0; max-width: 80%; font-style: italic;";
        messageDiv.innerText = text;
    } else if (sender === 'ai-error') {
        messageDiv.style.cssText = "background: #3a1e1e; color: #ff6b6b; padding: 10px 14px; border-radius: 8px; margin: 8px 0; max-width: 80%; border-left: 4px solid #ff4d4d;";
        messageDiv.innerText = text;
    } else {
        messageDiv.style.cssText = "background: #1e2530; color: #e2e8f0; padding: 12px 16px; border-radius: 8px; margin: 8px 0; max-width: 85%; border-left: 4px solid #f59e0b;";
        messageDiv.innerHTML = text.replace(/\n/g, '<br>');
    }

    messagesBox.appendChild(messageDiv);
    messagesBox.scrollTop = messagesBox.scrollHeight;
    return msgId;
}

function removeMessage(msgId) {
    const el = document.getElementById(msgId);
    if (el) el.remove();
}

// ⚡ ผูก Event เริ่มต้นการทำงานหน้าเว็บแบบปลอดภัย
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        updateChatProfileCard();
    }, 500);

    const sendBtn = document.getElementById('chat-send-btn') || document.querySelector('.chat-send-btn');
    const chatInputEl = document.getElementById('chat-user-input');

    if (sendBtn) {
        sendBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleInplaceAiChat();
        });
    }

    if (chatInputEl) {
        chatInputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleInplaceAiChat();
            }
        });
    }

    // ดักจับปุ่มคำถามด่วน
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) {
            const text = btn.innerText ? btn.innerText.trim() : "";
            if (text && 
                (text.includes('/') || text.includes('การงาน') || text.includes('การเงิน') || text.includes('ความรัก') || text.includes('สุขภาพ')) &&
                !text.includes('ส่ง') && !text.includes('VIP') && !text.includes('สมัคร')) {
                e.preventDefault();
                handleInplaceAiChat(text);
            }
        }
    });
});
