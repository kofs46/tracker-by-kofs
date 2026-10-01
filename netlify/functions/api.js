const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "kofs_super_secret_jwt_key_2026";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
};

// User Schema with Avatar Photo
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  avatar: { type: String, default: "" },
  recoveryPin: { type: String, default: "123456" }
}, { timestamps: true });

const UserDataSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  accounts: { type: Array, default: [] },
  projects: { type: Array, default: [] },
  transactions: { type: Array, default: [] },
  loans: { type: Array, default: [] }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const UserData = mongoose.models.UserData || mongoose.model("UserData", UserDataSchema);

let cachedDb = null;
const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) return cachedDb;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI missing in Netlify settings!");
  cachedDb = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 7000,
    bufferCommands: false
  });
  return cachedDb;
};

const authenticate = (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: JSON.stringify({ message: "OK" }) };
  }

  try {
    await connectDB();

    const pathLower = (event.path || "").toLowerCase();
    const queryAction = (event.queryStringParameters && event.queryStringParameters.action) 
      ? event.queryStringParameters.action.toLowerCase() 
      : "";

    let action = "data";
    if (pathLower.includes("register") || queryAction === "register") action = "register";
    else if (pathLower.includes("login") || queryAction === "login") action = "login";
    else if (pathLower.includes("profile") || queryAction === "profile") action = "profile";
    else if (pathLower.includes("reset-password") || queryAction === "reset-password") action = "reset-password";

    // 1. Register
    if (event.httpMethod === "POST" && action === "register") {
      const { name, email, password } = JSON.parse(event.body || "{}");
      if (!email || !password) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Email and password are required!" }) };
      }
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Email already registered! Please login." }) };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name: name || "User",
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: "",
        address: "",
        avatar: "",
        recoveryPin: "123456"
      });

      await UserData.create({
        userId: user._id,
        accounts: [
          { id: "acc_1", name: "Cash in Hand", type: "Cash", balance: 1000 },
          { id: "acc_2", name: "bKash Personal", type: "bKash", balance: 5000 },
          { id: "acc_3", name: "Nagad Wallet", type: "Nagad", balance: 2500 }
        ],
        projects: [
          { id: "proj_1", name: "General Project", budget: 20000, notes: "Tasks & Project ledger" }
        ],
        transactions: [],
        loans: []
      });

      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            avatar: user.avatar,
            recoveryPin: user.recoveryPin
          }
        })
      };
    }

    // 2. Login
    if (event.httpMethod === "POST" && action === "login") {
      const { email, password } = JSON.parse(event.body || "{}");
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Account not found with this email!" }) };
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Incorrect password!" }) };
      }

      const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          token,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            address: user.address || "",
            avatar: user.avatar || "",
            recoveryPin: user.recoveryPin || "123456"
          }
        })
      };
    }

    // 3. Password Recovery
    if (event.httpMethod === "POST" && action === "reset-password") {
      const { email, recoveryPin, newPassword } = JSON.parse(event.body || "{}");
      if (!email || !recoveryPin || !newPassword) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Email, Recovery PIN, and New Password are required!" }) };
      }

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: "No user found with this email!" }) };
      }

      if ((user.recoveryPin || "123456") !== recoveryPin.trim()) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid Recovery PIN!" }) };
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "Password reset successful! Please login with your new password." })
      };
    }

    // 4. Authenticated APIs
    const authUser = authenticate(event);
    if (!authUser) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: "Unauthorized! Please login." }) };
    }

    // Profile & Avatar update
    if (event.httpMethod === "POST" && action === "profile") {
      const { name, phone, address, recoveryPin, avatar } = JSON.parse(event.body || "{}");
      const user = await User.findById(authUser.userId);
      if (!user) return { statusCode: 404, headers, body: JSON.stringify({ error: "User not found!" }) };

      if (name) user.name = name;
      if (phone !== undefined) user.phone = phone;
      if (address !== undefined) user.address = address;
      if (recoveryPin) user.recoveryPin = recoveryPin;
      if (avatar !== undefined) user.avatar = avatar;
      await user.save();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            avatar: user.avatar,
            recoveryPin: user.recoveryPin
          }
        })
      };
    }

    // Financial Data API
    if (event.httpMethod === "GET") {
      let data = await UserData.findOne({ userId: authUser.userId });
      if (!data) {
        data = await UserData.create({ userId: authUser.userId, accounts: [], projects: [], transactions: [], loans: [] });
      }
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (event.httpMethod === "POST") {
      const payload = JSON.parse(event.body || "{}");
      const updated = await UserData.findOneAndUpdate(
        { userId: authUser.userId },
        {
          accounts: payload.accounts || [],
          projects: payload.projects || [],
          transactions: payload.transactions || [],
          loans: payload.loans || []
        },
        { new: true, upsert: true }
      );
      return { statusCode: 200, headers, body: JSON.stringify(updated) };
    }

    return { statusCode: 404, headers, body: JSON.stringify({ error: "Endpoint not found" }) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || "Internal server error" })
    };
  }
};