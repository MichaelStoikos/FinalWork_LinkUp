const admin = require("firebase-admin");
const serviceAccount = require("./linkup-c14d5-firebase-adminsdk-fbsvc-9f3c1cfb86.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
module.exports = { db };
