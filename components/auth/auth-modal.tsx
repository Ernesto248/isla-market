'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { translations } from '@/lib/translations';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onModeChange: (mode: 'login' | 'signup') => void;
}

export function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { language, setUser } = useAppStore();
  const t = translations[language];

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  });

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    // TODO: Integrate with Supabase
    setTimeout(() => {
      // Mock login
      setUser({
        id: '1',
        email: data.email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'client',
        createdAt: new Date(),
      });
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  const handleSignup = async (data: SignupForm) => {
    setIsLoading(true);
    // TODO: Integrate with Supabase
    setTimeout(() => {
      // Mock signup
      setUser({
        id: '1',
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: 'client',
        createdAt: new Date(),
      });
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'login' ? t.login : t.signup}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  {...loginForm.register('email')}
                  className={loginForm.formState.errors.email ? 'border-red-500' : ''}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  {...loginForm.register('password')}
                  className={loginForm.formState.errors.password ? 'border-red-500' : ''}
                />
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  t.login
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t.firstName}</Label>
                  <Input
                    id="firstName"
                    {...signupForm.register('firstName')}
                    className={signupForm.formState.errors.firstName ? 'border-red-500' : ''}
                  />
                  {signupForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500">
                      {signupForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">{t.lastName}</Label>
                  <Input
                    id="lastName"
                    {...signupForm.register('lastName')}
                    className={signupForm.formState.errors.lastName ? 'border-red-500' : ''}
                  />
                  {signupForm.formState.errors.lastName && (
                    <p className="text-sm text-red-500">
                      {signupForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  {...signupForm.register('email')}
                  className={signupForm.formState.errors.email ? 'border-red-500' : ''}
                />
                {signupForm.formState.errors.email && (
                  <p className="text-sm text-red-500">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  {...signupForm.register('password')}
                  className={signupForm.formState.errors.password ? 'border-red-500' : ''}
                />
                {signupForm.formState.errors.password && (
                  <p className="text-sm text-red-500">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...signupForm.register('confirmPassword')}
                  className={signupForm.formState.errors.confirmPassword ? 'border-red-500' : ''}
                />
                {signupForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">
                    {signupForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  t.signup
                )}
              </Button>
            </form>
          )}

          <div className="text-center">
            <button
              type="button"
              onClick={() => onModeChange(mode === 'login' ? 'signup' : 'login')}
              className="text-sm text-primary hover:underline"
            >
              {mode === 'login' ? t.dontHaveAccount : t.alreadyHaveAccount}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}