import { useEffect } from 'react'
import { FridgeContext, useFridgeStore } from './lib/store'
import { Wall } from './components/Wall'
import { Onboarding } from './components/Onboarding'
import { installManifest, registerServiceWorker } from './lib/pwa'

export default function App() {
  const store = useFridgeStore()

  // Runs once the URL is settled (resolveWallId() has already run inside
  // useFridgeStore, synchronously, before this effect fires), so the
  // install manifest always points at the actual household, not a fresh one.
  useEffect(() => {
    installManifest()
    registerServiceWorker()
  }, [])

  return (
    <FridgeContext.Provider value={store}>
      {store.loading ? (
        <div className="opening">
          <p className="t-page muted">Opening the fridge…</p>
        </div>
      ) : store.state.people.length === 0 ? (
        <Onboarding />
      ) : (
        <Wall />
      )}
    </FridgeContext.Provider>
  )
}
