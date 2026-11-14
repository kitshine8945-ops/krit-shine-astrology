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

        // รายชื่อโมเดลที่จะให้ระบบลองสลับใช้งานอัตโนมัติ (แก้ปัญหา 503 High Demand)
        const modelsToTry = [
            'gemini-3.8-flash',
            'gemini-1.5-flash'
        ];

        let data = null;
        let success = false;

        for (const modelName of modelsToTry) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
                
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [
                            {
                                role: "user",
                                parts: [{ text: prompt }]
                            }
                        ]
                    })
                });

                data = await response.json();

                if (response.ok) {
                    success = true;
                    break; // สำเร็จแล้ว หยุดวนลูปทันที
                } else {
                    console.warn(`Model ${modelName} busy/failed, trying fallback model...`, JSON.stringify(data));
                }
            } catch (innerErr) {
                console.warn(`Error trying model ${modelName}:`, innerErr.message);
            }
        }

        if (!success) {
            console.error("All AI models failed:", JSON.stringify(data));
            return res.status(500).json({ error: data?.error?.message || "ระบบ AI กำลังหนาแน่น กรุณาลองใหม่อีกครั้งครับ" });
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
