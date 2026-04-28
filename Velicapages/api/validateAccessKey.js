export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    const { accessKey } = req.body;
    // Securely compare the access key
    const storedKey = process.env.NEXT_PUBLIC_ACCESS_KEY;

    if (!storedKey) {
        return res.status(500).json({ message: 'Access key not configured on server.' });
    }

    if (accessKey === storedKey) {
        return res.status(200).json({ success: true });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid Access Key' });
    }
}
