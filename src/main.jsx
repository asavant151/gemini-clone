import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ContextProvider from './context/Context.jsx'
import { ClerkProvider } from '@clerk/clerk-react'
import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
  <SignedIn>
    <ContextProvider>
      <App />
    </ContextProvider>
  </SignedIn>
  <SignedOut>
    <div style={{display:'grid',placeItems:'center',minHeight:'100vh'}}>
      <SignIn routing="hash" afterSignInUrl="/" />
    </div>
  </SignedOut>
</ClerkProvider>,
)
