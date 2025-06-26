import { Board } from './features/sticky-notes'

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic'

export default function Home() {
  return <Board />
}