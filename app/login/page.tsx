'use client'

import { useState } from 'react'
import { login } from './actions'

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        const result = await login(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
    }

    const demoAccounts = [
        { label: 'Cutting Supervisor', email: 'cutting.super@apparelflow.com', role: 'cutting_supervisor', password: 'Cutting@12345' },
        { label: 'Cutting Verifier', email: 'cutting.verifier@apparelflow.com', role: 'cutting_verifier', password: 'Verifier@12345' },
        { label: 'Sewing Supervisor', email: 'sewing.super@apparelflow.com', role: 'sewing_supervisor', password: 'Sewing@12345' },
    ]

    const fillDemo = (demoEmail: string, demoPass: string) => {
        setEmail(demoEmail)
        setPassword(demoPass)
        setError(null)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="max-w-md w-full p-8 mx-4 glassmorphism rounded-2xl premium-shadow z-10 animate-fade-in">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-extrabold text-gradient tracking-tight">
                        ApparelFlow ERP
                    </h2>
                    <p className="text-sm tracking-wide text-gray-500 dark:text-gray-400 mt-2">
                        Premium Manufacturing Gateway
                    </p>
                </div>

                {error && (
                    <div className="mb-6 animate-fade-in p-4 bg-red-50/80 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                <form action={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value)
                                setError(null)
                            }}
                            className="block w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-gray-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            placeholder="user@apparelflow.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                                setError(null)
                            }}
                            className="block w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-gray-900 dark:text-white sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all transform hover:scale-[1.02]"
                    >
                        {loading ? 'Authenticating...' : 'Sign In securely'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700/50">
                    <p className="text-xs tracking-wider text-center font-bold text-gray-400 uppercase mb-4">
                        Evaluator Demo Access
                    </p>
                    <div className="space-y-3">
                        {demoAccounts.map(acc => (
                            <button
                                key={acc.email}
                                type="button"
                                className="w-full text-left px-4 py-3 bg-white/40 dark:bg-gray-800/40 border border-gray-200/50 dark:border-gray-700/50 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md transition-all flex justify-between items-center group"
                                onClick={() => fillDemo(acc.email, acc.password)}
                            >
                                <span className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{acc.label}</span>
                                <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full font-bold">{acc.role.replace('_', ' ')}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
