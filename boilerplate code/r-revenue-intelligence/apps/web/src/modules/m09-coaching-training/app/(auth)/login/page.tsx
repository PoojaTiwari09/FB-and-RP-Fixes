'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuth((state) => state.setAuth);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState } = useForm<FormValues>({ defaultValues: { email: '', password: '' } });

  async function onSubmit(values: FormValues) {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setError('Enter a valid email and password.');
      return;
    }
    setError('');
    const response = await authService.login(parsed.data.email, parsed.data.password);
    const token = response.access_token || response.token;
    if (!token) throw new Error('Login did not return a token.');
    setAuth(response.user, token);
    router.push(response.user.role === 'manager' || response.user.role === 'org_admin' ? '/manager/dashboard' : '/rep/assignments');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600"><BrainCircuit className="h-6 w-6" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">Revenue Intelligence</h1><p className="text-sm text-gray-500">Coaching & Training Module</p></div>
        </div>
        <label className="text-sm font-semibold text-gray-700">Email</label>
        <input className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" {...register('email')} />
        <label className="mt-5 block text-sm font-semibold text-gray-700">Password</label>
        <input type="password" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" {...register('password')} />
        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        <Button disabled={formState.isSubmitting} className="mt-6 w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
          {formState.isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </main>
  );
}
