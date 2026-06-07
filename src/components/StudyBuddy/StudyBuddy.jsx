import { useState, useEffect } from 'react';
import { useStudyBuddy } from '../../context/StudyBuddyContext';
import { buddyList, getRandomMessage } from '../../utils/studyBuddyData';
import './StudyBuddy.css';

const StudyBuddyCard = () => {
  const { studyBuddy, setStudyBuddy, getBuddyData } = useStudyBuddy();
  const buddy = getBuddyData();
  const [message, setMessage] = useState(() => getRandomMessage(studyBuddy));
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setMessage(getRandomMessage(studyBuddy));
    setAnimKey(k => k + 1);
  }, [studyBuddy]);

  return (
    <div className="sidebar-buddy-card">
      <span className="sidebar-buddy-label">Your Study Buddy</span>

      {/* Selection pills */}
      <div className="sidebar-buddy-pills">
        {buddyList.map(b => (
          <button
            key={b.id}
            className={`sidebar-buddy-pill ${studyBuddy === b.id ? 'active' : ''}`}
            onClick={() => setStudyBuddy(b.id)}
          >
            <span className="sidebar-buddy-pill-emoji">{b.emoji}</span>
            <span className="sidebar-buddy-pill-text">{b.name.split(' ')[1]}</span>
          </button>
        ))}
      </div>

      {/* Large animated buddy display */}
      <div className="sidebar-buddy-display" key={animKey}>
        <span className="sidebar-buddy-large-emoji">{buddy.emoji}</span>
        <span className="sidebar-buddy-name">{buddy.name}</span>
        <span className="sidebar-buddy-personality">{buddy.personality}</span>
        <p className="sidebar-buddy-message">&ldquo;{message}&rdquo;</p>
      </div>
    </div>
  );
};

export default StudyBuddyCard;