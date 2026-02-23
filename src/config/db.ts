import { MongoClient, Db } from "mongodb";
import * as dns from "dns";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_URI_FALLBACK = process.env.MONGODB_URI_FALLBACK;

let db: Db | null = null;
let client: MongoClient | null = null;

// Fix DNS resolution for Node.js v18+ with MongoDB SRV
if (MONGODB_URI?.includes("mongodb+srv://")) {
  // Set DNS resolution order to prioritize IPv4 (fixes SRV lookup issues in Node v18+)
  dns.setDefaultResultOrder("ipv4first");

  // Use reliable DNS servers (Google DNS)
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
}

// Connect using MongoDB native driver
export const connectDB = async (): Promise<Db> => {
  if (db) {
    return db;
  }

  // Try primary connection string first
  let connectionUri = MONGODB_URI;
  let lastError: any = null;

  try {
    console.log("Attempting MongoDB connection with SRV...");
    client = new MongoClient(connectionUri, {
      tls: true,
      tlsAllowInvalidCertificates: false,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4, // Force IPv4 (helps with DNS resolution)
    });
    await client.connect();
    db = client.db();
    console.log("✅ MongoDB (native driver) connected successfully");
    return db;
  } catch (error: any) {
    lastError = error;
    console.error("MongoDB SRV connection failed:", error.message);

    // Try fallback connection string if available
    if (MONGODB_URI_FALLBACK && connectionUri !== MONGODB_URI_FALLBACK) {
      try {
        console.log("Attempting fallback connection...");
        client = new MongoClient(MONGODB_URI_FALLBACK, {
          tls: true,
          tlsAllowInvalidCertificates: false,
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
          family: 4,
        });
        await client.connect();
        db = client.db();
        console.log("✅ MongoDB connected successfully (fallback)");
        return db;
      } catch (fallbackError: any) {
        console.error("Fallback connection also failed:", fallbackError.message);
      }
    }

    // Provide helpful error message
    console.error("\n❌ MongoDB Connection Failed");
    console.error("Error:", lastError.message);
    console.error("\nTroubleshooting steps:");
    console.error("1. Check your MongoDB Atlas Network Access whitelist");
    console.error("2. Verify your connection string in .env");
    console.error("3. Try using a standard connection string instead of SRV");
    console.error("4. Ensure your network allows MongoDB connections\n");

    throw lastError;
  }
};

// Get the database instance
export const getDB = (): Db => {
  if (!db) {
    throw new Error("Database not initialized. Call connectDB first.");
  }
  return db;
};

// Close connection
export const closeDB = async (): Promise<void> => {
  if (client) {
    await client.close();
    db = null;
    client = null;
    console.log("MongoDB connection closed");
  }
};

