// creditsController.js
const path = require('path');
const CreditsModel = require('../models/creditsModel');
const mongoose = require('mongoose');

const CreditsController = {
  
  // ────────────────────────────────
  // 📄 Page Rendering
  // ────────────────────────────────
  
  getStorePage: (req, res) => {
    if (!req.session.student) {
      return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../views/store/store.html'));
  },
  
  getProfileCustomizationPage: (req, res) => {
    if (!req.session.student) {
      return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../views/store/customize.html'));
  },
  
  getLeaderboardPage: (req, res) => {
    if (!req.session.student) {
      return res.redirect('/login');
    }
    res.sendFile(path.join(__dirname, '../views/store/leaderboard.html'));
  },
  
  // ────────────────────────────────
  // 💰 Credits API
  // ────────────────────────────────
  
  /**
   * GET /api/credits - Get student's credits
   */
  getCredits: async (req, res) => {
    if (!req.session.student) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const credits = await CreditsModel.getCredits(req.session.student);
      const nextLevelExp = CreditsModel.getNextLevelExperience(credits.level);
      const currentLevelExp = CreditsModel.getNextLevelExperience(credits.level - 1);
      const progressToNextLevel = ((credits.experience - currentLevelExp) / (nextLevelExp - currentLevelExp) * 100).toFixed(2);
      
      res.json({
        ...credits.toObject(),
        nextLevelExp,
        progressToNextLevel
      });
    } catch (error) {
      console.error("Error getting credits:", error);
      res.status(500).json({ error: error.message });
    }
  },
  
  /**
   * GET /api/credits/history - Get transaction history
   */
  getTransactionHistory: async (req, res) => {
    if (!req.session.student) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const limit = parseInt(req.query.limit) || 50;
      const transactions = await CreditsModel.getTransactionHistory(req.session.student, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error getting transaction history:", error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // ────────────────────────────────
  // 🏪 Store API
  // ────────────────────────────────
  
  /**
   * GET /api/store/items - Get all store items
   */
  getStoreItems: async (req, res) => {
    if (!req.session.student) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const filters = {
        type: req.query.type,
        rarity: req.query.rarity,
        maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : undefined
      };
      
      const items = await CreditsModel.getAvailableItems(req.session.student, filters);
      const inventory = await CreditsModel.getInventory(req.session.student);
      const ownedIds = inventory.map(i => i.item_id._id.toString());
      
      // Mark owned items
      const itemsWithOwnership = items.map(item => ({
        ...item.toObject(),
        owned: ownedIds.includes(item._id.toString())
      }));
      
      res.json(itemsWithOwnership);
    } catch (error) {
      console.error("Error getting store items:", error);
      res.status(500).json({ error: error.message });
    }
  },
  
  /**
   * POST /api/store/purchase - Purchase an item
   */
  purchaseItem: async (req, res) => {
    if (!req.session.student) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { itemId } = req.body;
    
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }
    
    try {
      const result = await CreditsModel.purchaseItem(req.session.student, itemId);
      res.json({
        success: true,
        message: `Successfully purchased ${result.item.name}!`,
        item: result.item,
        credits: result.credits
      });
    } catch (error) {
      console.error("Error purchasing item:", error);
      res.status(400).json({ error: error.message });
    }
  },
  
  /**
   * GET /api/store/inventory - Get student's inventory
   */
  getInventory: async (req, res) => {
    if (!req.session.student) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const inventory = await CreditsModel.getInventory(req.session.student);
      res.json(inventory);
    } catch (error) {
      console.error("Error getting inventory:", error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // ────────────────────────────────
  // 👤 Profile Customization API
  // ────────────────────────────────
  
  /**
   * GET /api/profile/customization - Get profile customization
   */
  getProfileCustomization: async (req, res) => {
    if (!req.session.student) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const profile = await CreditsModel.getProfile(req.session.student);
      res.json(profile);
    } catch (error) {
      console.error("Error getting profile:", error);
      res.status(500).json({ error: error.message });
    }
  },
  
  /**
   * POST /api/profile/equip - Equip an item
   */
  equipItem: async (req, res) => {
    if (!req.session.student) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { itemId } = req.body;
    
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }
    
    try {
      const profile = await CreditsModel.equipItem(req.session.student, itemId);
      res.json({
        success: true,
        message: "Item equipped successfully!",
        profile
      });
    } catch (error) {
      console.error("Error equipping item:", error);
      res.status(400).json({ error: error.message });
    }
  },
  
  /**
   * POST /api/profile/unequip - Unequip an item
   */
  unequipItem: async (req, res) => {
    if (!req.session.student) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { itemId } = req.body;
    
    if (!itemId || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({ error: "Invalid item ID" });
    }
    
    try {
      const profile = await CreditsModel.unequipItem(req.session.student, itemId);
      res.json({
        success: true,
        message: "Item unequipped successfully!",
        profile
      });
    } catch (error) {
      console.error("Error unequipping item:", error);
      res.status(400).json({ error: error.message });
    }
  },
  
  /**
   * PUT /api/profile/update - Update bio, color, etc.
   */
  updateProfile: async (req, res) => {
    if (!req.session.student) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { bio, profile_color, custom_title } = req.body;
    
    try {
      const profile = await CreditsModel.updateProfile(req.session.student, {
        bio,
        profile_color,
        custom_title
      });
      res.json({
        success: true,
        message: "Profile updated successfully!",
        profile
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(400).json({ error: error.message });
    }
  },
  
  // ────────────────────────────────
  // 🏆 Leaderboard API
  // ────────────────────────────────
  
  /**
   * GET /api/leaderboard - Get top students
   */
  getLeaderboard: async (req, res) => {
    if (!req.session.student) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const limit = parseInt(req.query.limit) || 100;
      const leaderboard = await CreditsModel.getLeaderboard(limit);
      const myRank = await CreditsModel.getStudentRank(req.session.student);
      
      res.json({
        leaderboard,
        myRank
      });
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // ────────────────────────────────
  // 🎓 Award Credits (Admin/System)
  // ────────────────────────────────
  
  /**
   * POST /api/admin/award-credits - Manual credit award (for instructors)
   */
  awardCreditsManually: async (req, res) => {
    // TODO: Add instructor authentication check
    if (!req.session.instructor && !req.session.student) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    const { studentId, amount, description } = req.body;
    
    if (!studentId || !amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid parameters" });
    }
    
    try {
      const credits = await CreditsModel.addCredits(
        studentId,
        amount,
        'bonus',
        null,
        description || 'Bonus credits from instructor'
      );
      
      res.json({
        success: true,
        message: `Awarded ${amount} credits successfully!`,
        credits
      });
    } catch (error) {
      console.error("Error awarding credits:", error);
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = CreditsController;