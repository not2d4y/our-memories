export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    // Tangkap name, time, mode, dan difficulty dari request body
    const { name, time, mode, difficulty } = req.body;
    const gameMode = mode || 'find-photo';
    const gameDiff = difficulty || 'normal';

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
    const REPO_OWNER = 'not2d4y'; 
    const REPO_NAME = 'our-memories'; 
    const PATH = 'leaderboard/scores.json'; 
    const githubApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${PATH}`;

    try {
        const getResponse = await fetch(githubApiUrl, {
            headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}` }
        });

        let currentScores = [];
        let sha = null;

        if (getResponse.ok) {
            const data = await getResponse.json();
            sha = data.sha; 
            currentScores = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
        }

        // Simpan skor lengkap dengan mode dan difficulty
        currentScores.push({ name, time, mode: gameMode, difficulty: gameDiff });
        currentScores.sort((a, b) => a.time - b.time); 
        currentScores = currentScores.slice(0, 50); // Batasi total penyimpanan
        
        const updatedContentBase64 = Buffer.from(JSON.stringify(currentScores, null, 2)).toString('base64');

        const payload = {
            message: `Update leaderboard oleh ${name} (${gameMode} - ${gameDiff})`,
            content: updatedContentBase64
        };
        
        if (sha) {
            payload.sha = sha;
        }

        const putResponse = await fetch(githubApiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
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
