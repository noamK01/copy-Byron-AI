import React, { useState } from 'react';
import { APP_NAME } from '../constants';
import { User } from '../types';
import { LogIn, UserPlus, Eye, EyeOff, CheckCircle, ArrowRight, KeyRound, Shield, X } from 'lucide-react'; // Changed ShieldLock to Shield

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
  onResetPassword: (email: string, newPass: string) => void;
}

type ViewState = 'login' | 'register' | 'admin-check' | 'register-admin' | 'forgot-password' | 'verify-code';

const Login: React.FC<LoginProps> = ({ users, onLogin, onRegister, onResetPassword }) => {
  const [viewState, setViewState] = useState<ViewState>('login');
  
  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Admin Master Credentials Fields
  const [masterUser, setMasterUser] = useState('');
  const [masterPass, setMasterPass] = useState('');
  
  // Password Reset Fields
  const [resetCode, setResetCode] = useState(''); 
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Simple authentication
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError('שם משתמש או סיסמה שגויים');
    }
  };

  const handleMasterAdminCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Hardcoded Master Credentials as requested
    if (masterUser === 'admin123' && masterPass === '123') {
        setViewState('register-admin');
        resetForm(false); // Clear master fields but keep clean state
    } else {
        setError('פרטי גישה למנהל שגויים');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent, role: 'admin' | 'agent') => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      setError('כתובת האימייל כבר קיימת במערכת');
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      password,
      role: role
    };
    
    setSuccessMsg(`משתמש ${role === 'admin' ? 'מנהל' : ''} נוצר בהצלחה! מתחבר...`);
    setTimeout(() => {
      onRegister(newUser);
    }, 1500);
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.email === email);
    if (!user) {
        setError('המייל לא נמצא במערכת');
        return;
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(code);
    alert(`קוד האימות שלך הוא: ${code}`); 
    setViewState('verify-code');
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (resetCode !== generatedCode) {
        setError('קוד האימות שגוי');
        return;
    }

    if (newPassword.length < 3) {
        setError('סיסמה חייבת להכיל לפחות 3 תווים');
        return;
    }

    onResetPassword(email, newPassword);
    setSuccessMsg('הסיסמה שונתה בהצלחה! מתחבר...');
    
    setTimeout(() => {
        const updatedUser = users.find(u => u.email === email);
        if (updatedUser) {
            onLogin({ ...updatedUser, password: newPassword });
        }
    }, 1500);
  };

  const resetForm = (full = true) => {
    setError('');
    setSuccessMsg('');
    if (full) {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setMasterUser('');
        setMasterPass('');
        setResetCode('');
        setNewPassword('');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=1969&auto=format&fit=crop')"
      }}
    >
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]"></div>

      <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-700 mb-2">{APP_NAME}</h1>
          <p className="text-gray-500">
            {viewState === 'login' && 'כניסה למערכת'}
            {viewState === 'register' && 'הרשמה לנציג חדש'}
            {viewState === 'admin-check' && 'בדיקת הרשאת מנהל'}
            {viewState === 'register-admin' && 'יצירת משתמש מנהל'}
            {viewState === 'forgot-password' && 'שחזור סיסמה'}
            {viewState === 'verify-code' && 'קביעת סיסמה חדשה'}
          </p>
        </div>

        {successMsg ? (
          <div className="text-center py-10 animate-fade-in">
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">פעולה בוצעה בהצלחה!</h3>
            <p className="text-gray-600 mt-2">{successMsg}</p>
          </div>
        ) : (
          <>
            {/* LOGIN FORM */}
            {viewState === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אימייל / שם משתמש</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white/50 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">סיסמה</label>
                      <button 
                        type="button" 
                        onClick={() => { resetForm(); setViewState('forgot-password'); }}
                        className="text-xs text-purple-600 hover:underline"
                      >
                        שכחתי סיסמה?
                      </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition bg-white/50 focus:bg-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                {error && <div className="text-red-500 text-sm text-center bg-red-50/80 p-2 rounded">{error}</div>}
                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition duration-200 font-bold shadow-lg shadow-purple-200">
                  <LogIn size={20} /> כניסה למערכת
                </button>
                
                <div className="space-y-3 mt-6 pt-6 border-t border-gray-200/50">
                    <div className="text-center">
                        <p className="text-gray-600 text-sm mb-1">אין לך עדיין משתמש?</p>
                        <button onClick={() => { resetForm(); setViewState('register'); }} className="text-purple-600 font-bold hover:underline">צור משתמש חדש</button>
                    </div>
                    <div className="text-center">
                        <button onClick={() => { resetForm(); setViewState('admin-check'); }} className="text-xs text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1 mx-auto mt-2">
                            <Shield size={12} /> {/* Using Shield icon */}
                            כניסה להרשמת מנהלים
                        </button>
                    </div>
                </div>
              </form>
            )}

            {/* ADMIN CHECK (MASTER CREDENTIALS) */}
            {viewState === 'admin-check' && (
               <form onSubmit={handleMasterAdminCheck} className="space-y-6 animate-fade-in relative">
                 <button type="button" onClick={() => { resetForm(); setViewState('login'); }} className="absolute -top-12 -left-2 text-gray-400 hover:text-gray-600">
                    <X size={20} />
                 </button>
                 <div className="bg-slate-100 p-4 rounded-lg text-sm text-slate-600 text-center mb-4">
                    אנא הזן את פרטי הגישה הראשיים כדי ליצור משתמש מנהל חדש.
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם משתמש ראשי</label>
                    <input type="text" value={masterUser} onChange={(e) => setMasterUser(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white/50 focus:bg-white" placeholder="admin123" required />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה ראשית</label>
                    <input type="password" value={masterPass} onChange={(e) => setMasterPass(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white/50 focus:bg-white" placeholder="123" required />
                 </div>
                 {error && <div className="text-red-500 text-sm text-center bg-red-50/80 p-2 rounded">{error}</div>}
                 <button type="submit" className="w-full flex items-center justify-center gap-2 bg-slate-700 text-white py-3 rounded-lg hover:bg-slate-800 transition duration-200 font-bold shadow-lg">
                    <Shield size={20} /> אימות הרשאה
                 </button>
               </form>
            )}

            {/* REGISTER FORM (Generic for Agent or Admin) */}
            {(viewState === 'register' || viewState === 'register-admin') && (
               <form onSubmit={(e) => handleRegisterSubmit(e, viewState === 'register-admin' ? 'admin' : 'agent')} className="space-y-6 animate-fade-in">
                {viewState === 'register-admin' && (
                    <div className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded inline-block mb-2">
                        הרשמה כמשתמש מנהל
                    </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white/50 focus:bg-white" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white/50 focus:bg-white" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white/50 focus:bg-white" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">אימות סיסמה</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white/50 focus:bg-white" required />
                    </div>
                </div>

                {error && <div className="text-red-500 text-sm text-center bg-red-50/80 p-2 rounded">{error}</div>}
                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition duration-200 font-bold shadow-lg shadow-purple-200">
                  <UserPlus size={20} /> {viewState === 'register-admin' ? 'צור מנהל' : 'הרשמה'}
                </button>
                <div className="text-center border-t border-gray-200/50 pt-4 mt-4">
                    <button onClick={() => { resetForm(); setViewState('login'); }} className="text-purple-600 font-bold hover:underline">חזרה לכניסה</button>
                </div>
               </form>
            )}

            {/* FORGOT PASSWORD & RESET */}
            {viewState === 'forgot-password' && (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-6 animate-fade-in">
                     <p className="text-sm text-gray-600 text-center">הזן את כתובת האימייל שלך ונשלח לך קוד לאיפוס סיסמה</p>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white/50 focus:bg-white" required />
                    </div>
                    {error && <div className="text-red-500 text-sm text-center bg-red-50/80 p-2 rounded">{error}</div>}
                    <button type="submit" className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-bold shadow-lg">
                        שלח קוד אימות <ArrowRight size={18} />
                    </button>
                    <button type="button" onClick={() => { resetForm(); setViewState('login'); }} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2">ביטול</button>
                </form>
            )}

            {viewState === 'verify-code' && (
                 <form onSubmit={handleResetPasswordSubmit} className="space-y-6 animate-fade-in">
                    <div className="bg-yellow-50/90 p-3 rounded-lg text-yellow-800 text-sm text-center mb-4 border border-yellow-200">
                        קוד אימות נשלח למייל. (לצורך ההדגמה הקוד הוא: <b>{generatedCode}</b>)
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">קוד אימות</label>
                       <input type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-center tracking-widest text-lg font-bold bg-white/50 focus:bg-white" required />
                   </div>
                   <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
                       <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white/50 focus:bg-white" required />
                   </div>
                   {error && <div className="text-red-500 text-sm text-center bg-red-50/80 p-2 rounded">{error}</div>}
                   <button type="submit" className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold shadow-lg">
                       <KeyRound size={18} /> אפס סיסמה
                   </button>
                </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Login;