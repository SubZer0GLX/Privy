import React, { ReactNode, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Frame from './components/Frame'

import './index.css'

const devMode = !(window as any)?.['invokeNative']
const root = ReactDOM.createRoot(document.getElementById('root')!)

const AppProvider = ({ children }: { children: ReactNode }) => {
    if (devMode) {
        const handleResize = () => {
            const { innerWidth, innerHeight } = window

            const aspectRatio = innerWidth / innerHeight
            const phoneAspectRatio = 27.6 / 59

            if (phoneAspectRatio < aspectRatio) {
                document.documentElement.style.fontSize = '1.66vh'
            } else {
                document.documentElement.style.fontSize = '3.4vw'
            }
        }

        useEffect(() => {
            window.addEventListener('resize', handleResize)

            return () => {
                window.removeEventListener('resize', handleResize)
            }
        }, [])

        handleResize()

        return (
            <div className="dev-wrapper">
                <Frame>{children}</Frame>
            </div>
        )
    } else return <>{children}</>
}

if (window.name === '' || devMode) {
    const renderApp = () => {
        root.render(
            <AppProvider>
                <App />
            </AppProvider>
        )
    }

    if (devMode) {
        renderApp()
    } else {
        window.addEventListener('message', (event) => {
            if (event.data === 'componentsLoaded') renderApp()
        })
    }
}
