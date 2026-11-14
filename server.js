// ==========================================
// server.js - โครงสร้างเซิร์ฟเวอร์ Backend เต็มรูปแบบสำหรับ Railway
// ==========================================
const express = require('express');
const cors = require('cors');
const app = express();

// ตั้งค่า Middleware พื้นฐาน
app.use(express.json());
app.use(cors());
app.use(express.static('.')); // หรือระบุโฟลเดอร์เก็บไฟล์หน้าเว็บของพี่กฤศ

// 🔑 [จุดที่ 1] นำ API Key หรือ Token ของพี่กฤศมาใส่ไว้ตรงเครื่องหมายคำพูดนี้ได้เลยครับ
const MY_GEMINI_API_KEY = "ใส่รหัส API Key หรือ AQ... ของพี่กฤศตรงนี้";

// 🤖 Endpoint สำหรับรับส่งแชท AI
app.post('/api/ai-chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        // ใช้คีย์จากที่กำหนดไว้ด้านบน หรือดึงจากระบบอัตโนมัติ
        const apiKey = MY_GEMINI_API_KEY.trim() || process.env.GEMINI_API_KEY;
        if (!apiKey || apiKey.includes("ใส่รหัส")) {
            return res.status(500).json({ error: "ยังไม่ได้ใส่ API Key ในเซิร์ฟเวอร์ครับ" });
        }

        let url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
        let headers = { "Content-Type": "application/json" };

        // รองรับทั้งแบบ AQ. (Bearer Token) และ AIzaSy (Query Param) อัตโนมัติ
        if (apiKey.startsWith("AQ.")) {
            headers["Authorization"] = `Bearer ${apiKey}`;
        } else {
            url += `?key=${apiKey}`;
        }

        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            return res.status(500).json({ error: data.error?.message || "AI Connection error" });
        }

        res.json({ reply: data.candidates[0].content.parts[0].text });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🚀 คำสั่งเปิดเซิร์ฟเวอร์ให้รันบนพอร์ตของ Railway (หรือพอร์ต 3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Krit Shine Astrology Server is running on port ${PORT}`);
});