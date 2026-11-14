/**
 * Krit Shine Astrology - Inplace AI Astrologer Chat Script
 * เชื่อมต่อระบบแชทสดกับ Gemini API และดึงข้อมูลดวงชะตาจากฟอร์มหน้าเว็บอัตโนมัติ
 */

// กำหนด Gemini API Key ของคุณกฤศที่นี่
const INPLACE_GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; 
const INPLACE_GEMINI_MODEL = "gemini-1.5-flash";

document.addEventListener('DOMContentLoaded', () => {
  const chatInputEl = document.getElementById('ai-chat-input-box');
  const chatMessagesBox = document.getElementById('ai-chat-messages-box');

  // กด Enter ในช่องพิมพ์เพื่อส่งข้อความได้ทันที
  if (chatInputEl) {
    chatInputEl.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        handleInplaceAiChat();
      }
    });
  }
});

async function handleInplaceAiChat() {
  const chatInputEl = document.getElementById('ai-chat-input-box');
  const chatMessagesBox = document.getElementById('ai-chat-messages-box');
  if (!chatInputEl || !chatMessagesBox) return;

  // 1. ตรวจสอบสถานะ VIP ก่อนใช้งาน
  var isVip = (typeof AppState !== 'undefined' && AppState.isVipUser) || localStorage.getItem('ks_vip_active') === 'true';
  if (!isVip) {
    if (confirm('⚠️ ฟีเจอร์แชทหมอดู AI ถาม-ตอบสด สงวนสิทธิ์สำหรับสมาชิก VIP\n\nต้องการดูรายละเอียดแพ็กเกจ VIP หรือไม่?')) {
      if (typeof openFeatureModal === 'function') openFeatureModal('member');
    }
    return;
  }

  const queryText = chatInputEl.value.trim();
  if (!queryText) return;

  // 2. แสดงข้อความผู้ใช้ในกล่องแชท
  appendInplaceMessage(queryText, 'user');
  chatInputEl.value = '';
  scrollChatToBottom();

  // 3. แสดงสถานะกำลังคำนวณของบอท
  const loadingId = appendInplaceMessage('กำลังคำนวณดวงชะตากำเนิดและตำแหน่งดาวจร...', 'bot loading');
  scrollChatToBottom();

  try {
    // 4. ดึงข้อมูลวันเกิดและลัคนาที่ผู้ใช้กรอกไว้บนหน้าเว็บมาเป็น Context ให้ AI โดยอัตโนมัติ
    var userName = document.getElementById('userName')?.value || 'คุณสมาชิก';
    var birthDay = document.getElementById('birthDay')?.value || 'ไม่ระบุ';
    var birthMonth = document.getElementById('birthMonth')?.value || 'ไม่ระบุ';
    var birthYearBE = document.getElementById('birthYearBE')?.value || 'ไม่ระบุ';
    
    var ascIndex = (typeof AppState !== 'undefined' && AppState.currentCalculatedAscIndex !== null) ? AppState.currentCalculatedAscIndex : null;
    var zodiacList = ["ราศีเมษ", "ราศีพฤษภ", "ราศีเมถุน", "ราศีกรกฎ", "ราศีสิงห์", "ราศีกันย์", "ราศีตุลย์", "ราศีพิจิก", "ราศีธนู", "ราศีมังกร", "ราศีกุมภ์", "ราศีมีน"];
    var userAscName = (ascIndex !== null && zodiacList[ascIndex]) ? zodiacList[ascIndex] : "ไม่ระบุ";

    var userContextPrompt = `ข้อมูลเจ้าชะตา: ชื่อ ${userName}, วันเกิด ${birthDay}/${birthMonth}/${birthYearBE}, ลัคนาสถิต ${userAscName}.`;

    const botReply = await callInplaceGeminiAPI(queryText, userContextPrompt);
    
    removeInplaceMessage(loadingId);
    appendInplaceMessage(botReply, 'bot');
  } catch (err) {
    removeInplaceMessage(loadingId);
    appendInplaceMessage('ขออภัยครับ เกิดข้อผิดพลาดในการเชื่อมต่อระบบ AI กรุณาลองใหม่อีกครั้ง', 'bot');
    console.error(err);
  }
  scrollChatToBottom();
}

async function callInplaceGeminiAPI(userQuery, contextData) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${INPLACE_GEMINI_MODEL}:generateContent?key=${INPLACE_GEMINI_API_KEY}`;

  const systemInstruction = `คุณคือหมอดู AI ผู้เชี่ยวชาญโหราศาสตร์ไทยระบบสุริยยาตร์ ประจำเว็บไซต์ Krit Shine Astrology ทำหน้าที่ให้คำปรึกษา ทำนายดวงชะตา เจาะลึกเรื่องการงาน การเงิน ความรัก และสุขภาพ พร้อมระบุช่วงเวลาที่จะเห็นผลลัพธ์ชัดเจนอย่างแม่นยำ สุภาพ และให้กำลังใจ ${contextData}`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: `[System Instruction: ${systemInstruction}]\n\nคำถามจากผู้ใช้: ${userQuery}` }
        ]
      }
    ]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error('Gemini API request failed');

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "ขออภัยครับ ดวงชะตากำลังโคจรผิดปกติ ลองถามใหม่อีกครั้งนะครับ";
}

function appendInplaceMessage(text, className) {
  const chatMessagesBox = document.getElementById('ai-chat-messages-box');
  if (!chatMessagesBox) return '';

  const msgDiv = document.createElement('div');
  msgDiv.className = `ai-chat-msg ${className}`;
  
  if (className.includes('user')) {
    msgDiv.style.cssText = 'max-width: 85%; padding: 10px 14px; border-radius: 10px; font-size: 0.88rem; line-height: 1.5; background: #f59e0b; color: #0b0f19; align-self: flex-end; font-weight: 500; word-break: break-word;';
  } else {
    msgDiv.style.cssText = 'max-width: 85%; padding: 10px 14px; border-radius: 10px; font-size: 0.88rem; line-height: 1.5; background: #1e293b; color: #e2e8f0; border-left: 3px solid #f59e0b; align-self: flex-start; word-break: break-word;';
  }

  msgDiv.innerText = text;
  const id = 'msg-' + Date.now() + Math.random();
  msgDiv.id = id;
  chatMessagesBox.appendChild(msgDiv);
  return id;
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