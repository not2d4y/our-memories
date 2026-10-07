import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = 'not2d4y';
    const REPO_NAME = 'our-memories';
    const PATH = 'notes/note.json';

    const octokit = new Octokit({ auth: GITHUB_TOKEN });

    if (req.method === 'GET') {
        try {
            const response = await octokit.repos.getContent({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                path: PATH,
                headers: { 'Cache-Control': 'no-cache' }
            });
            const content = JSON.parse(Buffer.from(response.data.content, 'base64').toString('utf-8'));
            return res.status(200).json(content);
        } catch (error) {
            // Jika file notes/note.json belum ada di GitHub, kembalikan kosong tanpa menimpa
            return res.status(200).json({ content: "", isRead: true });
        }
    }

    if (req.method === 'POST') {
        const { content, isRead } = req.body;
        try {
            let sha = null;
            try {
                const getResponse = await octokit.repos.getContent({
                    owner: REPO_OWNER,
                    repo: REPO_NAME,
                    path: PATH
                });
                sha = getResponse.data.sha;
            } catch (err) {
                // File belum ada, tidak apa-apa karena akan dibuat baru
            }

            const noteData = { content: content || "", isRead: isRead !== undefined ? isRead : false };
            const updatedContentBase64 = Buffer.from(JSON.stringify(noteData, null, 2)).toString('base64');

            await octokit.repos.createOrUpdateFileContents({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                path: PATH,
                message: "Update note kenangan",
                content: updatedContentBase64,
                sha: sha
            });

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Server error' });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
