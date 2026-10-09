import React, { useState } from 'react';
import SupportRegisterPanel from '../components/SupportRegisterPanel';
import SupportQueryPanel from '../components/SupportQueryPanel';

const SupportTicketPage: React.FC = () => {
  const [activeTabMobile, setActiveTabMobile] = useState<'register' | 'query'>('register');

  return (
    <div className="flex min-h-screen w-full lg:overflow-hidden overflow-y-auto bg-white font-sans">
      <SupportRegisterPanel activeTabMobile={activeTabMobile} setActiveTabMobile={setActiveTabMobile} />
      <SupportQueryPanel activeTabMobile={activeTabMobile} setActiveTabMobile={setActiveTabMobile} />
    </div>
  );
};

export default SupportTicketPage;
