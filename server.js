import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('.'));

// เรียกใช้งาน SDK ทางการ (ระบบจะอ่าน GEMINI_API_KEY แบบ AQ... จาก Railway อัตโนมัติ)
const ai = new GoogleGenAI();

// 🤖 Endpoint สำหรับ AI Chat
app.post('/api/ai-chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "กรุณาระบุข้อความครับ" });
        }

        // เรียกใช้งานผ่าน SDK หลักของ Google
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
        });

        res.json({ reply: response.text });
    } catch (err) {
        console.error("AI Error:", err);
        res.status(500).json({ error: err.message || "เกิดข้อผิดพลาดในการเชื่อมต่อระบบ AI" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Krit Shine Astrology Server running on port ${PORT}`);
});
