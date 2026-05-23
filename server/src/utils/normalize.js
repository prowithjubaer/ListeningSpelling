function normalizeText(text, options = {}) {
  const { punctuationMode = 'flexible', capitalizationMode = 'flexible' } = options;
  let normalized = text.trim();
  normalized = normalized.replace(/\s+/g, ' ');
  normalized = normalized.replace(/[\u2018\u2019\u201A\u201B]/g, "'");
  normalized = normalized.replace(/[\u201C\u201D\u201E\u201F]/g, '"');
  normalized = normalized.replace(/[\u2013\u2014\u2015]/g, '-');
  normalized = normalized.replace(/\u2026/g, '...');
  if (capitalizationMode === 'flexible') { normalized = normalized.toLowerCase(); }
  if (punctuationMode === 'flexible') {
    normalized = normalized.replace(/(?<![a-zA-Z])'|'(?![a-zA-Z])/g, '');
    normalized = normalized.replace(/[.,!?;:"\-\(\)\[\]{}\/\\@#$%^&*~`]/g, '');
    normalized = normalized.replace(/\s+/g, ' ').trim();
  }
  return normalized;
}

function compareAnswers(studentAnswer, correctText, options = {}) {
  const normalizedStudent = normalizeText(studentAnswer, options);
  const normalizedCorrect = normalizeText(correctText, options);
  return normalizedStudent === normalizedCorrect;
}

function getDifferences(studentAnswer, correctAnswer) {
  const studentWords = studentAnswer.trim().split(/\s+/);
  const correctWords = correctAnswer.trim().split(/\s+/);
  const result = [];
  const maxLen = Math.max(studentWords.length, correctWords.length);
  for (let i = 0; i < maxLen; i++) {
    const studentWord = studentWords[i] || '';
    const correctWord = correctWords[i] || '';
    if (studentWord.toLowerCase() === correctWord.toLowerCase()) {
      result.push({ word: correctWord, status: 'correct', studentWord });
    } else if (!studentWord) {
      result.push({ word: correctWord, status: 'missing', studentWord: '' });
    } else if (!correctWord) {
      result.push({ word: studentWord, status: 'extra', studentWord });
    } else {
      result.push({ word: correctWord, status: 'wrong', studentWord });
    }
  }
  return result;
}

module.exports = { normalizeText, compareAnswers, getDifferences };
