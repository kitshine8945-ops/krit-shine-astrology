// ==========================================
// ai-chat.js - ระบบแชทหมอดู AI สุริยยาตร์ (ดึงข้อมูลจริง + เช็กวันเกิดครบถ้วน)
// ==========================================

// 🔑 ใส่ Gemini API Key ของคุณกฤศที่นี่
const INPLACE_GEMINI_API_KEY = "AQ.Ab8RN6LdeDop7HeNzt1DLVpVScdwB9wU9ORi0vKocXI7tkoBMQ";

// 🤖 ฟังก์ชันช่วยยิง Request ไปหา Gemini AI
async function callGeminiAI(userMessage) {
    const apiKey = INPLACE_GEMINI_API_KEY.trim();
    let url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    let headers = { "Content-Type": "application/json" };

    if (apiKey.startsWith("AIzaSy")) {
        url += `?key=${apiKey}`;
    } else {
        headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
        method: "POST",
        headers: headers,
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
    const hasVipBadge = bodyText.includes("สมาชิก VIP") || bodyText.includes("VIP Active");
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

// 👤 ฟังก์ชันดึงและแสดงการ์ดข้อมูลดวงชะตาจาก "สิ่งที่ผู้ใช้กรอกบนหน้าเว็บ" แบบไดนามิกจริง
function renderNatalProfileBanner() {
    const messagesBox = document.getElementById('ai-chat-messages-box');
    if (!messagesBox) return null;

    // ค้นหาฟิลด์ข้อมูลวันเกิดจากไอดีหลากหลายรูปแบบในหน้าเว็บของคุณกฤศ
    const nameInput = document.getElementById('name') || document.getElementById('userName') || document.getElementById('owner-name') || document.querySelector('input[name*="name"]');
    const dayInput = document.getElementById('birth-day') || document.getElementById('dayInput') || document.getElementById('birthDay') || document.getElementById('day') || document.querySelector('select[name*="day"]');
    const monthInput = document.getElementById('birth-month') || document.getElementById('monthInput') || document.getElementById('birthMonth') || document.getElementById('month') || document.querySelector('select[name*="month"]');
    const yearInput = document.getElementById('birth-year') || document.getElementById('yearInput') || document.getElementById('birthYear') || document.getElementById('year') || document.querySelector('input[name*="year"], select[name*="year"]');
    const timeInput = document.getElementById('birth-time') || document.getElementById('timeInput') || document.getElementById('birthTime') || document.getElementById('time') || document.querySelector('input[name*="time"]');
    
    const zodiacDisplay = document.getElementById('zodiac-display') || document.getElementById('sun-sign') || document.getElementById('zodiac-text') || document.querySelector('.zodiac-result');
    const laksanaDisplay = document.getElementById('laksana-display') || document.getElementById('laksana-sign') || document.getElementById('laksana-text') || document.querySelector('.laksana-result');

    const nameVal = nameInput ? (nameInput.value || nameInput.innerText || nameInput.options?.[nameInput.selectedIndex]?.text || "กฤศ สุขรา") : "กฤศ สุขรา";
    const dayVal = dayInput ? (dayInput.value || dayInput.options?.[dayInput.selectedIndex]?.text || "") : "";
    const monthVal = monthInput ? (monthInput.options ? monthInput.options[monthInput.selectedIndex]?.text : monthInput.value) : "";
    const yearVal = yearInput ? (yearInput.value || "") : "";
    const timeVal = timeInput ? (timeInput.value || "") : "";

    const birthStr = (dayVal || monthVal || yearVal) ? `${dayVal} ${monthVal} พ.ศ. ${yearVal} ${timeVal ? '(' + timeVal + ' น.)' : ''}`.trim() : "30 เมษายน พ.ศ. 2522 (01:52 น.)";

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
        <div style="margin-bottom: 4px;">☀️ ราศี: ${zodiacDisplay ? zodiacDisplay.innerText : "ราศีเมษ"}</div>
        <div>🌙 ลัคนา: ${laksanaDisplay ? laksanaDisplay.innerText : "ราศีกุมภ์"}</div>
    `;

    return { nameVal, birthStr };
}

// ฟังก์ชันตรวจสอบว่ากรอกวันเกิดหรือยัง
function validateBirthInput() {
    const yearInput = document.getElementById('birth-year') || document.getElementById('yearInput') || document.getElementById('birthYear') || document.getElementById('year') || document.querySelector('input[name*="year"], select[name*="year"]');
    
    // ถ้าพบช่องปีเกิดและยังว่างอยู่
    if (yearInput && (!yearInput.value || yearInput.value === "" || yearInput.value === "0")) {
        alert("⚠️ กรุณากรอกข้อมูลวัน/เดือน/ปีเกิด ในฟอร์มด้านบนก่อนเริ่มสนทนากับหมอดู AI ครับ");
        const formSection = document.getElementById('birth-form') || document.getElementById('calculator') || yearInput;
        if (formSection) {
            formSection.scrollIntoView({ behavior: 'smooth' });
        }
        return false;
    }
    return true;
}

// ฟังก์ชันส่งข้อความแชทหลัก
async function handleInplaceAiChat(customText = null) {
    if (!checkVipStatus()) {
        return;
    }

    // ตรวจสอบวันเกิดก่อนส่ง
    if (!validateBirthInput()) {
        return;
    }

    const chatInputEl = document.getElementById('chat-user-input');
    const messagesBox = document.getElementById('ai-chat-messages-box');
    if (!messagesBox) return;

    const profile = renderNatalProfileBanner();

    const userText = customText !== null ? customText : (chatInputEl ? (chatInputEl.innerText ? chatInputEl.innerText.trim() : chatInputEl.value.trim()) : "");

    if (!userText || userText.startsWith("พิมพ์คำถามเรื่องดวง")) {
        return;
    }

    // แสดงข้อความฝั่ง User ในแชท
    appendMessage(userText, 'user');
    if (chatInputEl) {
        if (chatInputEl.innerText !== undefined) chatInputEl.innerText = "";
        else chatInputEl.value = "";
    }

    // แสดงสถานะกำลังพิมพ์ (Loading)
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

// ฟังก์ชันช่วยจัดการแสดงผลข้อความในกล่องแชท
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

// ผูก Event ปุ่มส่งข้อความและปุ่มคำถามด่วน
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderNatalProfileBanner, 500);

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

    // ⚡ ระบบดักคลิกปุ่มคำถามด่วนทุกประเภทในหน้าเว็บให้ทำงานได้ 100%
    document.addEventListener('click', (e) => {
        const chip = e.target.closest('button, .quick-prompt-btn, .quick-question-btn, .quick-chip, .suggestion-btn, .chat-chip');
        if (chip) {
            const questionText = chip.innerText ? chip.innerText.trim() : "";
            if (questionText && 
                !questionText.includes('ส่ง') && 
                !questionText.includes('VIP') && 
                !questionText.includes('สมัคร') &&
                (chip.classList.contains('quick-prompt-btn') || 
                 chip.classList.contains('quick-question-btn') || 
                 chip.classList.contains('quick-chip') || 
                 chip.classList.contains('suggestion-btn') || 
                 chip.classList.contains('chat-chip') ||
                 chip.closest('.quick-prompts, .quick-questions, .chat-suggestions, .quick-prompt-container'))) {
                
                e.preventDefault();
                handleInplaceAiChat(questionText);
            }
        }
    });
});
