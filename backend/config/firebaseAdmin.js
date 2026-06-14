const admin = require("firebase-admin");


if (!admin.apps.length) {
  admin.initializeApp({
    credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
      : admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

module.exports = admin;
