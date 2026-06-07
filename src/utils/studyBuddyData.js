// Study Buddy companion data and messages

export const studyBuddies = {
  cat: {
    id: 'cat',
    name: 'Study Cat',
    emoji: '🐱',
    personality: 'Calm & Focused',
    messages: [
      'One step at a time.',
      'Stay in the zone.',
      'Quiet focus wins.',
      'Paws and reflect.',
      'Slow and steady progress.',
      'You\'re doing purrfectly.',
    ],
  },
  dog: {
    id: 'dog',
    name: 'Study Dog',
    emoji: '🐶',
    personality: 'Energetic & Motivating',
    messages: [
      "Let's get moving!",
      'You\'ve got this, champ!',
      'Crush it today!',
      'Tail-wagging progress!',
      'Every rep counts — keep going!',
      'Who\'s a productive student? You are!',
    ],
  },
  bunny: {
    id: 'bunny',
    name: 'Study Bunny',
    emoji: '🐰',
    personality: 'Gentle & Supportive',
    messages: [
      'You\'re doing great.',
      'Hop to it, gently.',
      'Every step counts.',
      'Be kind to yourself today.',
      'Small hops lead to big leaps.',
      'You\'re blooming beautifully.',
    ],
  },
};

export const buddyList = Object.values(studyBuddies);

export const getRandomMessage = (buddyId) => {
  const buddy = studyBuddies[buddyId];
  if (!buddy) return '';
  return buddy.messages[Math.floor(Math.random() * buddy.messages.length)];
};