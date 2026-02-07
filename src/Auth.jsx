import { useState } from 'react'
import { supabase } from './services/supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isSignUp, setIsSignUp] = useState(false) // Toggle between Login and Sign Up

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    if (isSignUp) {
      // SIGN UP LOGIC
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName, // This goes to auth.users metadata
          },
        },
      })
      if (error) alert(error.message)
      else alert('Check your email for the confirmation link!')
    } else {
      // LOGIN LOGIC
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert(error.message)
    }

    setLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Calorie Counter Pro</h1>
        <p className="auth-subtitle">
          {isSignUp ? 'Create your account' : 'Log in to track your gains'}
        </p>
        
        <form onSubmit={handleLogin}>
          {/* NEW: Only show Full Name during Sign Up */}
          {isSignUp && (
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                placeholder="Jadon Jones" 
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)} 
              />
            </div>
          )}

          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              placeholder="j.jones@msu.edu" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <div className="auth-actions" style={{ flexDirection: 'column', gap: '10px' }}>
            <button 
              type="submit"
              disabled={loading} 
              className="btn-primary"
              style={{ width: '100%' }}
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Login'}
            </button>
            
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)} 
              className="btn-secondary"
              style={{ background: 'none', border: 'none', color: '#32d74b', textDecoration: 'underline' }}
            >
              {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}