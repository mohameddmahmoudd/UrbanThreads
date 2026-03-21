import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameballService } from '../gameball/gameball.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private gameball: GameballService,
  ) {}

  async getProfile(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isProfileCompleted: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isProfileCompleted: true,
      },
    });

    // Fire-and-forget: sync profile to Gameball
    this.gameball
      .createOrUpdateCustomer(userId, {
        email: user.email,
        firstName: user.firstName ?? undefined,
        lastName: user.lastName ?? undefined,
        phone: user.phone ?? undefined,
      })
      .catch((err) =>
        console.error('Gameball customer update failed:', err.message),
      );

    // Check if profile is now complete and fire Gameball event once
    if (
      !user.isProfileCompleted &&
      user.firstName &&
      user.lastName &&
      user.phone
    ) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isProfileCompleted: true },
      });
      user.isProfileCompleted = true;

      // Fire-and-forget Gameball event
      this.gameball
        .sendProfileCompletedEvent(userId)
        .catch((err) =>
          console.error('Gameball profile_completed event failed:', err.message),
        );
    }

    return user;
  }

  // ─── Addresses ──────────────────────────────────────

  async getAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.create({
      data: { ...dto, userId },
    });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException('Address not found');

    if ((dto as any).isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.address.update({
      where: { id: addressId },
      data: dto as any,
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundException('Address not found');

    await this.prisma.address.delete({ where: { id: addressId } });
    return { message: 'Address deleted' };
  }

  // ─── Loyalty ────────────────────────────────────────

  async getBalance(userId: string) {
    return this.gameball.getCustomerBalance(userId);
  }

  async getTierProgress(userId: string) {
    const [progress, tiers, loyalty] = await Promise.all([
      this.gameball.getCustomerTierProgress(userId),
      this.gameball.getTierConfigurations(),
      this.gameball.getCustomerLoyalty(userId),
    ]);
    return {
      ...(progress || {}),
      tiers: Array.isArray(tiers) ? tiers : [],
      badges: loyalty?.badges ?? [],
    };
  }

  async getWidgetToken(userId: string) {
    const token = await this.gameball.getWidgetToken(userId);
    return { token };
  }
}
