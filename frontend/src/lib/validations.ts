import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    isAdmin: z.boolean().optional(),
    adminPin: z.string().length(4, 'PIN must be exactly 4 digits').optional(),
  })
  .refine((data) => !data.isAdmin || (data.adminPin && /^\d{4}$/.test(data.adminPin)), {
    message: 'A 4-digit PIN is required to register as admin',
    path: ['adminPin'],
  });

export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().min(1, 'Phone is required').max(30),
});

export const addressSchema = z.object({
  label: z.string().max(50).optional(),
  street: z.string().min(1, 'Street is required').max(255),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().max(100).optional(),
  country: z.string().min(1, 'Country is required').max(100),
  postalCode: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
});

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  content: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  description: z.string().optional(),
  basePrice: z.number().min(0, 'Price must be positive'),
  categoryId: z.string().uuid().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  parentId: z.string().uuid().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
