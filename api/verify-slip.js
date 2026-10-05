export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

export default async function handler(req, res) {
    // กำหนดให้รับเฉพาะ HTTP POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        const { imageBase64 } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ success: false, message: 'ไม่พบข้อมูลรูปภาพสลิป' });
        }

        // แปลงภาพ Base64 เป็น Binary Buffer
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
}