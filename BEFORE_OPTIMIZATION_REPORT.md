# Izumi E-Learning: Performance Report (BASELINE)

This report details the performance of the Izumi E-Learning database and API endpoints **before** any optimizations (indexing, caching, or specialized search engines) were applied.

## Diagnostic Summary (Before Optimization)

The following metrics were captured using the internal `benchmark.js` utility connected to the live MongoDB instance.

| Endpoint / Query Path        | Latency (ms) | Database Plan | Issue Identified |
| :--------------------------- | :----------- | :------------ | :--------------- |
| **Course Catalog**           | 283ms        | ℹ️ Parallel Op | Slow aggregation due to `$lookup` without caching. |
| **Admin Overview**           | 228ms        | ℹ️ Simple Op   | Sequential document counts on multiple collections. |
| **Instructor Leaderboard**   | 114ms        | ℹ️ Parallel Op | Complex multi-stage aggregation. |
| **Revenue Trend (30 Days)**  | 96ms         | ℹ️ Parallel Op | Date-range scanning. |
| **Course Search (Regex)**    | 46ms         | 🔴 **COLLSCAN** | Scanning entire collection for substring matches. |

## Top Bottlenecks

### 1. Collection Scans on Search
Search queries use case-insensitive regex patterns which force MongoDB to scan every document in the `courses` collection. Although currently fast (46ms with ~20 records), this will scale linearly and become unusable with 1,000+ courses.

### 2. Uncached Aggregations
The Course Catalog and Instructor Leaderboards perform heavy joins (`$lookup`) and calculations on every request. This consumes high CPU on the database and leads to high latency for the end-user.

### 3. Missing Sorting Indexes
Sorting by `createdAt` for trends and catalogs is currently done in memory or via unoptimized scans.

---
*Report generated on: 2026-04-21*
