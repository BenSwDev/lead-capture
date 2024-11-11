// api/submit.js

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGO_URI; // Ensure this is correctly set in Vercel
const DB_NAME = 'leadsDB';
const COLLECTION_NAME = 'leads';

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }

    const client = new MongoClient(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    try {
        await client.connect();
        const db = client.db(DB_NAME);

        cachedClient = client;
        cachedDb = db;

        return { client, db };
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Only POST requests are allowed.' });
        return;
    }

    const { name, phone, email } = req.body;

    // Minimal validation: Only check for presence of required fields
    if (!name || !phone) {
        res.status(400).json({ message: 'שם וטלפון הם שדות חובה.' });
        return;
    }

    try {
        const { db } = await connectToDatabase();
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

        res.status(200).json({ message: 'פרטיכם נשלחו בהצלחה. תודה!' });
    } catch (error) {
        console.error('Error inserting lead:', error);
        res.status(500).json({ message: 'אירעה שגיאה פנימית. אנא נסו שוב מאוחר יותר.' });
    }
};
