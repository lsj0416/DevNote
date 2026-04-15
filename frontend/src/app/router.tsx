import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../widgets/layouts/AppLayout'
import { PublicLayout } from '../widgets/layouts/PublicLayout'
import { RequireAuth } from '../features/auth/RequireAuth'
import { AnalysisHistoryPage } from '../pages/analysis/AnalysisHistoryPage'
import { AnalysisStatusPage } from '../pages/analysis/AnalysisStatusPage'
import { LoginCallbackPage } from '../pages/auth/LoginCallbackPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { NotFoundPage } from '../pages/errors/NotFoundPage'
import { HomePage } from '../pages/home/HomePage'
import { BlogDraftPage } from '../pages/notes/BlogDraftPage'
import { NoteDetailPage } from '../pages/notes/NoteDetailPage'
import { NotesPage } from '../pages/notes/NotesPage'
import { SettingsPage } from '../pages/settings/SettingsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login/callback',
        element: <LoginCallbackPage />,
      },
    ],
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'analysis',
        element: <AnalysisHistoryPage />,
      },
      {
        path: 'analysis/:jobId',
        element: <AnalysisStatusPage />,
      },
      {
        path: 'notes',
        element: <NotesPage />,
      },
      {
        path: 'notes/:noteId',
        element: <NoteDetailPage />,
      },
      {
        path: 'notes/:noteId/blog',
        element: <BlogDraftPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
