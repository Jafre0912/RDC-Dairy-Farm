import React from 'react';
import { Outlet } from 'react-router-dom';
import ChatBot from './components/shared/ChatBot';

const AppLayout = () => {
  return (
    <>
      <Outlet />
      <ChatBot />
    </>
  );
};

export default AppLayout; 