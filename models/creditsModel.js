// creditsModel.js
const {
  StudentCredits,
  CreditTransaction,
  StoreItem,
  StudentInventory,
  StudentProfile,
  Achievement,
  StudentAchievement,
  Course,
  Module,
} = require("../required/db");
const mongoose = require("mongoose");

const CreditsModel = {
  // ────────────────────────────────
  // 💰 Credit Management
  // ────────────────────────────────

  /**
   * Initialize credits account for new student
   */
  initializeCredits: async (studentId) => {
    const existing = await StudentCredits.findOne({ student_id: studentId });
    if (existing) return existing;

    const credits = new StudentCredits({
      student_id: studentId,
      total_credits: 0,
      lifetime_credits: 0,
      level: 1,
      experience: 0,
    });

    return await credits.save();
  },

  /**
   * Get student's credit balance and stats
   */
  getCredits: async (studentId) => {
    let credits = await StudentCredits.findOne({ student_id: studentId });
    if (!credits) {
      credits = await CreditsModel.initializeCredits(studentId);
    }
    return credits;
  },

  /**
   * Add credits to student account
   */
  addCredits: async (
    studentId,
    amount,
    type,
    referenceId = null,
    description = ""
  ) => {
    if (amount <= 0) throw new Error("Amount must be positive");

    // Get or create credits account
    let credits = await CreditsModel.getCredits(studentId);

    // Update credits
    credits.total_credits += amount;
    credits.lifetime_credits += amount;
    credits.updated_at = new Date();

    // Calculate level and experience
    credits.experience += amount;
    const newLevel = CreditsModel.calculateLevel(credits.experience);
    if (newLevel > credits.level) {
      credits.level = newLevel;
      // TODO: Trigger level-up notification/achievement
    }

    await credits.save();

    // Record transaction
    const transaction = new CreditTransaction({
      student_id: studentId,
      amount,
      type,
      reference_id: referenceId,
      description: description || `Earned ${amount} credits from ${type}`,
    });
    await transaction.save();

    return credits;
  },

  /**
   * Deduct credits (for purchases)
   */
  deductCredits: async (
    studentId,
    amount,
    type,
    referenceId = null,
    description = ""
  ) => {
    if (amount <= 0) throw new Error("Amount must be positive");

    const credits = await CreditsModel.getCredits(studentId);

    if (credits.total_credits < amount) {
      throw new Error("Insufficient credits");
    }

    credits.total_credits -= amount;
    credits.updated_at = new Date();
    await credits.save();

    // Record transaction (negative amount)
    const transaction = new CreditTransaction({
      student_id: studentId,
      amount: -amount,
      type,
      reference_id: referenceId,
      description: description || `Spent ${amount} credits on ${type}`,
    });
    await transaction.save();

    return credits;
  },

  /**
   * Calculate level based on total experience
   * Formula: Level = floor(sqrt(experience / 100)) + 1
   */
  calculateLevel: (experience) => {
    return Math.floor(Math.sqrt(experience / 100)) + 1;
  },

  /**
   * Get experience needed for next level
   */
  getNextLevelExperience: (currentLevel) => {
    return Math.pow(currentLevel, 2) * 100;
  },

  /**
   * Get transaction history
   */
  getTransactionHistory: async (studentId, limit = 50) => {
    return await CreditTransaction.find({ student_id: studentId })
      .sort({ created_at: -1 })
      .limit(limit)
      .populate("reference_id");
  },

  // ────────────────────────────────
  // 🎓 Course Completion Rewards
  // ────────────────────────────────

  /**
   * Award credits for course completion
   */
  awardCourseCompletion: async (studentId, courseId) => {
    const course = await Course.findById(courseId);
    if (!course) throw new Error("Course not found");

    const credits = course.completion_credits || 100;

    return await CreditsModel.addCredits(
      studentId,
      credits,
      "course_completion",
      courseId,
      `Completed "${course.title}"`
    );
  },

  /**
   * Award credits for module completion
   */
  awardModuleCompletion: async (studentId, moduleId) => {
    const module = await Module.findById(moduleId).populate("course_id");
    if (!module) throw new Error("Module not found");
    // Award a fixed 10 credits for every module completion
    const credits = 10;

    return await CreditsModel.addCredits(
      studentId,
      credits,
      "module_completion",
      moduleId,
      `Completed module: ${module.title}`
    );
  },

  // ────────────────────────────────
  // 🏪 Store Operations
  // ────────────────────────────────

  /**
   * Get all store items
   */
  getStoreItems: async (filters = {}) => {
    const query = { is_active: true };

    if (filters.type) query.type = filters.type;
    if (filters.rarity) query.rarity = filters.rarity;
    if (filters.maxPrice) query.price = { $lte: filters.maxPrice };

    return await StoreItem.find(query).sort({ rarity: -1, price: 1 });
  },

  /**
   * Get available items for student (considering level)
   */
  getAvailableItems: async (studentId, filters = {}) => {
    const credits = await CreditsModel.getCredits(studentId);
    const allItems = await CreditsModel.getStoreItems(filters);

    // Filter by unlock level
    return allItems.filter((item) => item.unlock_level <= credits.level);
  },

  /**
   * Purchase item from store
   */
  purchaseItem: async (studentId, itemId) => {
    const item = await StoreItem.findById(itemId);
    if (!item || !item.is_active) {
      throw new Error("Item not found or unavailable");
    }

    const credits = await CreditsModel.getCredits(studentId);

    // Check level requirement
    if (credits.level < item.unlock_level) {
      throw new Error(`Requires level ${item.unlock_level}`);
    }

    // Check if already owned
    const owned = await StudentInventory.findOne({
      student_id: studentId,
      item_id: itemId,
    });
    if (owned) {
      throw new Error("Item already owned");
    }

    // Deduct credits
    await CreditsModel.deductCredits(
      studentId,
      item.price,
      "purchase",
      itemId,
      `Purchased ${item.name}`
    );

    // Add to inventory
    const inventoryItem = new StudentInventory({
      student_id: studentId,
      item_id: itemId,
      is_equipped: false,
    });
    await inventoryItem.save();

    return { item, credits: await CreditsModel.getCredits(studentId) };
  },

  /**
   * Get student's inventory
   */
  getInventory: async (studentId) => {
    return await StudentInventory.find({ student_id: studentId })
      .populate("item_id")
      .sort({ purchased_at: -1 });
  },

  // ────────────────────────────────
  // 👤 Profile Customization
  // ────────────────────────────────

  /**
   * Get student's profile customization
   */
  getProfile: async (studentId) => {
    let profile = await StudentProfile.findOne({ student_id: studentId })
      .populate("banner_id")
      .populate("avatar_frame_id")
      .populate("equipped_badge_ids")
      .populate("theme_id");

    if (!profile) {
      profile = new StudentProfile({ student_id: studentId });
      await profile.save();
    }

    return profile;
  },

  /**
   * Equip item (banner, frame, badge, theme)
   */
  equipItem: async (studentId, itemId) => {
    // Check if student owns the item
    const inventoryItem = await StudentInventory.findOne({
      student_id: studentId,
      item_id: itemId,
    }).populate("item_id");

    if (!inventoryItem) {
      throw new Error("Item not owned");
    }

    const item = inventoryItem.item_id;
    let profile = await CreditsModel.getProfile(studentId);

    // Unequip old item of same type
    if (item.type === "banner") {
      profile.banner_id = itemId;
    } else if (item.type === "avatar_frame") {
      profile.avatar_frame_id = itemId;
    } else if (item.type === "theme") {
      profile.theme_id = itemId;
    } else if (item.type === "badge") {
      // Max 5 badges
      if (!profile.equipped_badge_ids) profile.equipped_badge_ids = [];
      if (profile.equipped_badge_ids.length >= 5) {
        throw new Error("Maximum 5 badges can be equipped");
      }
      profile.equipped_badge_ids.push(itemId);
    }

    // Mark as equipped in inventory
    inventoryItem.is_equipped = true;
    await inventoryItem.save();

    profile.updated_at = new Date();
    await profile.save();

    return profile;
  },

  /**
   * Unequip item
   */
  unequipItem: async (studentId, itemId) => {
    const item = await StoreItem.findById(itemId);
    if (!item) throw new Error("Item not found");

    let profile = await CreditsModel.getProfile(studentId);

    if (item.type === "banner") {
      profile.banner_id = null;
    } else if (item.type === "avatar_frame") {
      profile.avatar_frame_id = null;
    } else if (item.type === "theme") {
      profile.theme_id = null;
    } else if (item.type === "badge") {
      profile.equipped_badge_ids = profile.equipped_badge_ids.filter(
        (id) => id.toString() !== itemId.toString()
      );
    }

    // Update inventory
    await StudentInventory.updateOne(
      { student_id: studentId, item_id: itemId },
      { is_equipped: false }
    );

    profile.updated_at = new Date();
    await profile.save();

    return profile;
  },

  /**
   * Update profile bio or color
   */
  updateProfile: async (studentId, updates) => {
    let profile = await CreditsModel.getProfile(studentId);

    if (updates.bio !== undefined) {
      profile.bio = updates.bio.substring(0, 200);
    }
    if (updates.profile_color !== undefined) {
      profile.profile_color = updates.profile_color;
    }
    if (updates.custom_title !== undefined) {
      profile.custom_title = updates.custom_title.substring(0, 50);
    }

    profile.updated_at = new Date();
    await profile.save();

    return profile;
  },

  // ────────────────────────────────
  // 🏆 Leaderboard
  // ────────────────────────────────

  /**
   * Get top students by lifetime credits
   */
  getLeaderboard: async (limit = 100) => {
    return await StudentCredits.find()
      .sort({ lifetime_credits: -1, level: -1 })
      .limit(limit)
      .populate("student_id", "name email")
      .select("student_id total_credits lifetime_credits level experience");
  },

  /**
   * Get student's rank
   */
  getStudentRank: async (studentId) => {
    const allStudents = await StudentCredits.find()
      .sort({ lifetime_credits: -1, level: -1 })
      .select("student_id");

    const rank = allStudents.findIndex(
      (s) => s.student_id.toString() === studentId.toString()
    );

    return rank === -1 ? null : rank + 1;
  },
};

module.exports = CreditsModel;
