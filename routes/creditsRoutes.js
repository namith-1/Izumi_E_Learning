// Add these routes to your main routes file (e.g., app.js or routes/index.js)

const express = require('express');
const router = express.Router();
const CreditsController = require('./controllers/creditsController');

// ════════════════════════════════════════════════════════════════
// 💰 CREDITS & STORE ROUTES
// ════════════════════════════════════════════════════════════════

// ──────────────────────────────────
// 📄 Page Routes
// ──────────────────────────────────
router.get('/store', CreditsController.getStorePage);
router.get('/customize-profile', CreditsController.getProfileCustomizationPage);
router.get('/leaderboard', CreditsController.getLeaderboardPage);

// ──────────────────────────────────
// 💰 Credits API Routes
// ──────────────────────────────────
router.get('/api/credits', CreditsController.getCredits);
router.get('/api/credits/history', CreditsController.getTransactionHistory);

// ──────────────────────────────────
// 🏪 Store API Routes
// ──────────────────────────────────
router.get('/api/store/items', CreditsController.getStoreItems);
router.post('/api/store/purchase', CreditsController.purchaseItem);
router.get('/api/store/inventory', CreditsController.getInventory);

// ──────────────────────────────────
// 👤 Profile Customization API Routes
// ──────────────────────────────────
router.get('/api/profile/customization', CreditsController.getProfileCustomization);
router.post('/api/profile/equip', CreditsController.equipItem);
router.post('/api/profile/unequip', CreditsController.unequipItem);
router.put('/api/profile/update', CreditsController.updateProfile);

// ──────────────────────────────────
// 🏆 Leaderboard API Routes
// ──────────────────────────────────
router.get('/api/leaderboard', CreditsController.getLeaderboard);

// ──────────────────────────────────
// 🎓 Admin/Instructor Routes
// ──────────────────────────────────
router.post('/api/admin/award-credits', CreditsController.awardCreditsManually);

module.exports = router;


// ════════════════════════════════════════════════════════════════
// 📝 INTEGRATION NOTES
// ════════════════════════════════════════════════════════════════

/*
1. ADD TO YOUR MAIN APP FILE (e.g., app.js or server.js):

const creditsRoutes = require('./routes/creditsRoutes');
app.use('/', creditsRoutes);

2. UPDATE YOUR NAVIGATION (add to home page or header):

<nav>
  <a href="/store">🏪 Store</a>
  <a href="/customize-profile">✨ Customize Profile</a>
  <a href="/leaderboard">🏆 Leaderboard</a>
</nav>

3. DISPLAY CREDITS IN HEADER (add to all student pages):

<div class="credits-display">
  <span id="userCredits">0</span> Credits
  <span id="userLevel">Lvl 1</span>
</div>

<script>
  fetch('/api/credits')
    .then(res => res.json())
    .then(data => {
      document.getElementById('userCredits').textContent = data.total_credits;
      document.getElementById('userLevel').textContent = `Lvl ${data.level}`;
    });
</script>

4. SEED THE DATABASE (run once):

In your db.js, uncomment and run:
seedStoreItems();

Or create a separate seed script:
// seed.js
const { seedStoreItems } = require('./required/db');
seedStoreItems()
  .then(() => {
    console.log('✅ Store seeded successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error seeding:', err);
    process.exit(1);
  });

5. INITIALIZE CREDITS FOR EXISTING STUDENTS:

// migration.js
const CreditsModel = require('./models/creditsModel');
const { Student } = require('./required/db');

async function initializeAllStudents() {
  const students = await Student.find();
  for (const student of students) {
    await CreditsModel.initializeCredits(student._id);
  }
  console.log('✅ All students initialized with credits!');
}

initializeAllStudents();

6. DIRECTORY STRUCTURE:

your-project/
├── controllers/
│   ├── creditsController.js       ← Create this
│   ├── studentCourseC.js          ← Update this (already provided)
│   └── updateStudentController.js
├── models/
│   ├── creditsModel.js            ← Create this
│   ├── studentModel.js
│   └── courseModel.js
├── views/
│   └── store/                     ← Create this folder
│       ├── store.html             ← Create this
│       ├── customize.html         ← Create this
│       └── leaderboard.html       ← Optional (create similar to store.html)
├── required/
│   └── db.js                      ← Update with new schemas
└── routes/
    ├── creditsRoutes.js           ← Create this
    └── index.js                   ← Import creditsRoutes here

7. TESTING THE SYSTEM:

a) Register/login as a student
b) Enroll in a course → Earn 50 credits bonus
c) Complete a module → Earn 10 credits
d) Complete entire course → Earn 100 credits bonus
e) Visit /store → Purchase items
f) Visit /customize-profile → Equip purchased items
g) Visit /leaderboard → See your rank

8. FEATURES INCLUDED:

✅ Credits system with levels and XP
✅ Store with 20+ items (banners, frames, badges, themes, titles)
✅ Rarity system (common, rare, epic, legendary)
✅ Level-gated items (unlock at specific levels)
✅ Transaction history
✅ Profile customization (Discord-like)
✅ Inventory management
✅ Equip/unequip items
✅ Leaderboard
✅ Automatic credit rewards for:
   - Course enrollment
   - Module completion
   - Course completion
✅ Manual credit awards (for instructors)

9. CREDIT ECONOMY SUGGESTIONS:

- Enrollment bonus: 50 credits
- Module completion: 10 credits each
- Course completion: 100 credits
- Perfect score bonus: 50 credits
- Daily login: 5 credits
- Helping others: 20 credits
- Achievements: 25-200 credits

10. FUTURE ENHANCEMENTS:

- Achievements system (half-implemented in schema)
- Animated profile effects
- Limited-time items
- Seasonal events
- Trading system
- Gift credits to friends
- Daily quests
- Streak bonuses
*/