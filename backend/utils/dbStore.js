const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const OtpVerification = require('../models/OtpVerification');

/**
 * Resilient Database Store with Multi-Layer Persistence:
 * Layer 1: MongoDB Atlas (Primary Cloud Store)
 * Layer 2: Local JSON Disk Persistence (backend/data/store.json)
 * Layer 3: Memory Store Fallback (cross-request caching)
 */

const os = require('os');
const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

// In Serverless (Vercel), default file-system is read-only; use /tmp or memory
const DATA_DIR = isServerless 
  ? path.join(os.tmpdir(), 'evhumi-data') 
  : path.join(__dirname, '..', 'data');

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const OTPS_FILE = path.join(DATA_DIR, 'otps.json');

// Ensure data directory exists safely without crashing
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // Silent fallback to pure memory if directory cannot be created
}

const loadJsonFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    // Suppress warning on cold starts
  }
  return [];
};

const saveJsonFile = (filePath, items) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(items, null, 2), 'utf8');
  } catch (err) {
    // In serverless read-only mode, memory store handles persistence during runtime
  }
};

// Initialize in-memory cache
if (!global._memoryUsers) {
  global._memoryUsers = loadJsonFile(USERS_FILE);
}
if (!global._memoryOtps) {
  global._memoryOtps = loadJsonFile(OTPS_FILE);
}

const isDbReady = () => mongoose.connection && mongoose.connection.readyState === 1;

/**
 * Singleton connection cache for Serverless & Long-running servers.
 * Prevents multiple concurrent connection attempts and connection pool exhaustion.
 */
let cachedDbPromise = null;

const ensureDbConnected = async () => {
  if (isDbReady()) return true;
  if (cachedDbPromise) return cachedDbPromise;

  const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://chanddiucse_db_user:aUoVygNtH29GsjPd@evumi.iexl4lo.mongodb.net/evhumi?retryWrites=true&w=majority&appName=Evumi';
  if (!mongoUri || mongoUri.includes('xxxxx')) return false;

  cachedDbPromise = mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    maxPoolSize: 10,
    minPoolSize: 1,
    socketTimeoutMS: 30000,
  }).then(() => {
    cachedDbPromise = null;
    return true;
  }).catch((err) => {
    cachedDbPromise = null;
    return false;
  });

  return cachedDbPromise;
};

/**
 * Execute a DB query with strict timeout and connection pooling
 */
const safeDbCall = async (fn, fallbackFn) => {
  const ready = await ensureDbConnected();
  if (!ready) {
    return await fallbackFn();
  }

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DB_TIMEOUT')), 3500)
    );
    const result = await Promise.race([fn(), timeoutPromise]);
    if (result) return result;
    return await fallbackFn();
  } catch (err) {
    return await fallbackFn();
  }
};

// -------------------------------------------------------------
// USER OPERATIONS
// -------------------------------------------------------------

const findUserByEmail = async (email) => {
  const cleanEmail = email.trim().toLowerCase();
  return safeDbCall(
    () => User.findOne({ email: cleanEmail }),
    () => {
      // Check memory + disk
      const users = global._memoryUsers.length > 0 ? global._memoryUsers : loadJsonFile(USERS_FILE);
      const found = users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (!found) return null;
      return {
        ...found,
        toObject: () => ({ ...found }),
        comparePassword: async (pwd) => bcrypt.compare(pwd, found.password)
      };
    }
  );
};

const findUserByNid = async (nid) => {
  const cleanNid = nid.trim();
  return safeDbCall(
    () => User.findOne({ nid: cleanNid }),
    () => {
      const users = global._memoryUsers.length > 0 ? global._memoryUsers : loadJsonFile(USERS_FILE);
      const found = users.find(u => u.nid === cleanNid);
      if (!found) return null;
      return {
        ...found,
        toObject: () => ({ ...found }),
        comparePassword: async (pwd) => bcrypt.compare(pwd, found.password)
      };
    }
  );
};

