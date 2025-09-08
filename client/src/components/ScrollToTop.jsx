import { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { pathname } = useLocation();

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Show button when page is scrolled down
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Scroll to top smoothly with animation
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // return (
  //   // <div className="fixed bottom-5 right-5 z-50">
  //   //   {isVisible && (
  //   //     <button 
  //   //       onClick={scrollToTop} 
  //   //       className="bg-red-600 hover:bg-red-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all duration-300 transform hover:-translate-y-1 active:translate-y-0"
  //   //       aria-label="Scroll to top"
  //   //     >
  //   //       <FaArrowUp className="text-xl" />
  //   //     </button>
  //   //   )}
  //   // </div>
  // );
};

export default ScrollToTop;
