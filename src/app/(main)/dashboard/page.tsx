// src/app/dashboard/page.tsx
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Role } from '@/constants/roles'; // Import Role type

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect('/auth/sign-in');

  // Get role from unsafeMetadata (consistent with SignUpForm and getAuthStatus)
  const role = (user.unsafeMetadata?.role as Role) || 'PASSENGER'; // Default to PASSENGER if missing

  // Redirect based on role
  switch (role) {
    case 'PASSENGER':
      redirect('/dashboard/passenger');
    case 'DRIVER':
      redirect('/dashboard/driver');
    case 'OWNER':
      redirect('/dashboard/owner');
  }
}
