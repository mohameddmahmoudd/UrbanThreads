import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { GameballService } from '../gameball/gameball.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private gameball: GameballService,
  ) {}

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: { select: { id: true, name: true, imageUrl: true, isActive: true } },
        variant: { select: { id: true, name: true, price: true, stock: true } },
      },
    });

    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0,
    );

    return {
      id: cart.id,
      items,
      subtotal,
      holdReference: cart.holdReference,
      holdAmount: cart.holdAmount ? Number(cart.holdAmount) : null,
      total: subtotal - (cart.holdAmount ? Number(cart.holdAmount) : 0),
    };
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const cart = await this.getOrCreateCart(userId);

    // Get current price
    let unitPrice: Decimal;
    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId },
      });
      if (!variant || !variant.isActive)
        throw new NotFoundException('Variant not found');
      if (variant.stock < dto.quantity)
        throw new BadRequestException('Insufficient stock');
      unitPrice = variant.price;
    } else {
      const product = await this.prisma.product.findUnique({
        where: { id: dto.productId },
      });
      if (!product || !product.isActive)
        throw new NotFoundException('Product not found');
      unitPrice = product.basePrice;
    }

    // Upsert: if same product+variant already in cart, update quantity
    const existing = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId ?? null,
      },
    });

    if (existing) {
      return this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + dto.quantity, unitPrice },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: dto.productId,
        variantId: dto.variantId,
        quantity: dto.quantity,
        unitPrice,
      },
    });
  }

  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundException('Cart item not found');

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return { message: 'Item removed' };
  }

  async holdPoints(userId: string, amount: number) {
    const cart = await this.getOrCreateCart(userId);

    // Release existing hold if any
    if (cart.holdReference) {
      await this.gameball
        .releaseHold(cart.holdReference)
        .catch(() => {}); // ignore errors on release
    }
    // Ignore OTP verification for now TODO: add OTP verification
    const result = await this.gameball.holdPoints(userId, amount, true);

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: {
        holdReference: result.holdReference,
        holdAmount: amount,
      },
    });

    return result;
  }

  async releaseHoldPoints(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    if (!cart.holdReference) {
      throw new BadRequestException('No points held');
    }

    await this.gameball.releaseHold(cart.holdReference);

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { holdReference: null, holdAmount: null },
    });

    return { message: 'Points released' };
  }

  private async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await this.prisma.cart.create({ data: { userId } });
    }
    return cart;
  }
}
