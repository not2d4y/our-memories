export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name, time } = req.body;
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
    const REPO_OWNER = 'not2d4y'; 
    const REPO_NAME = 'our-memories'; 
    const PATH = 'leaderboard/scores.json'; // Otomatis membuat folder leaderboard
    const githubApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${PATH}`;

    try {
        // 1. Cek apakah file scores.json sudah ada
        const getResponse = await fetch(githubApiUrl, {
            headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
        });

        let currentScores = [];
        let sha = null;

        if (getResponse.ok) {
            const data = await getResponse.json();
            sha = data.sha; // Diperlukan GitHub untuk mengupdate file
            currentScores = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
        }

        // 2. Tambahkan skor baru
        currentScores.push({ name, time });
        currentScores.sort((a, b) => a.time - b.time); // Urutkan dari tercepat
        const updatedContentBase64 = Buffer.from(JSON.stringify(currentScores)).toString('base64');

        // 3. Simpan (Push) kembali ke GitHub
        const putResponse = await fetch(githubApiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Update leaderboard oleh ${name}`,
                content: updatedContentBase64,
                sha: sha // Masukkan SHA jika file sudah ada sebelumnya
            })
        });

        if (putResponse.ok) {
            res.status(200).json({ success: true });
        } else {
            const errorData = await putResponse.json();
            res.status(400).json({ error: errorData.message });
        }
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}
