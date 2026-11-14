// ==========================================
// ai-chat.js - ระบบแชทหมอดู AI สุริยยาตร์
// ==========================================

// 🔑 ใส่ Gemini API Key ของคุณกฤศที่นี่
const INPLACE_GEMINI_API_KEY = "AQ.Ab8RN6LdeDop7HeNzt1DLVpVScdwB9wU9ORi0vKocXI7tkoBMQ";

// ฟังก์ชันส่งข้อความแชทหลัก
async function handleInplaceAiChat() {
  const chatInputEl = document.getElementById('chat-user-input');
  const messagesBox = document.getElementById('ai-chat-messages-box');
  if (!chatInputEl || !messagesBox) return;

  const userText = chatInputEl.innerText ? chatInputEl.innerText.trim() : "";
  
  if (!userText || userText.startsWith("พิมพ์คำถามเรื่องดวง")) {
    return;
  }

  // 🛑 1. ตรวจสอบว่าผู้ใช้งานกรอกข้อมูลวัน/เดือน/ปีเกิด หรือยัง
  const birthYearCheck = document.getElementById('birth-year') || document.getElementById('yearInput') || document.getElementById('b-year') || document.getElementById('year');
  
  if (birthYearCheck && (!birthYearCheck.value || birthYearCheck.value === "")) {
    alert("⚠️ รบกวนกรอกข้อมูล วัน/เดือน/ปีเกิด ที่หน้าแรกก่อนครับ");
    
    // เลื่อนหน้าจอพุ่งตรงไปที่ช่องกรอกวันเกิดทันที
    birthYearCheck.scrollIntoView({ behavior: 'smooth', block: 'center' });
    birthYearCheck.focus();
    return;
  }

  // ดึงข้อมูลวันเกิดจากหน้าเว็บมาเป็น Context เพิ่มเติมให้ AI (ถ้ามี)
  let birthInfo = "";
  try {
    const dInput = document.getElementById('day') || document.getElementById('birth-day');
    const mInput = document.getElementById('month') || document.getElementById('birth-month');
    const yInput = birthYearCheck;
    if (dInput && mInput && yInput) {
      birthInfo = `วันเกิดเจ้าชะตา: ${dInput.value}/${mInput.value}/${yInput.value}`;
    }
  } catch (e) {
    console.log("Context warning:", e);
  }

  // แสดงข้อความของผู้ใช้งานในกล่องแชท
  const userMsgDiv = document.createElement('div');
  userMsgDiv.className = 'ai-chat-msg user';
  userMsgDiv.style.cssText = 'max-width: 85%; padding: 10px 14px; border-radius: 10px; font-size: 0.88rem; line-height: 1.5; background: #334155; color: #fff; align-self: flex-end; word-break: break-word;';
  userMsgDiv.textContent = userText;
  messagesBox.appendChild(userMsgDiv);

  chatInputEl.innerText = "";
  scrollChatToBottom();

  // แสดงสถานะกำลังประมวลผล
  const loadingId = 'ai-loading-' + Date.now();
  const loadingDiv = document.createElement('div');
  loadingDiv.id = loadingId;
  loadingDiv.className = 'ai-chat-msg bot';
  loadingDiv.style.cssText = 'max-width: 85%; padding: 10px 14px; border-radius: 10px; font-size: 0.88rem; line-height: 1.5; background: #1e293b; color: #94a3b8; border-left: 3px solid #f59e0b; align-self: flex-start;';
  loadingDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังผูกดวงและตรวจดวงชะตาตามหลักสุริยยาตร์...';
  messagesBox.appendChild(loadingDiv);
  scrollChatToBottom();

  try {
    const systemPrompt = `คุณคือหมอดู AI ผู้เชี่ยวชาญโหราศาสตร์ไทยระบบสุริยยาตร์ของเว็บไซต์ Krit Shine Astrology จงทำนายดวงชะตาอย่างลึกซึ้ง แม่นยำ ชัดเจน ระบุช่วงเวลาเห็นผลตามหลักโหราศาสตร์ไทย ${birthInfo}`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${INPLACE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\nคำถามจากผู้ใช้: " + userText }] }
        ]
      })
    });

    const data = await response.json();
    removeInplaceMessage(loadingId);

    if (data && data.candidates && data.candidates[0].content.parts[0].text) {
      const replyText = data.candidates[0].content.parts[0].text;
      const botMsgDiv = document.createElement('div');
      botMsgDiv.className = 'ai-chat-msg bot';
      botMsgDiv.style.cssText = 'max-width: 85%; padding: 10px 14px; border-radius: 10px; font-size: 0.88rem; line-height: 1.5; background: #1e293b; color: #e2e8f0; border-left: 3px solid #f59e0b; align-self: flex-start; word-break: break-word;';
      botMsgDiv.innerText = replyText;
      messagesBox.appendChild(botMsgDiv);
    } else {
      throw new Error("Invalid API response structure");
    }
  } catch (err) {
    console.error("AI Chat Error:", err);
    removeInplaceMessage(loadingId);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'ai-chat-msg bot';
    errorDiv.style.cssText = 'max-width: 85%; padding: 10px 14px; border-radius: 10px; font-size: 0.88rem; line-height: 1.5; background: #1e293b; color: #ef4444; border-left: 3px solid #ef4444; align-self: flex-start;';
    errorDiv.innerText = "ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อระบบ AI กรุณาตรวจสอบ API Key หรือลองใหม่อีกครั้ง";
    messagesBox.appendChild(errorDiv);
  }

  scrollChatToBottom();
}

function removeInplaceMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function scrollChatToBottom() {
  const chatMessagesBox = document.getElementById('ai-chat-messages-box');
  if (chatMessagesBox) {
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
  }
}

function sendQuickPrompt(text) {
  const chatInputEl = document.getElementById('chat-user-input');
  if (chatInputEl) {
    if (chatInputEl.innerText !== undefined) {
      chatInputEl.innerText = text;
      chatInputEl.style.color = '#fff';
    } else {
      chatInputEl.value = text;
    }
    handleInplaceAiChat();
  }
}
