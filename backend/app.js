const express = require("express");
const cors = require("cors");
const { db } = require("./firebase");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SkillTrade backend is working!");
});

// Trades endpoints
app.get("/api/trades", async (req, res) => {
  try {
    console.log("Attempting to fetch trades from Firebase...");
    const tradesRef = db.collection("trades");
    console.log("Collection reference created");
    
    const snapshot = await tradesRef.get();
    console.log("Snapshot received, number of documents:", snapshot.size);
    
    const trades = [];
    snapshot.forEach(doc => {
      trades.push({
        _id: doc.id,
        ...doc.data()
      });
    });
    
    console.log("Successfully processed", trades.length, "documents");
    res.json(trades);
  } catch (error) {
    console.error("Detailed error in /api/trades:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      error: "Failed to fetch trades",
      details: error.message 
    });
  }
});

app.post("/api/trades", async (req, res) => {
  try {
    const tradeData = req.body;
    // Validate required fields
    const requiredFields = ['name', 'description', 'difficulty', 'serviceGiven', 'serviceWanted', 'tags', 'image'];
    const missingFields = requiredFields.filter(field =>
      tradeData[field] === undefined || tradeData[field] === '' || (Array.isArray(tradeData[field]) && tradeData[field].length === 0)
    );
    if (missingFields.length > 0) {
      return res.status(400).json({
        error: "Missing required fields",
        details: `Missing fields: ${missingFields.join(', ')}`
      });
    }
    // Add timestamp
    tradeData.createdAt = new Date().toISOString();
    // Add to Firestore
    const docRef = await db.collection("trades").add(tradeData);
    res.status(201).json({
      _id: docRef.id,
      ...tradeData
    });
  } catch (error) {
    console.error("Error creating trade:", error);
    res.status(500).json({
      error: "Failed to create trade",
      details: error.message
    });
  }
});

// New endpoint to fetch tests
app.get("/api/tests", async (req, res) => {
  try {
    console.log("Attempting to fetch tests from Firebase...");
    const testsRef = db.collection("tests");
    console.log("Collection reference created");
    
    const snapshot = await testsRef.get();
    console.log("Snapshot received, number of documents:", snapshot.size);
    
    const tests = [];
    snapshot.forEach(doc => {
      tests.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log("Successfully processed", tests.length, "documents");
    res.json(tests);
  } catch (error) {
    console.error("Detailed error in /api/tests:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      error: "Failed to fetch tests",
      details: error.message 
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
