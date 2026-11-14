// ==========================================
// ai-chat.js - ระบบแชทหมอดู AI สุริยยาตร์ (ฉบับแก้ปัญหาเช็กวันเกิดและปุ่มคำถามด่วน)
// ==========================================

// 🔑 ใส่ Gemini API Key แบบมาตรฐานที่ขึ้นต้นด้วย AIzaSy ของคุณกฤศที่นี่
const INPLACE_GEMINI_API_KEY = "AIzaSy... (ใส่ API Key ของคุณกฤศที่นี่)";

// 🤖 ฟังก์ชันเรียกใช้งาน Gemini AI
async function callGeminiAI(userMessage) {
    const apiKey = INPLACE_GEMINI_API_KEY.trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: userMessage }] }]
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error?.message || "Connection error");
    }
    return data.candidates[0].content.parts[0].text;
}

// 🔒 ฟังก์ชันตรวจสอบสถานะ VIP
function checkVipStatus() {
    const bodyText = document.body.innerText || "";
    const hasVipBadge = bodyText.includes("สมาชิก VIP") || bodyText.includes("VIP Active") || bodyText.includes("ระบบ VIP");
    const isVipLocal = window.isVipUser || localStorage.getItem('krit_shine_vip') === 'true' || document.body.classList.contains('vip-active');
    
    if (hasVipBadge || isVipLocal) {
        return true; 
    }

    const vipModal = document.getElementById('vip-modal') || document.querySelector('.vip-modal, .vip-popup, #vipModal');
    if (vipModal) {
        vipModal.style.display = 'block';
    } else {
        if (typeof openVipModal === 'function') {
            openVipModal();
        } else {
            alert("⭐ กรุณาสมัครสมาชิก VIP เพื่อใช้งานระบบหมอดู AI สุริยยาตร์เชิงลึกครับ!");
            const vipSection = document.getElementById('vip-pricing-section') || document.querySelector('.vip-container');
            if (vipSection) vipSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    return false;
}

// 👤 ฟังก์ชันตรวจสอบข้อมูลวันเกิดจากหน้าเว็บแบบยืดหยุ่น (อ่านค่าจาก Select/Input จริง)
function getBirthProfileData() {
    // ค้นหาฟิลด์วัน เดือน ปีเกิด จากหน้าเว็บแบบครอบคลุมทุกรูปแบบ
    const nameEl = document.getElementById('name') || document.getElementById('owner-name') || document.getElementById('userName') || document.querySelector('input[name*="name"]');
    
    // ค้นหาช่องปี พ.ศ. (เช็กจาก ID หรือเลือกจาก tag select ทั้งหมดบนหน้าเว็บที่อาจเป็นปีเกิด)
    let yearVal = "";
    let monthVal = "";
    let dayVal = "";
    
    const selects = document.querySelectorAll('select');
    selects.forEach(sel => {
        const text = sel.options?.[sel.selectedIndex]?.text || "";
        const val = sel.value || "";
        if (text.includes("พ.ศ.") || val.includes("พ.ศ.") || (parseInt(val) > 2400) || (parseInt(text) > 2400)) {
            yearVal = text;
        } else if (text.includes("มกราคม") || text.includes("กุมภาพันธ์") || text.includes("มีนาคม") || text.includes("เมษายน") || text.includes("พฤษภาคม") || text.includes("มิถุนายน") || text.includes("กรกฎาคม") || text.includes("สิงหาคม") || text.includes("กันยายน") || text.includes("ตุลาคม") || text.includes("พฤศจิกายน") || text.includes("ธันวาคม")) {
            monthVal = text;
        } else if (!dayVal && (parseInt(val) >= 1 && parseInt(val) <= 31 || parseInt(text) >= 1 && parseInt(text) <= 31)) {
            dayVal = text;
        }
    });

    const nameVal = nameEl ? (nameEl.value || nameEl.innerText || "").trim() : "";

    // ถ้ายังไม่มีการเลือกปีเกิด ให้ถือว่ายังไม่ได้กรอก
    if (!yearVal || yearVal.includes("เลือก") || yearVal === "") {
        return null;
    }

    const birthStr = `${dayVal !== 'เลือกวัน' ? dayVal : ''} ${monthVal !== 'เลือกเดือน' ? monthVal : ''} ${yearVal}`.trim();

    // แสดงการ์ดข้อมูลดวงชะตาในแชทอัตโนมัติเมื่อเลือกครบ
    const messagesBox = document.getElementById('ai-chat-messages-box');
    if (messagesBox) {
        let cardDiv = document.getElementById('natal-profile-card');
        if (!cardDiv) {
            cardDiv = document.createElement('div');
            cardDiv.id = 'natal-profile-card';
            cardDiv.style.cssText = "background: #1e2530; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; color: #e2e8f0; font-size: 14px;";
            messagesBox.insertBefore(cardDiv, messagesBox.firstChild);
        }
        cardDiv.innerHTML = `
            <div style="font-weight: bold; color: #f59e0b; margin-bottom: 6px; font-size: 15px;">👤 เจ้าชะตา: ${nameVal || "ผู้ใช้งาน"}</div>
            <div style="margin-bottom: 4px;">📅 วันเกิด: ${birthStr}</div>
            <div style="margin-bottom: 4px;">☀️ ราศี: คำนวณจากวันเกิด</div>
            <div>🌙 ลัคนา: คำนวณจากลัคนาสุริยยาตร์</div>
        `;
    }

    return { nameVal: nameVal || "ผู้ใช้งาน", birthStr };
}

// ฟังก์ชันส่งข้อความแชทหลัก
async function handleInplaceAiChat(customText = null) {
    if (!checkVipStatus()) {
        return;
    }

    // ตรวจสอบวันเกิดที่ผู้ใช้เลือกในฟอร์ม
    const profile = getBirthProfileData();
    if (!profile) {
        alert("⚠️ กรุณากรอกข้อมูลวัน/เดือน/ปีเกิด ในฟอร์มด้านบนให้ครบถ้วนก่อนเริ่มสนทนากับหมอดู AI ครับ");
        const formSection = document.getElementById('birth-form') || document.getElementById('calculator') || document.querySelector('form');
        if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    const chatInputEl = document.getElementById('chat-user-input');
    const messagesBox = document.getElementById('ai-chat-messages-box');
    if (!messagesBox) return;

    const userText = customText !== null ? customText : (chatInputEl ? (chatInputEl.innerText ? chatInputEl.innerText.trim() : chatInputEl.value.trim()) : "");

    if (!userText || userText.startsWith("พิมพ์คำถามเรื่องดวง")) {
        return;
    }

    appendMessage(userText, 'user');
    if (chatInputEl) {
        if (chatInputEl.innerText !== undefined) chatInputEl.innerText = "";
        else chatInputEl.value = "";
    }

    const loadingId = appendMessage("หมอดู AI กำลังคำนวณดวงชะตาตามหลักสุริยยาตร์...", 'ai-loading');

    try {
        const prompt = `คุณคือหมอดู AI ผู้เชี่ยวชาญด้านโหราศาสตร์ไทยระบบสุริยยาตร์ ประจำเว็บไซต์ Krit Shine Astrology ผู้ใช้มีข้อมูลดวงชะตาคือ: ชื่อ ${profile.nameVal}, วันเกิด ${profile.birthStr} จงทำนายและตอบคำถามเรื่อง: "${userText}" ด้วยภาษาที่สุภาพ น่าเชื่อถือ ให้คำทำนายที่เจาะลึก ละเอียดแม่นยำเทียบเท่าหลักการพยากรณ์ชั้นสูง อิงตามหลักดวงดาวและลัคนาจริง`;

        const aiReply = await callGeminiAI(prompt);

        removeMessage(loadingId);
        appendMessage(aiReply, 'ai');
    } catch (error) {
        console.error("AI Chat Error:", error);
        removeMessage(loadingId);
        appendMessage("ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อระบบ AI กรุณาตรวจสอบ API Key หรือลองใหม่อีกครั้ง", 'ai-error');
    }
}

// ฟังก์ชันแสดงข้อความในกล่องแชท
function appendMessage(text, sender) {
    const messagesBox = document.getElementById('ai-chat-messages-box');
    if (!messagesBox) return null;

    const messageDiv = document.createElement('div');
    const msgId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    messageDiv.id = msgId;

    if (sender === 'user') {
        messageDiv.className = 'user-message-bubble';
        messageDiv.style.cssText = "background: #2b3a4a; color: #fff; padding: 10px 14px; border-radius: 8px; margin: 8px 0; max-width: 80%; margin-left: auto; text-align: right;";
        messageDiv.innerText = text;
    } else if (sender === 'ai-loading') {
        messageDiv.className = 'ai-loading-bubble';
        messageDiv.style.cssText = "background: #1e2530; color: #aaa; padding: 10px 14px; border-radius: 8px; margin: 8px 0; max-width: 80%; font-style: italic;";
        messageDiv.innerText = text;
    } else if (sender === 'ai-error') {
        messageDiv.className = 'ai-error-bubble';
        messageDiv.style.cssText = "background: #3a1e1e; color: #ff6b6b; padding: 10px 14px; border-radius: 8px; margin: 8px 0; max-width: 80%; border-left: 4px solid #ff4d4d;";
        messageDiv.innerText = text;
    } else {
        messageDiv.className = 'ai-message-bubble';
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

// ผูก Event ปุ่มส่งและปุ่มคำถามด่วน
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('chat-send-btn') || document.querySelector('.chat-send-btn');
    const chatInputEl = document.getElementById('chat-user-input');

    if (sendBtn) {
        sendBtn.addEventListener('click', () => handleInplaceAiChat());
    }

    if (chatInputEl) {
        chatInputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleInplaceAiChat();
            }
        });
    }

    // ⚡ ระบบดักคลิกปุ่มคำถามด่วนทุกแบบในหน้าเว็บให้ทำงานได้ 100%
    document.addEventListener('click', (e) => {
        const chip = e.target.closest('button, .quick-prompt-btn, .quick-question-btn, .quick-chip, .suggestion-btn, .chat-chip');
        if (chip) {
            const questionText = chip.innerText ? chip.innerText.trim() : "";
            if (questionText && 
                !questionText.includes('ส่ง') && 
                !questionText.includes('VIP') && 
                !questionText.includes('สมัคร') &&
                !questionText.includes('ดูดวง')) {
                
                e.preventDefault();
                handleInplaceAiChat(questionText);
            }
        }
    });
});
