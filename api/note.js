export default async function handler(req, res) {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = 'not2d4y';
    const REPO_NAME = 'our-memories';
    const PATH = 'notes/note.json';
    const githubApiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${PATH}`;

    if (!GITHUB_TOKEN) {
        return res.status(500).json({ error: 'GitHub Token belum diset di Environment Variables Vercel' });
    }

    if (req.method === 'GET') {
        try {
            const response = await fetch(`${githubApiUrl}?t=${Date.now()}`, {
                headers: { 
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'User-Agent': 'Vercel-Serverless'
                }
            });
            if (response.ok) {
                const data = await response.json();
                const contentText = Buffer.from(data.content, 'base64').toString('utf-8');
                const contentJson = JSON.parse(contentText);
                return res.status(200).json(contentJson);
            }
            return res.status(200).json({ content: "", isRead: true });
        } catch (error) {
            return res.status(200).json({ content: "", isRead: true });
        }
    }

    if (req.method === 'POST') {
        const { content, isRead } = req.body;
        try {
            let sha = null;
            const getResponse = await fetch(githubApiUrl, {
                headers: { 
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'User-Agent': 'Vercel-Serverless'
                }
            });
            if (getResponse.ok) {
                const data = await getResponse.json();
                sha = data.sha;
            }

            const noteData = { content: content || "", isRead: isRead !== undefined ? isRead : false };
            const jsonString = JSON.stringify(noteData, null, 2);
            const updatedContentBase64 = Buffer.from(jsonString).toString('base64');

            const payload = {
                message: "Update note kenangan via app",
                content: updatedContentBase64
            };
            if (sha) payload.sha = sha;

            const putResponse = await fetch(githubApiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Vercel-Serverless'
                },
                body: JSON.stringify(payload)
            });

            if (putResponse.ok) {
                return res.status(200).json({ success: true });
            } else {
                const errData = await putResponse.json();
                return res.status(400).json({ error: errData.message });
            }
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
