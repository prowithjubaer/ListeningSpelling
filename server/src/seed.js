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
  { category: 'ielts', difficulty: 'easy', correct_text: 'accommodation', note: 'Common IELTS word - double c, double m', bangla_meaning: 'আবাসন, থাকার জায়গা' },
  { category: 'ielts', difficulty: 'easy', correct_text: 'library', note: 'Often misspelled', bangla_meaning: 'গ্রন্থাগার, লাইব্রেরি' },
  { category: 'ielts', difficulty: 'medium', correct_text: 'environment', note: 'Common topic word', bangla_meaning: 'পরিবেশ' },
  { category: 'ielts', difficulty: 'medium', correct_text: 'government', note: 'Silent n', bangla_meaning: 'সরকার' },
  { category: 'ielts', difficulty: 'easy', correct_text: 'Wednesday', note: 'Silent d', bangla_meaning: 'বুধবার' },
  { category: 'ielts', difficulty: 'medium', correct_text: 'restaurant', note: 'Common IELTS listening word', bangla_meaning: 'রেস্তোরাঁ, খাবারের দোকান' },
  { category: 'ielts', difficulty: 'hard', correct_text: 'entrepreneurship', note: 'Advanced vocabulary', bangla_meaning: 'উদ্যোক্তা হওয়ার প্রক্রিয়া' },
  { category: 'ielts', difficulty: 'medium', correct_text: '15 King Street', note: 'Address format', bangla_meaning: '১৫ কিং স্ট্রিট (ঠিকানা)' },
  { category: 'ielts', difficulty: 'medium', correct_text: 'psychology', note: 'Silent p', bangla_meaning: 'মনোবিজ্ঞান' },
  { category: 'ielts', difficulty: 'easy', correct_text: 'necessary', note: 'One c, double s', bangla_meaning: 'প্রয়োজনীয়' },
  { category: 'ielts', difficulty: 'hard', correct_text: 'questionnaire', note: 'Double n', bangla_meaning: 'প্রশ্নমালা' },
  { category: 'ielts', difficulty: 'medium', correct_text: 'February', note: 'Often mispronounced', bangla_meaning: 'ফেব্রুয়ারি' },
  { category: 'phrase', difficulty: 'easy', correct_text: 'at the moment', note: 'Time expression', bangla_meaning: 'এই মুহূর্তে' },
  { category: 'phrase', difficulty: 'easy', correct_text: 'on the other hand', note: 'Contrast connector', bangla_meaning: 'অপরদিকে' },
  { category: 'phrase', difficulty: 'medium', correct_text: 'as soon as possible', note: 'Urgency phrase', bangla_meaning: 'যত দ্রুত সম্ভব' },
  { category: 'phrase', difficulty: 'easy', correct_text: 'in my opinion', note: 'Opinion phrase', bangla_meaning: 'আমার মতে' },
  { category: 'phrase', difficulty: 'medium', correct_text: 'take into account', note: 'Consideration phrase', bangla_meaning: 'বিবেচনায় নেওয়া' },
  { category: 'phrase', difficulty: 'medium', correct_text: 'as a matter of fact', note: 'Emphasis phrase', bangla_meaning: 'আসলে, বাস্তবে' },
  { category: 'phrase', difficulty: 'hard', correct_text: 'by and large', note: 'Means generally', bangla_meaning: 'সাধারণভাবে, মোটামুটি' },
  { category: 'phrase', difficulty: 'easy', correct_text: 'first of all', note: 'Sequencing phrase', bangla_meaning: 'সর্বপ্রথম' },
  { category: 'phrase', difficulty: 'medium', correct_text: 'in terms of', note: 'Regarding something', bangla_meaning: 'এর পরিপ্রেক্ষিতে' },
  { category: 'phrase', difficulty: 'hard', correct_text: 'needless to say', note: 'Obviously', bangla_meaning: 'বলার অপেক্ষা রাখে না' },
  { category: 'sentence', difficulty: 'easy', correct_text: 'I have been learning English for three months.', note: 'Present perfect continuous', bangla_meaning: 'আমি তিন মাস ধরে ইংরেজি শিখছি।' },
  { category: 'sentence', difficulty: 'medium', correct_text: 'The library is located next to the main building.', note: 'Location description', bangla_meaning: 'লাইব্রেরিটি মূল ভবনের পাশে অবস্থিত।' },
  { category: 'sentence', difficulty: 'medium', correct_text: 'Could you please tell me where the nearest bus stop is?', note: 'Polite question', bangla_meaning: 'দয়া করে আমাকে বলবেন নিকটতম বাস স্টপ কোথায়?' },
  { category: 'sentence', difficulty: 'hard', correct_text: 'Despite the heavy rain, they decided to continue with the outdoor event.', note: 'Complex sentence', bangla_meaning: 'প্রবল বৃষ্টি সত্ত্বেও, তারা বাইরের অনুষ্ঠান চালিয়ে যাওয়ার সিদ্ধান্ত নিল।' },
  { category: 'sentence', difficulty: 'easy', correct_text: 'She goes to university every morning.', note: 'Simple present', bangla_meaning: 'সে প্রতিদিন সকালে বিশ্ববিদ্যালয়ে যায়।' },
  { category: 'sentence', difficulty: 'medium', correct_text: 'The course will begin on the fifteenth of September.', note: 'Date format', bangla_meaning: 'কোর্সটি সেপ্টেম্বরের পনেরো তারিখে শুরু হবে।' },
  { category: 'sentence', difficulty: 'hard', correct_text: 'Although the experiment was unsuccessful, it provided valuable insights for future research.', note: 'Academic sentence', bangla_meaning: 'পরীক্ষাটি ব্যর্থ হলেও, ভবিষ্যৎ গবেষণার জন্য মূল্যবান তথ্য প্রদান করেছে।' },
  { category: 'passage', difficulty: 'medium', correct_text: 'The university campus is located in the northern part of the city. It has three main buildings and a large library. Students can access the facilities from Monday to Saturday.', note: 'University description', bangla_meaning: 'বিশ্ববিদ্যালয় ক্যাম্পাস শহরের উত্তর অংশে অবস্থিত। এতে তিনটি প্রধান ভবন এবং একটি বড় গ্রন্থাগার আছে। সোমবার থেকে শনিবার পর্যন্ত শিক্ষার্থীরা সুবিধাগুলো ব্যবহার করতে পারে।' },
  { category: 'passage', difficulty: 'hard', correct_text: 'Climate change is one of the most pressing issues of our time. Scientists have observed rising temperatures across the globe. This has led to melting ice caps, rising sea levels, and more frequent extreme weather events.', note: 'Climate topic', bangla_meaning: 'জলবায়ু পরিবর্তন আমাদের সময়ের সবচেয়ে গুরুত্বপূর্ণ সমস্যাগুলোর একটি। বিজ্ঞানীরা বিশ্বজুড়ে তাপমাত্রা বৃদ্ধি লক্ষ্য করেছেন। এর ফলে বরফ গলছে, সমুদ্রপৃষ্ঠ বাড়ছে এবং চরম আবহাওয়া বেশি ঘটছে।' },
  { category: 'passage', difficulty: 'medium', correct_text: 'Good morning everyone. Today we will discuss the importance of time management. Please take out your notebooks and write down the key points.', note: 'Classroom instruction', bangla_meaning: 'সবাইকে শুভ সকাল। আজ আমরা সময় ব্যবস্থাপনার গুরুত্ব নিয়ে আলোচনা করবো। দয়া করে খাতা বের করো এবং মূল পয়েন্টগুলো লিখে রাখো।' },
];

const insertItem = db.prepare('INSERT OR IGNORE INTO listening_items (category, difficulty, correct_text, normalized_text, bangla_meaning, note, tts_enabled, punctuation_mode, capitalization_mode, active, created_by) VALUES (?, ?, ?, ?, ?, ?, 1, \'flexible\', \'flexible\', 1, 1)');
for (const item of items) { insertItem.run(item.category, item.difficulty, item.correct_text, normalizeText(item.correct_text, { punctuationMode: 'flexible', capitalizationMode: 'flexible' }), item.bangla_meaning || null, item.note); }

console.log('✅ Database seeded successfully!');
console.log('\n📋 Demo Credentials:');
console.log('   Admin: admin@proenglishbd.com / admin123');
console.log('   Student: student@proenglishbd.com / student123');
console.log(`\n📦 Items seeded: ${items.length}`);
