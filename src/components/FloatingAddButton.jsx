import { useNavigate } from 'react-router-dom'
import { PlusIcon } from './Icons.jsx'

// Mobile-only floating action button for adding an assignment. Sits above the
// bottom nav bar; the desktop sidebar has its own "Add Assignment" button.
export default function FloatingAddButton() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/assignments/new')}
      aria-label="Add assignment"
      className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 active:scale-95 md:hidden"
    >
      <PlusIcon className="h-7 w-7" />
    </button>
  )
}
