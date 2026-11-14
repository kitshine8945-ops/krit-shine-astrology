import express from 'express';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('.'));

app.post('/api/ai-chat', async (req, res) => {
    try {
        // 🌟 รับ prompt, currentSigns, transitDate และ transitAspects ที่ส่งมาจากหน้าเว็บ
        const { prompt, currentSigns, transitDate, transitAspects } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "กรุณาระบุข้อความครับ" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Variables ครับ" });
        }

        const targetDateStr = transitDate || new Date().toISOString().split('T')[0];

        // 🌟 แปลงข้อมูลดาวและคำทำนายมุมสัมพันธ์ดาวจร (Transit Aspects) ที่หน้าเว็บคำนวณส่งมา
        const signsJsonString = currentSigns ? JSON.stringify(currentSigns, null, 2) : "ไม่ได้ระบุตำแหน่งดาว";
        const aspectsString = transitAspects ? transitAspects : "ไม่มีข้อมูลมุมดาวจรพิเศษในขณะนี้";

        const systemInstructionText = `
คุณคือผู้เชี่ยวชาญโหราศาสตร์ไทยระบบสุริยยาตรประจำเว็บไซต์ "Krit Shine Astrology" ของคุณกฤศ สุขรา 
กฎเหล็กเคร่งครัด:
1. ห้ามแต่งเติมหรือมโนตำแหน่งดาวหรือคำทำนายเด็ดขาด!
2. ให้วิเคราะห์และพยากรณ์โดยยึดถือตำแหน่งดาวจรจริง และข้อมูลคำทำนายมุมสัมพันธ์ดาวจร (Transit Aspects) ที่แนบมานี้เป็นหลัก:
---
[ข้อมูลมุมสัมพันธ์ดาวจรปัจจุบันของเจ้าชะตา]
${aspectsString}

[ตำแหน่งราศีดาวจรจริง ณ วันที่ ${targetDateStr}]
${signsJsonString}
---
รหัสราศี (0=เมษ, 1=พฤษภ, 2=เมถุน, 3=กรกฎ, 4=สิงห์, 5=กันย์, 6=ตุลย์, 7=พิจิก, 8=ธนู, 9=มังกร, 10=กุมภ์, 11=มีน)
หากตำแหน่งดาวหรือคำทำนายในแชทไม่สอดคล้องกับข้อมูลดิบชุดนี้ ถือว่าผิดพลาดร้ายแรง!
`;

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
                        system_instruction: {
                            parts: [{ text: systemInstructionText }]
                        },
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
                    break;
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
