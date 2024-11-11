// api/submit.js

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI; // We'll set this in Vercel
const DB_NAME = 'leadsDB';
const COLLECTION_NAME = 'leads';

let cachedClient = null;

async function connectToDatabase() {
    if (cachedClient && cachedClient.isConnected()) {
        return cachedClient.db(DB_NAME);
    }

    const client = await MongoClient.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    cachedClient = client;
    return client.db(DB_NAME);
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Only POST requests allowed' });
        return;
    }

    const { name, phone, email } = req.body;

    if (!name || !phone) {
        res.status(400).json({ message: 'Name and phone are required' });
        return;
    }

    try {
        const db = await connectToDatabase();
        const collection = db.collection(COLLECTION_NAME);

        const currentTimestamp = new Date().toISOString();

        const lead = {
            fullName: name,
            phone,
            email: email || '',
            details: [],
            source: 'MTA-SITE',
            addedAt: currentTimestamp,
            lastContact: currentTimestamp,
            followUp: null,
            followUpNotified: false,
            contacted: false,
            active: true
        };

        await collection.insertOne(lead);

        res.status(200).json({ message: 'Lead added successfully' });
    } catch (error) {
        console.error('Error inserting lead:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
