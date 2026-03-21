'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileInput, addressSchema, AddressInput } from '@/lib/validations';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { LoyaltyBalance } from '@/components/LoyaltyBalance';
import type { Address, LoyaltyProfile } from '@/types/api.types';

export default function ProfilePage() {
  const { user, fetchProfile } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyProfile | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  const addressForm = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    api.get<Address[]>('/users/me/addresses').then(setAddresses).catch(() => {});
    api.get<LoyaltyProfile>('/users/me/loyalty').then(setLoyalty).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const onProfileSubmit = async (data: ProfileInput) => {
    setProfileError('');
    setProfileSuccess(false);
    try {
      await api.patch('/users/me', data);
      await fetchProfile();
      setProfileSuccess(true);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  const onAddressSubmit = async (data: AddressInput) => {
    try {
      const addr = await api.post<Address>('/users/me/addresses', data);
      setAddresses((prev) => [addr, ...prev]);
      addressForm.reset();
      setShowAddressForm(false);
    } catch {}
  };

  const deleteAddress = async (id: string) => {
    await api.delete(`/users/me/addresses/${id}`);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  if (!user) {
    return <p className="text-gray-500">Please log in to view your profile.</p>;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Left: Profile + Addresses */}
      <div className="space-y-8">
        {/* Profile Form */}
        <section>
          <h1 className="mb-4 text-2xl font-bold">Profile</h1>
          <p className="mb-4 text-sm text-gray-500">{user.email}</p>

          {profileSuccess && (
            <div className="mb-3 rounded-md bg-green-50 p-3 text-sm text-green-700">
              Profile updated!
            </div>
          )}
          {profileError && (
            <div className="mb-3 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {profileError}
            </div>
          )}

          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-3">
            <Input
              id="firstName"
              label="First Name"
              error={profileForm.formState.errors.firstName?.message}
              {...profileForm.register('firstName')}
            />
            <Input
              id="lastName"
              label="Last Name"
              error={profileForm.formState.errors.lastName?.message}
              {...profileForm.register('lastName')}
            />
            <Input
              id="phone"
              label="Phone"
              error={profileForm.formState.errors.phone?.message}
              {...profileForm.register('phone')}
            />
            <Button type="submit" loading={profileForm.formState.isSubmitting}>
              Save Profile
            </Button>
          </form>
        </section>

        {/* Addresses */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Addresses</h2>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowAddressForm(!showAddressForm)}
            >
              {showAddressForm ? 'Cancel' : 'Add Address'}
            </Button>
          </div>

          {showAddressForm && (
            <form
              onSubmit={addressForm.handleSubmit(onAddressSubmit)}
              className="mb-4 space-y-3 rounded-md border p-4"
            >
              <Input label="Label" {...addressForm.register('label')} />
              <Input label="Street" error={addressForm.formState.errors.street?.message} {...addressForm.register('street')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="City" error={addressForm.formState.errors.city?.message} {...addressForm.register('city')} />
                <Input label="State / Governorate" {...addressForm.register('state')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Country" error={addressForm.formState.errors.country?.message} {...addressForm.register('country')} />
                <Input label="Postal Code" {...addressForm.register('postalCode')} />
              </div>
              <Button type="submit" size="sm">
                Save Address
              </Button>
            </form>
          )}

          <div className="space-y-2">
            {addresses.map((addr) => (
              <div key={addr.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="text-sm">
                  {addr.label && <span className="font-medium">{addr.label}: </span>}
                  {addr.street}, {addr.city}, {addr.country}
                  {addr.isDefault && (
                    <Badge variant="success" className="ml-2">Default</Badge>
                  )}
                </div>
                <button
                  onClick={() => deleteAddress(addr.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
            ))}
            {addresses.length === 0 && (
              <p className="text-sm text-gray-500">No addresses saved.</p>
            )}
          </div>
        </section>
      </div>

      {/* Right: Loyalty Dashboard */}
      <div>
        <h2 className="mb-4 text-2xl font-bold">Loyalty Rewards</h2>

        {/* Customer Balance */}
        <LoyaltyBalance />

        {/* VIP Tier & Badges (from existing loyalty endpoint) */}
        {loyalty?.available && (
          <div className="mt-6 space-y-6">
            {loyalty.tier && (
              <div className="rounded-lg border bg-white p-6">
                <p className="text-sm text-gray-500">VIP Tier</p>
                <p className="text-xl font-semibold">
                  {loyalty.tier.name || loyalty.tier}
                </p>
              </div>
            )}

            {loyalty.badges && loyalty.badges.length > 0 && (
              <div>
                <h3 className="mb-3 text-lg font-semibold">Badges</h3>
                <div className="grid grid-cols-2 gap-3">
                  {loyalty.badges.map((badge: any, index: number) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-4 ${
                        badge.achieved
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      {badge.icon && (
                        <img
                          src={badge.icon}
                          alt={badge.name}
                          className="mb-2 h-10 w-10"
                        />
                      )}
                      <p className="font-medium">{badge.name || `Badge ${index + 1}`}</p>
                      {badge.achieved ? (
                        <Badge variant="success">Achieved</Badge>
                      ) : (
                        <div className="mt-1">
                          <div className="h-2 w-full rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-black"
                              style={{
                                width: `${Math.min(badge.progress || 0, 100)}%`,
                              }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {badge.progress || 0}% complete
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
