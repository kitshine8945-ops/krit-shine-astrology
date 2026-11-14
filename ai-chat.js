// ==========================================
// ai-chat.js - ระบบแชทหมอดู AI สุริยยาตร์
// ==========================================

// 🔑 ใส่ Gemini API Key ของคุณกฤศที่นี่ (รองรับทั้งคีย์มาตรฐาน AIzaSy และ AQ.)
const INPLACE_GEMINI_API_KEY = "AQ.Ab8RN6LdeDop7HeNzt1DLVpVScdwB9wU9ORi0vKocXI7tkoBMQ";

// 🤖 ฟังก์ชันช่วยยิง Request ไปหา Gemini AI (รองรับทั้งคีย์มาตรฐานและ AQ.)
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

// ฟังก์ชันส่งข้อความแชทหลัก
async function handleInplaceAiChat(customText = null) {
    const chatInputEl = document.getElementById('chat-user-input');
    const messagesBox = document.getElementById('ai-chat-messages-box');
    if (!messagesBox) return;

    // 1. ตรวจสอบว่าผู้ใช้งานกรอกข้อมูลวัน/เดือน/ปีเกิด หรือยัง
    const birthYearCheck = document.getElementById('birth-year') || document.getElementById('yearInput');
    if (birthYearCheck && (!birthYearCheck.value || birthYearCheck.value === "")) {
        alert("⚠️ กรุณากรอกข้อมูลวัน/เดือน/ปีเกิด ก่อนเริ่มสนทนากับหมอดู AI ครับ");
        const formSection = document.getElementById('birth-form') || birthYearCheck;
        if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
        return;
    }

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
        // สร้าง Prompt บริบทหมอดู AI สุริยยาตร์
        const prompt = `คุณคือหมอดู AI ผู้เชี่ยวชาญด้านโหราศาสตร์ไทยระบบสุริยยาตร์ ประจำเว็บไซต์ Krit Shine Astrology จงทำนายและตอบคำถามของผู้ใช้เรื่อง: "${userText}" ด้วยภาษาที่สุภาพ น่าเชื่อถือ ให้คำแนะนำเชิงบวก และอิงตามหลักดวงดาวและลัคนา`;

        const aiReply = await callGeminiAI(prompt);

        // ลบข้อความ Loading แล้วแสดงคำตอบจริง
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

// ผูก Event ปุ่มส่งข้อความและปุ่มคำถามด่วน (Quick Questions) เมื่อโหลดหน้าเว็บเสร็จ
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

    // รองรับปุ่มคำถามด่วน (Quick prompt chips)
    const quickChips = document.querySelectorAll('.quick-prompt-btn, .quick-question-btn');
    quickChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const questionText = chip.innerText.trim();
            handleInplaceAiChat(questionText);
        });
    });
});
