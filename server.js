import express from 'express';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.static('.'));

app.post('/api/ai-chat', async (req, res) => {
    try {
        // 🌟 รับข้อมูล prompt, ตำแหน่งดาว (currentSigns) และคำทำนายมุมดาว (transitAspects) จากหน้าเว็บ
        const { prompt, currentSigns, transitDate, transitAspects } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "กรุณาระบุข้อความครับ" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Variables ครับ" });
        }

        const targetDateStr = transitDate || new Date().toISOString().split('T')[0];

        // จัดรูปแบบข้อมูลดิบจากหน้าเว็บ
        const signsJsonString = currentSigns ? JSON.stringify(currentSigns, null, 2) : "ไม่ได้ระบุตำแหน่งดาว";
        const aspectsString = transitAspects ? transitAspects : "ไม่มีข้อมูลมุมดาวจรพิเศษในขณะนี้";

        // 🌟 ล็อก System Instruction ให้ AI ตอบสั้น ตรงประเด็น และยึดองศา/มุมดาวจริงเท่านั้น
        const systemInstructionText = `
คุณคือผู้เชี่ยวชาญโหราศาสตร์ไทยระบบสุริยยาตรประจำเว็บไซต์ "Krit Shine Astrology" ของคุณกฤศ สุขรา 
กฎเหล็กเด็ดขาดในการตอบแชท:
1. ห้ามเกริ่นยาว ห้ามใช้สำนวนน้ำท่วมทุ่ง หรือข้อความเวิ่นเว้อเด็ดขาด! ตอบให้สั้น กระชับ คมชัด และตรงประเด็นที่สุด
2. ห้ามแต่งเติมหรือมโนตำแหน่งดาวเด็ดขาด! ต้องวิเคราะห์และพยากรณ์โดยอิงจาก "เกณฑ์องศา, มุมสัมพันธ์ดาวจร (Transit Aspects), และภพเรือน" ตามข้อมูลดิบด้านล่างนี้เท่านั้น:
---
[ข้อมูลมุมสัมพันธ์ดาวจร & ระยะองศาปัจจุบันของเจ้าชะตา]
${aspectsString}

[ตำแหน่งราศีดาวจรจริง ณ วันที่ ${targetDateStr}]
${signsJsonString}
---
3. หากคำถามเกี่ยวกับความปลอดภัย การเดินทาง หรือโชคลาภ ให้เจาะลึกเฉพาะอิทธิพลของมุมดาวที่มีผลอยู่ (ระบุวันที่สิ้นสุดผลกระทบถ้ามี) แล้วฟันธงให้ชัดเจนทันที
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
