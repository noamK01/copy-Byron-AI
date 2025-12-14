import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { User, CallLog, CallOutcome } from './types';
import { MOCK_USERS } from './constants';

// רכיב פשוט ללכידת שגיאות
const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // useEffect to catch uncaught errors during rendering or in event handlers
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setErrorDetails(event.message || "שגיאה בלתי צפויה התרחשה.");
      event.preventDefault(); // מונע קריסה מוחלטת של הדפדפן
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // componentDidCatch equivalent for React components (if using class components)
  // For functional components, we rely on the window.addEventListener approach for now.
  // In a more robust solution, you might wrap a class component with a state for error.

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-red-50 text-red-800 border-2 border-red-400 rounded-lg m-4 shadow-lg text-center font-rubik">
        <h2 className="text-3xl font-bold mb-4">🚨 שגיאת ריצה (Vercel Runtime Error) 🚨</h2>
        <p className="text-lg mb-2">נראה שהקוד קרס לאחר הטעינה. סביר להניח שזו שגיאה שלא טופלה (כמו מפתח API חסר).</p>
        <p className="text-xl font-semibold mb-4">הודעת שגיאה: <strong className="break-all">{errorDetails}</strong></p>
        <p className="text-md mb-2">אנא בדוק את <strong className="font-bold">משתני הסביבה (Environment Variables)</strong> (ודא ש-<code className="bg-red-100 p-1 rounded">API_KEY</code> מוגדר).</p>
        <p className="text-md">כמו כן, בדוק את <strong className="font-bold">קונסולת הדפדפן</strong> (F12) לפרטים נוספים.</p>
      </div>
    );
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  
  // Lifted state for calls
  const [calls, setCalls] = useState<CallLog[]>([]);

  // --- הוספת בדיקת API Key בזמן ריצה ---
  useEffect(() => {
    // The API key is expected to be available in the execution environment
    // as process.env.API_KEY.
    const apiKey = process.env.API_KEY; 
    if (!apiKey) {
      // אם המפתח חסר, זורקים שגיאה כדי שה-ErrorBoundary ילכוד אותה
      // זו דוגמה לשגיאה קריטית שעלולה לקרות בפריסה.
      throw new Error("מפתח API עבור Gemini חסר. הגדר את 'API_KEY' במשתני הסביבה.");
    }
  }, []);
  // ------------------------------------

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleRegister = (newUser: User) => {
    setUsers((prevUsers) => [...prevUsers, newUser]);
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

  const handleDeleteUser = (userId: string) => {
    if (currentUser?.id === userId) {
        alert("לא ניתן למחוק את המשתמש של עצמך");
        return;
    }
    if (window.confirm("האם אתה בטוח שברצונך למחוק משתמש זה? כל הנתונים שלו יישמרו במערכת אך הוא לא יוכל להתחבר.")) {
        setUsers((prevUsers) => prevUsers.filter(u => u.id !== userId));
    }
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
          onRegisterUser={handleRegister} // Pass registration function to dashboard
          onDeleteUser={handleDeleteUser} // Pass delete function to dashboard
        />
      )}
    </div>
  );
};

// עוטף את כל האפליקציה ב-ErrorBoundary
const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
}

export default App;