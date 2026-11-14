import express from 'express';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('.'));

// 🤖 Endpoint สำหรับรับส่งแชท AI
app.post('/api/ai-chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        
        // ดึงคีย์จากตัวแปรลับของระบบ Railway โดยตรง
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า API Key ในระบบ Railway ครับ" });
        }

        let url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
        let headers = { "Content-Type": "application/json" };

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
