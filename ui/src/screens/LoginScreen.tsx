import React, { useState } from 'react';
import { fetchNui, isDevMode } from '../utils/nui';
import { FormInput } from '../components/FormInput';

interface LoginScreenProps {
    onLogin: (user?: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isDevMode()) {
                onLogin({ username: username || 'dev_user', display_name: displayName || 'Dev User' });
                return;
            }

            if (isLogin) {
                if (!username.trim() || !password.trim()) {
                    setError('Username and password are required.');
                    setLoading(false);
                    return;
                }
                const result = await fetchNui<any>('login', { username: username.trim(), password: password.trim() });
                if (result.success) {
                    onLogin(result.user);
                } else {
                    setError(result.message || 'Login failed. Please register first.');
                }
            } else {
                if (!username.trim()) {
                    setError('Username is required.');
                    setLoading(false);
                    return;
                }
                if (!password.trim()) {
                    setError('Password is required.');
                    setLoading(false);
                    return;
                }
                const result = await fetchNui<any>('register', {
                    username: username.trim(),
                    password: password.trim(),
                    displayName: displayName.trim() || username.trim()
                });
                if (result.success) {
                    onLogin(result.user);
                } else {
                    setError(result.message || 'Registration failed.');
                }
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white">
            <div className="flex-1 px-8 py-4 overflow-y-auto flex flex-col items-center">
                {/* Logo Area */}
                <div className="flex justify-center items-center space-x-2 mt-16 mb-4">
                    <div className="bg-orange-500 p-2 rounded-xl text-white">
                         <span className="material-symbols-rounded text-3xl">lock_open</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-orange-500">Privy</h1>
                </div>

                <h2 className="text-xl font-semibold text-gray-800 text-center mb-8 leading-tight max-w-[260px]">
                    Sign up to support your favorite creators
                </h2>

                {/* Toggle */}
                <div className="flex bg-gray-100 p-1 rounded-xl mb-8 relative w-full gap-2">
                    <button
                        onClick={() => { setIsLogin(true); setError(''); }}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                    >
                        Log in
                    </button>
                    <button
                        onClick={() => { setIsLogin(false); setError(''); }}
                        className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${!isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                    >
                        Register
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 w-full">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form className="space-y-5 w-full" onSubmit={handleSubmit}>
                    <FormInput
                        label="Username"
                        value={username}
                        onChange={setUsername}
                        placeholder={isLogin ? "Your username" : "Choose a username"}
                    />
                    <FormInput
                        label="Password"
                        value={password}
                        onChange={setPassword}
                        type="password"
                        placeholder="Your password"
                    />
                    {!isLogin && (
                        <FormInput
                            label="Display Name"
                            value={displayName}
                            onChange={setDisplayName}
                            placeholder="Your display name"
                        />
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-orange-500 text-white py-4 rounded-full font-bold uppercase tracking-widest text-sm mt-6 shadow-lg shadow-orange-200 active:scale-[0.98] transition-all hover:bg-orange-600 disabled:opacity-50"
                    >
                        {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
                    </button>
                </form>
            </div>
        </div>
    );
};
