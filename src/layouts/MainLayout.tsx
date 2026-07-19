import React from 'react'
import { Outlet } from 'react-router-dom'
import '../styles/globals.css'

interface MainLayoutProps {
  children?: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="app-container">
      {children}
      <Outlet />
    </div>
  )
}
