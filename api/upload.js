// File: api/upload.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { filename, imageBase64 } = req.body;

    // Ambil token dari Environment Variables Vercel
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
    
    // UBAH DUA BARIS INI SESUAI GITHUB ANDA
    const REPO_OWNER = 'not2d4y'; 
    const REPO_NAME = 'our-memories'; 
    
    // Ini otomatis akan membuat folder "foto-kenangan" di GitHub Anda
    const PATH = `foto-kenangan/${filename}`; 

    const githubApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${PATH}`;

    try {
        const response = await fetch(githubApiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Upload foto ${filename} dari website`,
                content: imageBase64 // GitHub butuh format base64 murni
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Berhasil upload! Kembalikan link gambar dari GitHub agar bisa ditampilkan di web
            res.status(200).json({ success: true, imageUrl: data.content.download_url });
        } else {
            res.status(400).json({ error: data.message });
        }
    } catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
    }
}
