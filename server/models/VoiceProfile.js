const mongoose = require('mongoose');

const voiceProfileSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  voiceName: {
    type: String,
    default: 'My Conversational Founder Voice',
  },
  tonePersona: {
    type: String,
    default: 'Helpful Peer & Founder',
  },
  writingRules: [
    { type: String }
  ],
  sampleTexts: [
    { type: String }
  ],
  // Few-Shot Feedback Memory Store (Stores edited/approved DMs)
  fewShotExamples: [
    {
      leadContext: { type: String, default: '' },
      approvedMessage: { type: String, default: '' },
      wasEdited: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    }
  ],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('VoiceProfile', voiceProfileSchema);
