import React, { useEffect } from "react";

const AssesmentWelcome = ({ subject, setMessages, setChapter, getStarter }) => {

    
  useEffect(() => {
    const fetchInitialAssessment = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/assessment/get-initial-response/${subject}`);
        const data = await response.json();

        // Add initial assistant message if it's not a duplicate
        if (data?.response && data.response !== getStarter('assessment')) {
          setMessages(prev => [
            ...prev,
            { role: 'assistant', content: data.response, images: [] }
          ]);
        }

        let chaptersData = data?.data || [];

        // Transform English data to have 'chapters' array
        if (subject === 'english') {
          const unitsMap = {};
          chaptersData.forEach(item => {
            const unitKey = item.Unit_Name || `Unit ${item.Unit_No}`;
            if (!unitsMap[unitKey]) unitsMap[unitKey] = { unit: unitKey, chapters: [] };
            unitsMap[unitKey].chapters.push({ title: item.Lesson_Name });
          });
          chaptersData = Object.values(unitsMap);
        }

        setChapter(chaptersData);
        console.log('Assessment Chapters:', chaptersData);

      } catch (error) {
        console.error('Error fetching assessment initial message:', error);
      }
    };

    fetchInitialAssessment();
  }, [subject, setMessages, setChapter, getStarter]);

  return (
    
    <></>
  );
};

export default AssesmentWelcome;
