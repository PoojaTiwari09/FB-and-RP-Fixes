import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect(process.env.NEXT_PUBLIC_HOME_PATH || '/engage');
}
