const express = require('express');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');

const app = express();
const url = "mongodb://admin:password@127.0.0.1:27017/?authSource=admin";
const client = new MongoClient(url);

app.use(express.static('public')); // Serve static files like images, CSS, JS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔹 Connect to MongoDB once, and use it throughout
async function connectDB() {
    try {
        await client.connect();
        console.log('✅ Successfully connected to MongoDB');
    } catch (err) {
        console.error('❌ Error connecting to MongoDB:', err);
        process.exit(1); // Exit if DB connection fails
    }
}
connectDB();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 🔹 Fetch user profile
app.get('/get-profile', async (req, res) => {
    try {
        const db = client.db('user-account');
        const user = await db.collection('users').findOne({ userid: 1 });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('❌ Error fetching user:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 🔹 Update profile using the existing MongoDB connection
app.post('/update-profile', async (req, res) => {
    try {
        const db = client.db('user-account');
        const userObj = { ...req.body, userid: 1 };
        
        console.log("🔹 Received update request:", userObj);

        const result = await db.collection('users').updateOne(
            { userid: 1 },
            { $set: userObj },
            { upsert: true }
        );

        console.log("✅ MongoDB Updated:", result);
        res.json({ success: true, message: "Profile updated!", data: userObj });
    } catch (err) {
        console.error("❌ Update Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 🔹 Serve profile picture if it exists
const profilePicPath = path.join(__dirname, 'profilepicture.jpg');
if (fs.existsSync(profilePicPath)) {
    app.get('/profile-picture', (req, res) => {
        res.sendFile(profilePicPath);
    });
} else {
    console.warn("⚠️ Warning: profilepicture.jpg not found. Serving default image.");
    app.get('/profile-picture', (req, res) => {
        res.status(404).send('Profile picture not found');
    });
}

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 App listening on port ${PORT}`);
});
