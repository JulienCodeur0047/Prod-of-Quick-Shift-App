import React, { useState } from 'react';
import { useMobileAuth } from '../../contexts/MobileAuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Logo from '../Logo';
import { Loader2 } from 'lucide-react';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeToggle from '../ThemeToggle';

const MobileLogin: React.FC = () => {
    const { login } = useMobileAuth();
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        const success = await login(email, accessCode);
        if (!success) {
            setError(t('mobile.loginError'));
        }
        setIsLoading(false);
    };

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 bg-slate-100 dark:bg-blue-night-950">
            <div className="absolute top-4 right-4 flex items-center space-x-2">
                <LanguageSwitcher />
                <ThemeToggle />
            </div>
            <div className="w-full max-w-sm mx-auto text-center">
                <Logo className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400" />
                <h1 className="mt-4 text-2xl font-bold text-slate-800 dark:text-slate-100">{t('mobile.loginTitle')}</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{t('mobile.loginSubtitle')}</p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('auth.emailLabel')}
                            required
                            className="w-full px-4 py-3 text-sm border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                    </div>
                    <div>
                        <input
                            type="text"
                            value={accessCode}
                            onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder={t('mobile.accessCodePlaceholder')}
                            required
                            maxLength={6}
                            pattern="\d{6}"
                            inputMode="numeric"
                            className="w-full px-4 py-3 text-sm border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                    </div>
                    
                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center px-4 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : t('mobile.loginButton')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default MobileLogin;