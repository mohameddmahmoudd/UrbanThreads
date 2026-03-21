'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { isAdmin: false },
  });

  const isAdmin = watch('isAdmin');

  const onSubmit = async (data: RegisterInput) => {
    setError('');
    try {
      await registerUser(
        data.email,
        data.password,
        data.firstName,
        data.lastName,
        data.isAdmin ? data.adminPin : undefined,
      );
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="mx-auto max-w-md py-12">
      <h1 className="mb-8 text-2xl font-bold">Create Account</h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="firstName"
            label="First Name"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            id="lastName"
            label="Last Name"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
        <Input
          id="email"
          label="Email"
          type="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          id="password"
          label="Password"
          type="password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
              {...register('isAdmin')}
            />
            Register as Admin
          </label>

          {isAdmin && (
            <Input
              id="adminPin"
              label="Admin PIN"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="4-digit PIN"
              error={errors.adminPin?.message}
              {...register('adminPin')}
            />
          )}
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">
          Register
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-black hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
