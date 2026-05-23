const bcrypt = require('bcryptjs');
require('dotenv').config();
const { db, initializeDatabase } = require('./database');
const { normalizeText } = require('./utils/normalize');

initializeDatabase();
console.log('🌱 Seeding database...\n');

db.prepare('INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run('Admin', 'admin@proenglishbd.com', bcrypt.hashSync('admin123', 10), 'admin');
db.prepare('INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)').run('Demo Student', 'student@proenglishbd.com', bcrypt.hashSync('student123', 10), 'student');
db.prepare('INSERT OR IGNORE INTO batches (id, name, description) VALUES (?, ?, ?)').run(1, 'IELTS Batch 01', 'First IELTS preparation batch');
db.prepare("UPDATE users SET batch_id = 1 WHERE email = 'student@proenglishbd.com'").run();

const items = [
  { category: 'ielts', difficulty: 'easy', correct_text: 'accommodation', note: 'Common IELTS word - double c, double m' },
  { category: 'ielts', difficulty: 'easy', correct_text: 'library', note: 'Often misspelled' },
  { category: 'ielts', difficulty: 'medium', correct_text: 'environment', note: 'Common topic word' },
  { category: 'ielts', difficulty: 'medium', correct_text: 'government', note: 'Silent n' },
  { category: 'ielts', difficulty: 'easy', correct_text: 'Wednesday', note: 'Silent d' },
  { category: 'ielts', difficulty: 'medium', correct_text: 'restaurant', note: 'Common IELTS listening word' },
  { category: 'ielts', difficulty: 'hard', correct_text: 'entrepreneurship', note: 'Advanced vocabulary' },
  { category: 'ielts', difficulty: 'medium', correct_text: '15 King Street', note: 'Address format' },
  { category: 'ielts', difficulty: 'medium', correct_text: 'psychology', note: 'Silent p' },
  { category: 'ielts', difficulty: 'easy', correct_text: 'necessary', note: 'One c, double s' },
  { category: 'ielts', difficulty: 'hard', correct_text: 'questionnaire', note: 'Double n' },
  { category: 'ielts', difficulty: 'medium', correct_text: 'February', note: 'Often mispronounced' },
  { category: 'phrase', difficulty: 'easy', correct_text: 'at the moment', note: 'Time expression' },
  { category: 'phrase', difficulty: 'easy', correct_text: 'on the other hand', note: 'Contrast connector' },
  { category: 'phrase', difficulty: 'medium', correct_text: 'as soon as possible', note: 'Urgency phrase' },
  { category: 'phrase', difficulty: 'easy', correct_text: 'in my opinion', note: 'Opinion phrase' },
  { category: 'phrase', difficulty: 'medium', correct_text: 'take into account', note: 'Consideration phrase' },
  { category: 'phrase', difficulty: 'medium', correct_text: 'as a matter of fact', note: 'Emphasis phrase' },
  { category: 'phrase', difficulty: 'hard', correct_text: 'by and large', note: 'Means generally' },
  { category: 'phrase', difficulty: 'easy', correct_text: 'first of all', note: 'Sequencing phrase' },
  { category: 'phrase', difficulty: 'medium', correct_text: 'in terms of', note: 'Regarding something' },
  { category: 'phrase', difficulty: 'hard', correct_text: 'needless to say', note: 'Obviously' },
  { category: 'sentence', difficulty: 'easy', correct_text: 'I have been learning English for three months.', note: 'Present perfect continuous' },
  { category: 'sentence', difficulty: 'medium', correct_text: 'The library is located next to the main building.', note: 'Location description' },
  { category: 'sentence', difficulty: 'medium', correct_text: 'Could you please tell me where the nearest bus stop is?', note: 'Polite question' },
  { category: 'sentence', difficulty: 'hard', correct_text: 'Despite the heavy rain, they decided to continue with the outdoor event.', note: 'Complex sentence' },
  { category: 'sentence', difficulty: 'easy', correct_text: 'She goes to university every morning.', note: 'Simple present' },
  { category: 'sentence', difficulty: 'medium', correct_text: 'The course will begin on the fifteenth of September.', note: 'Date format' },
  { category: 'sentence', difficulty: 'hard', correct_text: 'Although the experiment was unsuccessful, it provided valuable insights for future research.', note: 'Academic sentence' },
  { category: 'passage', difficulty: 'medium', correct_text: 'The university campus is located in the northern part of the city. It has three main buildings and a large library. Students can access the facilities from Monday to Saturday.', note: 'University description' },
  { category: 'passage', difficulty: 'hard', correct_text: 'Climate change is one of the most pressing issues of our time. Scientists have observed rising temperatures across the globe. This has led to melting ice caps, rising sea levels, and more frequent extreme weather events.', note: 'Climate topic' },
  { category: 'passage', difficulty: 'medium', correct_text: 'Good morning everyone. Today we will discuss the importance of time management. Please take out your notebooks and write down the key points.', note: 'Classroom instruction' },
];

const insertItem = db.prepare('INSERT OR IGNORE INTO listening_items (category, difficulty, correct_text, normalized_text, note, tts_enabled, punctuation_mode, capitalization_mode, active, created_by) VALUES (?, ?, ?, ?, ?, 1, \'flexible\', \'flexible\', 1, 1)');
for (const item of items) { insertItem.run(item.category, item.difficulty, item.correct_text, normalizeText(item.correct_text, { punctuationMode: 'flexible', capitalizationMode: 'flexible' }), item.note); }

console.log('✅ Database seeded successfully!');
console.log('\n📋 Demo Credentials:');
console.log('   Admin: admin@proenglishbd.com / admin123');
console.log('   Student: student@proenglishbd.com / student123');
console.log(`\n📦 Items seeded: ${items.length}`);
