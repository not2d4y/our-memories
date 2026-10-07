export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { passcode } = req.body;
    
    // Ambil passcode rahasia dari Environment Variables Vercel
    const SECRET_PASSCODE = process.env.APP_PASSCODE || '123456'; // Default jika belum diset

    if (passcode === SECRET_PASSCODE) {
        return res.status(200).json({ success: true, message: 'Passcode benar!' });
    } else {
        return res.status(401).json({ success: false, error: 'Passcode salah!' });
    }
}
