# Izumi E-Learning: Database Performance & Audit Report

This report summarizes the findings from the comprehensive audit of all backend controllers and the live performance benchmarking of your database queries.

## 1. Audit Summary

### Routes & Controllers
- **Routes Audit**: Checked `backend/routes/`. No direct database queries found. Logic is correctly delegated to controllers.
- **Controller Audit**: Checked all 9 controllers.
    - **Complexity**: Multiple controllers (Admin, Analytics, Course) use heavy `$lookup` operations.
    - **Bottlenecks**: Found `regex` searches without text indexes and date filters without timestamp indexes.

## 2. Live Performance Benchmark (Current Baseline)
*Tested on live MongoDB Atlas instance with 23 records.*

| Endpoint Category | Query Type | Time (ms) | Index Usage |
| :--- | :--- | :--- | :--- |
| **Catalog Browsing** | Aggregation + Lookup | 440ms | ⚠️ COLLSCAN/Parallel |
| **Admin Dashboard** | Multi-Count | 382ms | ℹ️ Simple Op |
| **Instructor Ranking** | Aggregation + Sorting | 113ms | ℹ️ Optimized |
| **Global Sales Trend** | Date-range Grouping | 169ms | ⚠️ Date Scan |
| **Course Search** | Regex Search | 82ms | 🔴 **COLLSCAN** |

## 3. Top Critical Issues

### 🔴 Issue 1: Collection Scans (Search)
The `getUserSearch` and any filtering by title/description is currently scanning the entire database.
- **Impact**: As you go from 20 courses to 2,000, this query will slow down from <100ms to >3 seconds, causing a poor student experience.
- **Fix**: Implement a **MongoDB Text Index**.

### ⚠️ Issue 2: Missing Foreign Key Indexes
Fields like `teacherId` in the [Course](file:///backend/models/Course.js) model and `courseId` in [Transaction](file:///backend/models/Transaction.js) are not indexed.
- **Impact**: Every `$lookup` join has to perform a full scan of the secondary collection.
- **Fix**: Add single-field indexes on all foreign keys.

### ⚠️ Issue 3: Missing Analytical Indexes
Dashboards filter by `createdAt`. MongoDB does not index this by default.
- **Impact**: All "Trends" or "Growth" charts will perform full collection scans.
- **Fix**: Add a platform-wide index on `createdAt` for all major models.

## 4. Proposed Optimization Plan (Phase 1)
1. **Indexes**: Add `text` index to [Course](file:///backend/models/Course.js), and normal indexes to `teacherId`, `studentId`, `courseId`, and `createdAt`.

#### [Course](file:///backend/models/Course.js) Model
```javascript
subject:        { type: String, index: true }       // Filter by subject
teacherId:      { type: ObjectId, index: true }      // $lookup joins
approvalStatus: { type: String, index: true }        // Student catalog filter
reviewerId:     { type: ObjectId, index: true }      // Reviewer queries
isFeatured:     { type: Boolean, index: true }       // Featured filter

courseSchema.index({ createdAt: -1 });               // Sort by newest
courseSchema.index({ title: "text", description: "text" }); // Full-text search fallback
```

#### [Enrollment](file:///backend/models/Enrollment.js) Model
```javascript
enrollmentSchema.index({ courseId: 1, studentId: 1 }, { unique: true }); // Prevent duplicates
enrollmentSchema.index({ courseId: 1 });              // Enrollment count per course
enrollmentSchema.index({ studentId: 1 });             // "My Courses" lookups
enrollmentSchema.index({ createdAt: -1 });            // Enrollment trend analytics
```

#### [Transaction](file:///backend/models/Transaction.js) Model
```javascript
reference: { type: String, unique: true, index: true } // Unique transaction lookup
courseId:   { type: ObjectId, index: true }              // Revenue per course
studentId:  { type: ObjectId, index: true }              // Student payment history
teacherId:  { type: ObjectId, index: true }              // Teacher payout queries
status:     { type: String, index: true }                // Filter by payment status
payoutStatus: { type: String, index: true }              // Payout management
transactionSchema.index({ createdAt: 1 });               // Revenue trend over time
```

#### [Message](file:///backend/models/Message.js) Model
```javascript
messageSchema.index({ courseId: 1, senderId: 1, receiverId: 1, createdAt: -1 }); // DM history
messageSchema.index({ courseId: 1 });                    // Course chat lookup
messageSchema.index({ createdAt: -1 });                  // Recent messages
```

2. **Refactor**: Replace JavaScript `$function` in `courseController.js` with native operators.
3. **Caching**: Introduce Redis to store the `440ms` catalog result for near-instant (<10ms) browsing.
