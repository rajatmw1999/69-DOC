import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Landing from './pages/Landing.jsx'
import Contact from './pages/Contact.jsx'
import Auth from './pages/Auth.jsx'
import Pricing from './pages/Pricing.jsx'
import AppShell from './components/AppShell.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Simulator from './pages/Simulator.jsx'
import Arena from './pages/Arena.jsx'
import Characters from './pages/Characters.jsx'
import Challenges from './pages/Challenges.jsx'
import Scenarios from './pages/Scenarios.jsx'
import Review from './pages/Review.jsx'
import Debrief from './pages/Debrief.jsx'
import Academy from './pages/Academy.jsx'
import AcademyModule from './pages/AcademyModule.jsx'
import Coach from './pages/Coach.jsx'
import Daily from './pages/Daily.jsx'
import Analytics from './pages/Analytics.jsx'
import Community from './pages/Community.jsx'
import Toolkit from './pages/Toolkit.jsx'
import Settings from './pages/Settings.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="simulator" element={<Simulator />} />
          <Route path="arena" element={<Arena />} />
          <Route path="characters" element={<Characters />} />
          <Route path="challenges" element={<Challenges />} />
          <Route path="scenarios" element={<Scenarios />} />
          <Route path="review" element={<Review />} />
          <Route path="review/:callId" element={<Review />} />
          <Route path="debrief" element={<Debrief />} />
          <Route path="academy" element={<Academy />} />
          <Route path="academy/:moduleId" element={<AcademyModule />} />
          <Route path="coach" element={<Coach />} />
          <Route path="daily" element={<Daily />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="community" element={<Community />} />
          <Route path="toolkit" element={<Toolkit />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Landing />} />
      </Routes>
    </>
  )
}
