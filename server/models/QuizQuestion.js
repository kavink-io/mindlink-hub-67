// server/models/QuizQuestion.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

// 1. Define a separate schema for an Option
// This forces Mongoose to create a unique _id for every option
// and includes the 'isCorrect' field your route logic uses.
const OptionSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
    default: false,
  }
});

// 2. Define the main QuizQuestionSchema
const QuizQuestionSchema = new Schema({
  quiz: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  
  // 3. Use the OptionSchema for the options array
  // This is the main fix. Each option will now get a unique _id
  // and store { text: "...", isCorrect: ... }
  options: [OptionSchema], 

}, { timestamps: true });

// Ensure quiz field is indexed for faster lookups
QuizQuestionSchema.index({ quiz: 1 });

module.exports = mongoose.model('QuizQuestion', QuizQuestionSchema);