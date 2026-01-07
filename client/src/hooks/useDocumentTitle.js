import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | MovieApp` : 'MovieApp';
  }, [title]);
};

export default useDocumentTitle;
