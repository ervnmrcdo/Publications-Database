'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')

  const [first_name, setFirstName] = useState<string | null>(null)
  const [middle_name, setMiddleName] = useState<string | null>(null)
  const [last_name, setLastName] = useState<string | null>(null)
  const [university, setUniversity] = useState<string | null>(null)
  const [college, setCollege] = useState<string | null>(null)
  const [department, setDepartment] = useState<string | null>(null)
  const [contact_number, setContactNumber] = useState<string | null>(null)
  const [position, setPosition] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    const user = data.user
    if (!user) {
      setError('Signup failed')
      setLoading(false)
      return
    }

    // 2. Upsert profile row
    const { error: insertError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email,
        role,
        first_name,
        middle_name,
        last_name,
        university,
        college,
        department,
        contact_number,
        position,
        email_address: user.email
      })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // 3. Redirect
    router.push('/login')
    alert('Account created successfully!')
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-300 flex items-center justify-center p-4">
      <a
        href="/user-manual.html"
        target="_blank"
        rel="noopener noreferrer"
        title="User Manual"
        className="fixed top-4 left-4 px-3 py-2 flex items-center justify-center rounded-full border border-gray-500 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition text-sm font-semibold"
      >
        User Manual
      </a>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">DCS Records</h1>
          <p className="text-gray-400">Create your account</p>
        </div>

        <div className="bg-[#1b1e2b] rounded-lg p-8 border border-gray-700">
          <form onSubmit={handleSignup} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-2">Role</label>
              <select
                id="role"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                required
              >
                <option value="">Select role</option>
                <option value="nonteaching">Student</option>
                <option value="teaching">Faculty</option>
              </select>
            </div>
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
              <input
                id="first_name"
                type="text"
                placeholder="First Name"
                onChange={e => setFirstName(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label htmlFor="middle_name" className="block text-sm font-medium text-gray-300 mb-2">Middle Name</label>
              <input
                id="middle_name"
                type="text"
                placeholder="Middle Name"
                onChange={e => setMiddleName(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
              <input
                id="last_name"
                type="text"
                placeholder="Last Name"
                onChange={e => setLastName(e.target.value)}
                required
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label htmlFor="university" className="block text-sm font-medium text-gray-300 mb-2">University</label>
              <input
                id="university"
                type="text"
                placeholder="University"
                onChange={e => setUniversity(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label htmlFor="college" className="block text-sm font-medium text-gray-300 mb-2">College</label>
              <input
                id="college"
                type="text"
                placeholder="College"
                onChange={e => setCollege(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-300 mb-2">Department</label>
              <input
                id="department"
                type="text"
                placeholder="Department"
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label htmlFor="contact_number" className="block text-sm font-medium text-gray-300 mb-2">Contact Number</label>
              <input
                id="contact_number"
                type="text"
                placeholder="Contact Number"
                onChange={e => setContactNumber(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-300 mb-2">Position</label>
              <input
                id="position"
                type="text"
                placeholder="Position"
                onChange={e => setPosition(e.target.value)}
                className="w-full px-4 py-2 bg-[#0f1117] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold py-2 rounded-lg transition duration-200"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
