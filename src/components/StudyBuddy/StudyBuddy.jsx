import { useState, useEffect } from 'react';
import { useStudyBuddy } from '../../context/StudyBuddyContext';
import { getRandomMessage } from '../../utils/studyBuddyData';
import './StudyBuddy.css';

const StudyBuddyCard = () => {
  const { studyBuddy, getBuddyData } = useStudyBuddy();
  const buddy = getBuddyData();
  const [message, setMessage] = useState(() => getRandomMessage(studyBuddy));

  useEffect(() => {
    setMessage(getRandomMessage(studyBuddy));
  }, [studyBuddy]);

  const refreshMessage = () => {
    setMessage(getRandomMessage(studyBuddy));
  };

  return (
    <div className="sidebar-buddy-card" onClick={refreshMessage} title="Click for a new message">
      <span className="sidebar-buddy-label">Your Study Buddy</span>
      <div className="sidebar-buddy-main">
        <span className="sidebar-buddy-emoji">{buddy.emoji}</span>
        <span className="sidebar-buddy-name">{buddy.name}</span>
      </div>
      <p className="sidebar-buddy-message">&ldquo;{message}&rdquo;</p>
    </div>
  );
};

export default StudyBuddyCard;