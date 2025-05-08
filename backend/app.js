const express = require("express");
const cors = require("cors");
const { db } = require("./firebase");
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("SkillTrade backend is working!");
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
