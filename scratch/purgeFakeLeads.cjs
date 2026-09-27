const mongoose = require('mongoose');
const mongoUri = 'mongodb+srv://singhmantej536_db_user:kubFDOknJpgZ96Ch@akhilreddittest.xyi688s.mongodb.net/';

(async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas');
    const LeadAgentItem = mongoose.model('LeadAgentItem', new mongoose.Schema({}, { strict: false }));
    const res = await LeadAgentItem.deleteMany({ author: { $regex: 'fake', $options: 'i' } });
    console.log(`Successfully purged ${res.deletedCount} legacy mock leads from MongoDB Atlas!`);
    await mongoose.disconnect();
  } catch (e) {
    console.log('Error purging fake leads:', e.message);
  }
})();
