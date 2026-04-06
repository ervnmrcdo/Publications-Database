'use client'


import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from "@supabase/supabase-js";
import { login, LoginState, signup } from './actions'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (formData: FormData) => {
    setIsLoading(true)
    const result: LoginState = await login({ error: undefined }, formData)

    if (result.successPath) {
      // swindow.location.reload()
      router.push(result.successPath)
      router.refresh()
    } else if (result.error) {
      alert(result.error)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">DCS Records</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {/* Form Container */}
        <div className="bg-[#1b1e2b] rounded-lg p-8 border border-gray-700">
          <form className="space-y-6">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="your@email.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="••••••••"
              />
            </div>

            {/* Buttons */}
            <div className="space-y-3 pt-4">
              <button
                formAction={handleLogin}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-2 rounded-lg transition duration-200"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
              <button
                type="button"
                disabled={isLoading}
                className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-semibold py-2 rounded-lg transition duration-200"
                onClick={() => router.push('/signup')}
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
