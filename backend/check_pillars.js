require('dotenv').config();
try {
  require('./services/razorpayService');
  console.log('razorpayService ✅');
  require('./controllers/webhookController');
  console.log('webhookController ✅');
  require('./routes/webhookRoutes');
  console.log('webhookRoutes ✅');
  const cron = require('node-cron');
  console.log('node-cron ✅');
  console.log('\nAll 4-pillar files load OK!');
} catch(e) {
  console.error('Error:', e.message);
}
