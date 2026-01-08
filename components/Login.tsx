
import React, { useState } from 'react';
import { Lock, Mail, Loader2 } from 'lucide-react';

interface Props {
  onLoginSuccess: () => void;
}

export const Login: React.FC<Props> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const ADM_EMAIL = 'contatorafaelrds@gmail.com';
    const ADM_PASS = '24510622@Rds';

    setTimeout(() => {
      if (email === ADM_EMAIL && password === ADM_PASS) {
        onLoginSuccess();
      } else {
        setError('Acesso negado. Credenciais inválidas.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-orange-500 rounded-[2.5rem] flex items-center justify-center font-black text-black text-4xl shadow-2xl mx-auto mb-6">A</div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Alfare Imob</h1>
          <p className="text-orange-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2">Marketing AI Admin</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#1E293B] p-8 rounded-[3rem] shadow-2xl border border-gray-800 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">E-mail</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><Mail size={20} /></span>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-[#0F172A] border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none text-white font-medium transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Senha</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><Lock size={20} /></span>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-[#0F172A] border-2 border-transparent focus:border-orange-500 rounded-2xl outline-none text-white font-medium transition-all"
              />
            </div>
          </div>

          {error && <div className="text-red-500 text-xs font-bold text-center">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 text-black font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  );
};
