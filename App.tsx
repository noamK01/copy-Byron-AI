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

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-red-50 text-red-800 border-2 border-red-400 rounded-lg m-4 shadow-lg text-center font-rubik">
        <h2 className="text-3xl font-bold mb-4">🚨 שגיאת ריצה (Vercel Runtime Error) 🚨</h2>
        <p className="text-lg mb-2">נראה שהקוד קרס לאחר הטעינה. סביר להניח שזו שגיאה שלא טופלה (כמו מפתח API חסר).</p>
        <p className="text-xl font-semibold mb-4">הודעת שגיאה: <strong className="break-all">{errorDetails}</strong></p>
        <p className="text-md mb-2">אנא בדוק את <strong className="font-bold">משתני הסביבה (Environment Variables)</strong> ב-Vercel (ודא ש-<code className="bg-red-100 p-1 rounded">VITE_GEMINI_API_KEY</code> מוגדר).</p>
        <p className="text-sm text-gray-700 mt-2">הערה: אם האפליקציה רצה ללא תהליך Build (למשל, ישירות מהדפדפן עם esm.sh), משתני import.meta.env לא יהיו זמינים.</p>
        <p className="text-md mt-4">כמו כן, בדוק את <strong className="font-bold">קונסולת הדפדפן</strong> (F12) לפרטים נוספים.</p>
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
    // ✅ תיקון: גישה בטוחה (Safe Access) למשתני הסביבה למניעת קריסה
    // השגיאה הקודמת קרתה כי import.meta.env היה undefined. 
    // כעת אנו בודקים אם הוא קיים לפני הגישה למפתח.
    
    let apiKey = '';
    
    try {
        // Cast import.meta to any to avoid TypeScript error "Property 'env' does not exist on type 'ImportMeta'"
        const meta = import.meta as any;
        if (meta && meta.env) {
            apiKey = meta.env.VITE_GEMINI_API_KEY;
        }
    } catch (e) {
        // התעלמות משגיאות גישה אם הסביבה לא תומכת ב-import.meta
    }

    // בדיקת fallback ל-process.env (למקרה שהסביבה תומכת בזה)
    if (!apiKey && typeof process !== 'undefined' && process.env) {
        apiKey = process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;
    }

    if (!apiKey) {
      // אם המפתח חסר, זורקים שגיאה כדי שה-ErrorBoundary ילכוד אותה (במקום לקרוס)
      throw new Error("מפתח API עבור Gemini חסר. לא נמצא ב-import.meta.env.VITE_GEMINI_API_KEY או process.env.API_KEY.");
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
          onRegisterUser={handleRegister} 
          onDeleteUser={handleDeleteUser} 
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