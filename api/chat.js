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

        const { context, message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const fullPrompt = context 
            ? `${context}\n\nUser question: ${message}` 
            : message;

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
            const result = await model.generateContent(fullPrompt);
            
            // Safely extract text from response
            const responseObj = await result?.response;
            const text = responseObj?.text?.();
            
            if (!text || typeof text !== 'string') {
                throw new Error('Empty or invalid response from Gemini API');
            }

            return res.status(200).json({ reply: text });

        } catch (apiError) {
            console.error('Gemini API call failed:', apiError.message || String(apiError));

            // Single-language (English) fallback for API failures
            const fallbackMessage = 'Sorry, my neural modules experienced a brief connection timeout. Could you please rephrase your question?';
            return res.status(200).json({ reply: fallbackMessage });
        }

    } catch (error) {
        console.error('Chat API configuration error:', error.message || String(error));
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}