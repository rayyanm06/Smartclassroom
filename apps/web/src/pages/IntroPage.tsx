import { useEffect } from 'react';
import { IntroRoot } from '../components/intro/IntroRoot';

export function IntroPage() {
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'Smart Classroom — System Architecture';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  return <IntroRoot />;
}

export default IntroPage;
