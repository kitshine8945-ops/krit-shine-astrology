import express from 'express';
import cors from 'cors';

const app = express();

// ขยายขนาดการรับข้อมูล JSON เพื่อรองรับรูปสลิป Base64 ขนาดใหญ่ไม่ให้พัง
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(cors());
app.use(express.static('.'));

// 1. ระบบตรวจสอบสลิป (รวมอยู่ในไฟล์เดียว ตัดปัญหาหาไฟล์ไม่เจอ)
app.post('/api/verify-slip', async (req, res) => {
    try {
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ success: false, message: 'ไม่พบข้อมูลรูปภาพสลิป' });
        }

        // แปลงภาพ Base64 เป็น Binary Buffer (โค้ดดั้งเดิมของพี่กฤศ)
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // จัดเตรียม FormData ส่งไปยัง SlipOK
        const formData = new FormData();
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        formData.append('files', blob, 'slip.jpg');

        // ส่งตรวจสอบกับ SlipOK API
        const response = await fetch('https://api.slipok.com/api/line/apikey/77524', {
            method: 'POST',
            headers: {
                'x-authorization': 'SLIPOK646DDOC'
            },
            body: formData
        });

        const data = await response.json();
        return res.status(response.status).json(data);

    } catch (error) {
        console.error('Error verifying slip:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

// 2. ระบบ AI Chat ของพี่กฤศ (ใช้ 'gemini-3.8-flash' ตัวเดิมเป๊ะๆ ปลอดภัย 100% ไม่เปลี่ยนแปลงใดๆ)
app.post('/api/ai-chat', async (req, res) => {
    try {
        const { prompt, currentSigns, transitDate, transitAspects } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "กรุณาระบุข้อความครับ" });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Variables ครับ" });
        }

        const targetDateStr = transitDate || new Date().toISOString().split('T')[0];
        const signsJsonString = currentSigns ? JSON.stringify(currentSigns, null, 2) : "ไม่ได้ระบุตำแหน่งดาว";
        const aspectsString = transitAspects ? transitAspects : "ไม่มีข้อมูลมุมดาวจรพิเศษในขณะนี้";

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
