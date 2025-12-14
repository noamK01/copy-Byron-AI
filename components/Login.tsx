import React, { useState } from 'react';
import { APP_NAME } from '../constants';
import { User } from '../types';
import { LogIn, Eye, EyeOff, CheckCircle, ArrowRight, KeyRound } from 'lucide-react';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
  // Removed onRegister prop
  onResetPassword: (email: string, newPass: string) => void;
}

type ViewState = 'login' | 'forgot-password' | 'verify-code';

const Login: React.FC<LoginProps> = ({ users, onLogin, onResetPassword }) => {
  const [viewState, setViewState] = useState<ViewState>('login');
  
  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
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

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.email === email);
    if (!user) {
        setError('המייל/שם המשתמש לא נמצא במערכת');
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

  const resetForm = () => {
    setError('');
    setSuccessMsg('');
    setEmail('');
    setPassword('');
    setResetCode('');
    setNewPassword('');
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
                    type="text" 
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
              </form>
            )}

            {/* FORGOT PASSWORD & RESET */}
            {viewState === 'forgot-password' && (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-6 animate-fade-in">
                     <p className="text-sm text-gray-600 text-center">הזן את שם המשתמש שלך ונשלח לך קוד לאיפוס סיסמה</p>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">אימייל / שם משתמש</label>
                        <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white/50 focus:bg-white" required />
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
                        קוד אימות נשלח. (לצורך ההדגמה הקוד הוא: <b>{generatedCode}</b>)
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