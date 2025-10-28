// server/models/Question.js (Corrected)

const mongoose = require('mongoose');
const { Schema } = mongoose;

// 1. Define a separate schema for an Option
// By default, Mongoose adds a unique _id to all schemas.
const OptionSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
});

// 2. Define the main QuestionSchema
const QuestionSchema = new Schema({
  questionText: {
    type: String,
    required: [true, 'Question text is required'],
  },
  
  // 3. Use the OptionSchema for the options array
  // This ensures every option in the array is a full sub-document
  // and will get its own unique _id.
  options: [OptionSchema], // <-- THIS IS THE MAIN FIX

  // 4. The correctAnswer should store the _id of the correct option
  // It should be of type ObjectId from the OptionSchema.
  correctAnswer: {
    type: Schema.Types.ObjectId,
    required: [true, 'Correct answer is required'],
  },
  
  quiz: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  // ... any other fields you have
}, { timestamps: true });


module.exports = mongoose.model('Question', QuestionSchema);