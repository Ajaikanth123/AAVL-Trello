import { createBrowserRouter } from 'react-router-dom';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import AuthPageLayout from '../layouts/AuthPageLayout';
import HomePage from '../pages/HomePage';
import BoardViewPage from '../pages/BoardViewPage';
import OnboardingPage from '../pages/OnboardingPage';
import LoginPage from '../features/auth/LoginPage';
import SignupPage from '../features/auth/SignupPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthenticatedLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'boards/:boardId',
        element: <BoardViewPage />,
      },
      {
        path: 'onboarding',
        element: <OnboardingPage />,
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthPageLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'signup',
        element: <SignupPage />,
      },
    ],
  },
]);
