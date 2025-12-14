import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User, CallLog, CallOutcome } from './types';
import { MOCK_USERS } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  
  // Lifted state for calls
  const [calls, setCalls] = useState<CallLog[]>([]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleRegister = (newUser: User) => {
    setUsers((prevUsers) => [...prevUsers, newUser]);
    setCurrentUser(newUser);
  };

  const handleResetPassword = (email: string, newPass: string) => {
    setUsers((prevUsers) => 
      prevUsers.map(u => u.email === email ? { ...u, password: newPass } : u)
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleUpdateUserRole = (userId: string, newRole: 'admin' | 'agent') => {
    setUsers((prevUsers) => 
      prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
    );
  };

  const handleAddCall = (outcome: CallOutcome) => {
    if (!currentUser) return;
    
    const newCall: CallLog = {
      id: Date.now().toString(),
      agentId: currentUser.id,
      agentName: currentUser.name,
      timestamp: Date.now(),
      outcome,
    };
    setCalls(prev => [...prev, newCall]);
  };

  // Filter calls for the specific logged-in user to display in Dashboard
  const userCalls = currentUser 
    ? calls.filter(call => call.agentId === currentUser.id)
    : [];

  return (
    <div className="font-sans antialiased text-gray-900">
      {!currentUser ? (
        <Login 
          users={users} 
          onLogin={handleLogin} 
          onRegister={handleRegister}
          onResetPassword={handleResetPassword}
        />
      ) : (
        <Dashboard 
          user={currentUser} 
          usersList={users} // Pass full user list for admin management
          onLogout={handleLogout} 
          calls={userCalls} // Pass ONLY user's calls for display
          allCalls={calls}  // Pass ALL calls for system-wide export calculations
          onAddCall={handleAddCall}
          onUpdateUserRole={handleUpdateUserRole}
        />
      )}
    </div>
  );
};

export default App;