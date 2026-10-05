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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
                    ApparelFlow ERP Gate
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                        {error}
                    </div>
                )}

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
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
                            className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
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
                            className="mt-1 block w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-900 dark:text-white sm:text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-8 border-t dark:border-gray-700 pt-6">
                    <p className="text-sm text-center font-semibold text-gray-500 dark:text-gray-400 mb-4">
                        Evaluator Demo Quick-Fill
                    </p>
                    <div className="space-y-2">
                        {demoAccounts.map(acc => (
                            <button
                                key={acc.email}
                                type="button"
                                className="w-full text-left px-4 py-2 border rounded text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex justify-between items-center"
                                onClick={() => fillDemo(acc.email, acc.password)}
                            >
                                <span>{acc.label}</span>
                                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded">{acc.role}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
