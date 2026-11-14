import express from 'express';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('.'));

app.post('/api/ai-chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "กรุณาระบุข้อความครับ" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Variables ครับ" });
        }

        const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("Google API Error:", JSON.stringify(data));
            return res.status(500).json({ error: data.error?.message || "AI Connection error" });
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "ขออภัยครับ ไม่ได้รับข้อมูลตอบกลับจาก AI";
        res.json({ reply });
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Krit Shine Astrology Server running on port ${PORT}`);
});
