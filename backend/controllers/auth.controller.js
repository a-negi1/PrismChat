const admin = require("../config/firebaseAdmin");
const User  = require("../models/User.model");


const verifyToken = async (req, res) => {
  const { idToken, forceName } = req.body;
  if (!idToken) return res.status(400).json({ error: "idToken is required." });

  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name: tokenName, picture } = decoded;

    
    const resolvedName = forceName?.trim() || tokenName || email.split("@")[0];

    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        name:        resolvedName,
        email:       email,
        photoURL:    picture || "",
        online:      true,
      });
    } else {
      user.online = true;
      // Update name if it was previously set to email (old bug fallback)
      if (user.name === email || user.name === email.split("@")[0]) {
        user.name = resolvedName;
      }
      await user.save();
    }

    res.json(user);
  } catch (err) {
    console.error("Firebase token verification failed:", err.message);
    res.status(401).json({ error: "Invalid or expired token. Please sign in again." });
  }
};

module.exports = { verifyToken };
