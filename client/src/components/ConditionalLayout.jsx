import React from 'react';
import useAuth from '../hooks/useAuth';
import Footer from './Footer';

const ConditionalLayout = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      {!isAdmin && <Footer />}
    </>
  );
};

export default ConditionalLayout;