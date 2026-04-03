import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { EntrancePage } from './pages/EntrancePage';
import { TeachingPage } from './pages/TeachingPage';
import { ChoicePage } from './pages/ChoicePage';
import { InputPage } from './pages/InputPage';
import { CastingPage } from './pages/CastingPage';
import { QuestionPage } from './pages/QuestionPage';
import { ResultPage } from './pages/ResultPage';
import { createOracleSession } from './lib/oracleSession';
import type { OracleInputs, OracleMethod, OracleSession } from './types/oracle';

type PageType = 'entrance' | 'teaching' | 'choice' | 'input' | 'casting' | 'question' | 'result';

function App() {
  const [page, setPage] = useState<PageType>('entrance');
  const [choiceType, setChoiceType] = useState<OracleMethod | null>(null);
  const [session, setSession] = useState<OracleSession | null>(null);
  const [question, setQuestion] = useState('');

  const handleEntranceComplete = () => {
    localStorage.setItem('oracleYiVisited', 'true');
    setPage('teaching');
  };

  const handleTeachingContinue = () => {
    setPage('choice');
  };

  const handleChoiceSelect = (choice: OracleMethod) => {
    setChoiceType(choice);
    setPage('input');
  };

  const handleInputComplete = (inputs: OracleInputs, prebuiltSession?: OracleSession) => {
    if (prebuiltSession) {
      setSession(prebuiltSession);
    } else {
      setSession(createOracleSession(inputs));
    }
    setPage('casting');
  };

  const handleCastingContinue = () => {
    setPage('question');
  };

  const handleSubmitQuestion = (q: string) => {
    setQuestion(q);
    setPage('result');
  };

  const handleRestart = () => {
    setPage('entrance');
    setChoiceType(null);
    setSession(null);
    setQuestion('');
  };

  return (
    <div className="w-full h-full bg-oracle-bg">
      <AnimatePresence mode="wait">
        {page === 'entrance' && (
          <EntrancePage key="entrance" onComplete={handleEntranceComplete} />
        )}
        {page === 'teaching' && (
          <TeachingPage key="teaching" onContinue={handleTeachingContinue} />
        )}
        {page === 'choice' && (
          <ChoicePage key="choice" onSelectChoice={handleChoiceSelect} />
        )}
        {page === 'input' && choiceType && (
          <InputPage
            key="input"
            choiceType={choiceType}
            onComplete={handleInputComplete}
          />
        )}
        {page === 'casting' && session && (
          <CastingPage key="casting" session={session} onContinue={handleCastingContinue} />
        )}
        {page === 'question' && (
          <QuestionPage key="question" onSubmit={handleSubmitQuestion} />
        )}
        {page === 'result' && session && (
          <ResultPage key="result" session={session} question={question} onRestart={handleRestart} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
