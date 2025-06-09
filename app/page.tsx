import { redirect } from 'next/navigation';

export default function RootPage() {
  // Immediately redirect users visiting the root URL to the login page.
  redirect('/login');

  // Since a redirect happens, this component won't visually render anything.
  // However, a React component must return JSX or null.
  return null;
}