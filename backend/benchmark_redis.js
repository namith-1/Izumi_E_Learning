const { getAdminOverview } = require("./controllers/analyticsController");
const cacheService = require("./services/cacheService");
const mongoose = require("mongoose");
require("dotenv").config();

// Mock req, res
const mockRes = {
    json: (data) => data,
    status: (code) => ({ json: (data) => data })
};
const mockReq = { 
    query: {},
    session: { user: { role: 'admin' } }
};

async function runBenchmark() {
    console.log("--- Izumi Performance Benchmark: Redis Caching ---");
    
    // Connect to DB if needed, but we can also just test the cache layer logic
    // For this benchmark, we'll measure the time it takes for the controller to resolve.
    
    // 1. Cold Run (Bypassing cache or first run)
    await cacheService.del("admin:overview");
    const startCold = Date.now();
    await getAdminOverview(mockReq, mockRes);
    const endCold = Date.now();
    const coldTime = endCold - startCold;
    console.log(`Cold Fetch (Database): ${coldTime}ms`);

    // 2. Hot Run (Redis)
    const startHot = Date.now();
    await getAdminOverview(mockReq, mockRes);
    const endHot = Date.now();
    const hotTime = endHot - startHot;
    console.log(`Hot Fetch (Redis): ${hotTime}ms`);

    const improvement = ((coldTime - hotTime) / coldTime * 100).toFixed(2);
    console.log(`Performance Improvement: ${improvement}%`);
    console.log("-----------------------------------------------");
    
    process.exit(0);
}

runBenchmark();
