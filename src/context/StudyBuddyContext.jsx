import { createContext, useContext, useState, useEffect } from 'react';
import { studyBuddies, getRandomMessage } from '../utils/studyBuddyData';

const StudyBuddyContext = createContext(null);

export const StudyBuddyProvider = ({ children }) => {
  const [studyBuddy, setStudyBuddyState] = useState(() => {
    const saved = localStorage.getItem('assigntify_study_buddy');
    return saved && studyBuddies[saved] ? saved : 'cat';
  });

  useEffect(() => {
    localStorage.setItem('assigntify_study_buddy', studyBuddy);
  }, [studyBuddy]);

  const setStudyBuddy = (buddyId) => {
    if (studyBuddies[buddyId]) {
      setStudyBuddyState(buddyId);
    }
  };

  const getBuddyData = () => studyBuddies[studyBuddy];

  const getBuddyMessage = () => getRandomMessage(studyBuddy);

  return (
    <StudyBuddyContext.Provider value={{
      studyBuddy,
      setStudyBuddy,
      getBuddyData,
      getBuddyMessage,
    }}>
      {children}
    </StudyBuddyContext.Provider>
  );
};

export const useStudyBuddy = () => {
  const context = useContext(StudyBuddyContext);
  if (!context) {
    throw new Error('useStudyBuddy must be used within a StudyBuddyProvider');
  }
  return context;
};