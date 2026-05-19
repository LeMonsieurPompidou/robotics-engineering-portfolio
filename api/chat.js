import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    const requestOrigin = req.headers.origin || req.headers.referer || '*';
    res.setHeader('Access-Control-Allow-Credentials', requestOrigin !== '*' ? 'true' : 'false');
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on Vercel' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const { context, message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const fullPrompt = context 
            ? `${context}\n\nUser question: ${message}` 
            : message;

        const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();

        if (!text) {
            throw new Error('Empty response from Google API');
        }

        return res.status(200).json({ reply: text });

    } catch (error) {
        console.error('Chat API Error:', error.message);
        
        if (error.message.includes('403') || error.message.includes('permission')) {
            return res.status(403).json({ 
                error: 'Google API Forbidden', 
                message: 'The model is not accessible with the provided API key. Please check your API key permissions and ensure it has access to the requested model.' 
            });
        }

        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}