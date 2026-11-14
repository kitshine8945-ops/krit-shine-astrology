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

        // 🔄 รายชื่อรุ่นโมเดลที่จะให้ระบบลองสลับใช้งาน (ถ้าตัวแรกติด 503 จะสลับไปตัวถัดไปอัตโนมัติ)
        const modelsToTry = [
            'gemini-3.8-flash',
            'gemini-2.0-flash'
        ];

        let data = null;
        let success = false;

        for (const modelName of modelsToTry) {
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
                console.warn(`Model ${modelName} failed, trying next model...`, JSON.stringify(data));
            }
        }

        if (!success) {
            console.error("All AI models failed:", JSON.stringify(data));
            return res.status(500).json({ error: data?.error?.message || "AI ระบบกำลังหนาแน่น กรุณาลองใหม่อีกครั้งครับ" });
        }

        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "ขออภัยครับ ไม่ได้รับข้อมูลตอบกลับจาก AI";
        res.json({ reply });
    } catch (err) {
        console.error("Server Error:", err);
        res.status(500).json({ error: err.message });
    }
});
