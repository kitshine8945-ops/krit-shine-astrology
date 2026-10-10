import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import handler from './api/verify-slip.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));

app.post('/api/verify-slip', async (req, res) => {
    try {
        return await handler(req, res);
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Server error' });
    }
});

app.use(express.static(__dirname));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
