# MongoDB Connection Fix for Node.js v18+

## Problem
After updating to Node.js v18 or higher, MongoDB SRV connections may fail with errors like:
```
querySrv ECONNREFUSED _mongodb._tcp.cluster0.injmqgg.mongodb.net
```

## Root Cause
Node.js v18+ changed the default DNS resolution order, which can cause issues with MongoDB's SRV record lookups (mongodb+srv://).

## Solution Implemented

### 1. DNS Resolution Fix (Automatic)
The `src/config/db.ts` file now automatically:
- Sets DNS resolution to prioritize IPv4
- Uses reliable DNS servers (Google DNS: 8.8.8.8, 8.8.4.4)
- Forces IPv4 connections (family: 4)

### 2. Connection Fallback (Optional but Recommended)
If SRV connection fails, the system can use a fallback standard connection string.

## Setup Instructions

### Option A: Using SRV Connection (Recommended)
Your existing setup should now work without changes:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/database?retryWrites=true&w=majority
```

### Option B: Add Fallback Connection String (Most Reliable)
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Select **Standard Connection String** (not SRV)
5. Copy the connection string that looks like:
   ```
   mongodb://host1:27017,host2:27017,host3:27017/...
   ```
6. Add it to your `.env` file:
   ```env
   MONGODB_URI=mongodb+srv://...  # Your primary SRV connection
   MONGODB_URI_FALLBACK=mongodb://host1:27017,host2:27017,host3:27017/database?replicaSet=atlas-xxxxx-shard-0&ssl=true&authSource=admin
   ```

### Option C: Use Only Standard Connection String
Replace your SRV connection with a standard one:
```env
MONGODB_URI=mongodb://host1:27017,host2:27017,host3:27017/database?replicaSet=atlas-xxxxx-shard-0&ssl=true&authSource=admin
```

## Verify Network Access

1. Go to MongoDB Atlas
2. Navigate to **Network Access**
3. Add your IP address or temporarily use `0.0.0.0/0` (allow from anywhere) for testing
4. Wait 1-2 minutes for changes to propagate

## Test the Connection

```bash
npm run dev
```

You should see:
```
✅ MongoDB (native driver) connected successfully
```

If you see a connection error, check:
1. ✅ Your IP is whitelisted in MongoDB Atlas
2. ✅ Your credentials are correct
3. ✅ Your network allows outbound MongoDB connections (port 27017)
4. ✅ No VPN/firewall blocking DNS or MongoDB

## Additional Troubleshooting

### Check DNS Resolution
```bash
# On macOS/Linux
nslookup -type=SRV _mongodb._tcp.cluster0.xxxxx.mongodb.net

# On Windows PowerShell
Resolve-DnsName -Name _mongodb._tcp.cluster0.xxxxx.mongodb.net -Type SRV
```

If this fails, use the standard connection string (Option C above).

### Test Connection Programmatically
Create a test file `test-mongo.js`:
```javascript
const { MongoClient } = require('mongodb');
const dns = require('dns');

// Fix for Node.js v18+
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = 'your_mongodb_uri_here';
const client = new MongoClient(uri, { family: 4 });

async function test() {
  try {
    await client.connect();
    console.log('✅ Connected successfully!');
    await client.close();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

test();
```

Run: `node test-mongo.js`

## Need More Help?

If you're still experiencing issues:
1. Check MongoDB Atlas status: https://status.mongodb.com/
2. Verify your MongoDB driver version is up to date: `npm list mongodb`
3. Try connecting from a different network
4. Contact your network administrator if behind a corporate firewall

## What Changed

The fix modifies:
- ✅ `src/config/db.ts` - Added DNS resolution fixes and fallback logic
- ✅ `.env.example` - Added optional fallback connection string
- ✅ No breaking changes - existing setups continue to work