const createCitizenUser = async (userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const userPayload = {
    ...userData,
    role: 'User',
    status: 'Active',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const record = {
    _id: 'usr_' + Date.now() + Math.random().toString(36).substring(2, 7),
    ...userPayload,
    password: hashedPassword
  };

  // 1. Save to in-memory store
  global._memoryUsers = global._memoryUsers.filter(u => u.email !== userPayload.email);
  global._memoryUsers.push(record);

  // 2. Save to persistent JSON file on disk
  saveJsonFile(USERS_FILE, global._memoryUsers);

  // 3. Save to MongoDB Atlas if connected
  const ready = await ensureDbConnected();
  if (ready) {
    try {
      const newUser = new User(userPayload);
      await newUser.save();
      console.log('✅ User successfully persisted to MongoDB Atlas:', newUser.email);
      return newUser;
    } catch (err) {
      console.warn('⚠️ Could not save to MongoDB Atlas (saved to persistent disk/memory):', err.message);
    }
  }

  return {
    ...record,
    toObject: () => ({ ...record }),
    comparePassword: async (pwd) => bcrypt.compare(pwd, record.password)
  };
};

// -------------------------------------------------------------
// OTP OPERATIONS
// -------------------------------------------------------------

const createRegistrationOtp = async (cleanEmail, otp, cleanNid, name, expiresAt) => {
  const otpRecord = {
    _id: 'otp_' + Date.now(),
    email: cleanEmail,
    otp: otp.toString().trim(),
    purpose: 'ACCOUNT_REGISTRATION',
    metadata: { nid: cleanNid, name: name.trim() },
    attempts: 0,
    verified: false,
    createdAt: new Date(),
    expiresAt: new Date(expiresAt)
  };

  // 1. Save to in-memory store
  global._memoryOtps = global._memoryOtps.filter(
    o => !(o.email === cleanEmail && o.purpose === 'ACCOUNT_REGISTRATION')
  );
  global._memoryOtps.push(otpRecord);

  // 2. Save to persistent JSON file on disk
  saveJsonFile(OTPS_FILE, global._memoryOtps);

  // 3. Save to MongoDB Atlas if connected
  const ready = await ensureDbConnected();
  if (ready) {
    try {
      await OtpVerification.deleteMany({
        email: cleanEmail,
        purpose: 'ACCOUNT_REGISTRATION'
      });
      await OtpVerification.create({
        email: cleanEmail,
        otp: otpRecord.otp,
        purpose: 'ACCOUNT_REGISTRATION',
        metadata: otpRecord.metadata,
        expiresAt: otpRecord.expiresAt
      });
      console.log('✅ OTP successfully persisted to MongoDB Atlas:', cleanEmail);
    } catch (err) {
      console.warn('⚠️ Could not save OTP to MongoDB Atlas (saved to persistent disk/memory):', err.message);
    }
  }

  return otpRecord;
};

const findLatestRegistrationOtp = async (cleanEmail) => {
  return safeDbCall(
    async () => {
      const doc = await OtpVerification.findOne({
        email: cleanEmail,
        purpose: 'ACCOUNT_REGISTRATION'
      }).sort({ createdAt: -1 });
      return doc;
    },
    () => {
      // Check memory + disk
      const otps = global._memoryOtps.length > 0 ? global._memoryOtps : loadJsonFile(OTPS_FILE);
      const matching = otps
        .filter(o => o.email === cleanEmail && o.purpose === 'ACCOUNT_REGISTRATION')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return matching[0] || null;
    }
  );
};

const updateOtpRecord = async (otpRecord, updates) => {
  // Update memory
  const memoryIndex = global._memoryOtps.findIndex(
    o => o._id === otpRecord._id || (o.email === otpRecord.email && o.purpose === otpRecord.purpose)
  );
  if (memoryIndex !== -1) {
    global._memoryOtps[memoryIndex] = {
      ...global._memoryOtps[memoryIndex],
      ...updates
    };
    saveJsonFile(OTPS_FILE, global._memoryOtps);
  }

  // Update DB if instance is Mongoose document
  if (otpRecord.save) {
    try {
      Object.assign(otpRecord, updates);
      await otpRecord.save();
    } catch (err) {
      console.warn('⚠️ Could not update OTP in DB:', err.message);
    }
  }
};

const deleteRegistrationOtps = async (cleanEmail) => {
  global._memoryOtps = global._memoryOtps.filter(
    o => !(o.email === cleanEmail && o.purpose === 'ACCOUNT_REGISTRATION')
  );
  saveJsonFile(OTPS_FILE, global._memoryOtps);

  const ready = await ensureDbConnected();
  if (ready) {
    try {
      await OtpVerification.deleteMany({
        email: cleanEmail,
        purpose: 'ACCOUNT_REGISTRATION'
      });
    } catch (err) {
      console.warn('⚠️ Could not delete OTPs from DB:', err.message);
    }
  }
};

module.exports = {
  isDbReady,
  ensureDbConnected,
  findUserByEmail,
  findUserByNid,
  createCitizenUser,
  createRegistrationOtp,
  findLatestRegistrationOtp,
  updateOtpRecord,
  deleteRegistrationOtps
};
