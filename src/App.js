import React, { lazy, useEffect , useState } from 'react'
import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import { themeChange } from 'theme-change'
import WebcamTest from './components/WebcamTest';

// Importing pages
const Layout = lazy(() => import('./containers/Layout'))
const Test = lazy(() => import('./components/WebcamTest'))


function App() {
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    themeChange(false);
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
    setCurrentTheme("light");
  }, [])


  return (
    <>
      <Router>
        <Routes>
          
          <Route path="/" element={<Layout />} />
          <Route path="/test" element={<Test />} />

        </Routes>
      </Router>
    </>
  )
}

export default App
