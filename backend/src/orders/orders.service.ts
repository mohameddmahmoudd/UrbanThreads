import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameballService } from '../gameball/gameball.service';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private gameball: GameballService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.getOrThrow('STRIPE_SECRET_KEY'));
  }

  /**
   * Step 1: Create a Stripe PaymentIntent and return client_secret.
   * The actual order is created in handlePaymentSuccess (via webhook).
   */
  async createPaymentIntent(userId: string, dto: CreateOrderDto) {
    // Validate address belongs to user
    const address = await this.prisma.address.findFirst({
      where: { id: dto.addressId, userId },
    });
    if (!address) throw new NotFoundException('Address not found');

    // Get cart with items
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Re-validate prices and compute subtotal
    let subtotal = 0;
    for (const item of cart.items) {
      const currentPrice = item.variant
        ? Number(item.variant.price)
        : Number(item.product.basePrice);
      subtotal += currentPrice * item.quantity;
    }

    const discountAmount = cart.holdAmount ? Number(cart.holdAmount) : 0;
    const totalAmount = Math.max(subtotal - discountAmount, 0);

    // Create PaymentIntent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe uses cents
      currency: 'usd',
      metadata: {
        userId,
        addressId: dto.addressId,
        holdReference: cart.holdReference || '',
        discountAmount: discountAmount.toString(),
        subtotal: subtotal.toString(),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      subtotal,
      discountAmount,
      totalAmount,
    };
  }

  /**
   * Step 2: Called by Stripe webhook when payment succeeds.
   * Creates the order record, clears cart, triggers Gameball.
   */
  async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const { userId, addressId, holdReference, discountAmount, subtotal } =
      paymentIntent.metadata;

    // Idempotency: check if order already exists for this PI
    const existing = await this.prisma.order.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
    });
    if (existing) {
      this.logger.log(`Order already exists for PI ${paymentIntent.id}`);
      return existing;
    }

    // Get address snapshot
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });

    // Get cart items for order line items
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: true, variant: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      this.logger.error(`Cart empty for user ${userId} on PI ${paymentIntent.id}`);
      return;
    }

    const totalAmount = paymentIntent.amount / 100;

    // Create order in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          status: 'PAID',
          subtotal: parseFloat(subtotal),
          discountAmount: parseFloat(discountAmount || '0'),
          totalAmount,
          pointsRedeemed: 0,
          gameballHoldReference: holdReference || null,
          addressSnapshot: address || {},
          stripePaymentIntentId: paymentIntent.id,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.product.name,
              variantName: item.variant?.name || null,
              quantity: item.quantity,
              unitPrice: item.variant
                ? item.variant.price
                : item.product.basePrice,
              totalPrice:
                Number(
                  item.variant ? item.variant.price : item.product.basePrice,
                ) * item.quantity,
            })),
          },
        },
        include: { items: true },
      });

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          stripePaymentIntentId: paymentIntent.id,
          amount: totalAmount,
          currency: 'usd',
          status: 'SUCCEEDED',
          stripeChargeId: paymentIntent.latest_charge as string || null,
        },
      });

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { holdReference: null, holdAmount: null },
      });

      return newOrder;
    });

    // Gameball: track order for earning (fire-and-forget with retry)
    this.gameball
      .trackOrder(
        userId,
        order.id,
        totalAmount,
        order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: Number(item.unitPrice),
        })),
      )
      .catch((err) =>
        this.logger.error(
          `Gameball trackOrder failed for order ${order.id}: ${err.message}`,
        ),
      );

    // Gameball: finalize point redemption if hold was used
    if (holdReference) {
      const ignoreOtp = true; // Ignore OTP verification for now TODO: add OTP verification
      this.gameball
        .redeemPoints(userId, paymentIntent.id, holdReference, ignoreOtp) 
        .catch((err) =>
          this.logger.error(
            `Gameball redeemPoints failed for order ${order.id}: ${err.message}`,
          ),
        );
    }

    this.logger.log(`Order ${order.id} created from PI ${paymentIntent.id}`);
    return order;
  }

  /**
   * Sync fallback: frontend calls this after Stripe redirect.
   * Retrieves the PaymentIntent from Stripe, verifies ownership, and
   * runs handlePaymentSuccess (idempotent — safe if webhook already fired).
   */
  async confirmPayment(userId: string, paymentIntentId: string) {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.userId !== userId) {
      throw new BadRequestException('Payment does not belong to this user');
    }

    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('Payment has not succeeded');
    }

    return this.handlePaymentSuccess(paymentIntent);
  }

  async findUserOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            select: {
              id: true,
              productName: true,
              variantName: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      data: orders,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneForUser(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: true,
        payment: {
          select: { id: true, status: true, amount: true, createdAt: true },
        },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
