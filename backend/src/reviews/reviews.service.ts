import {
  Injectable,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameballService } from '../gameball/gameball.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    private prisma: PrismaService,
    private gameball: GameballService,
  ) {}

  async create(
    userId: string,
    productId: string,
    dto: CreateReviewDto,
    imageUrl?: string,
  ) {
    // Check product exists and is active
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product || !product.isActive) throw new NotFoundException('Product not found');

    // Verify purchase
    const purchased = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
      },
    });
    if (!purchased) {
      throw new ForbiddenException('You can only review products you have purchased');
    }

    // Check for existing review
    const existing = await this.prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) throw new ConflictException('You have already reviewed this product');

    const review = await this.prisma.review.create({
      data: {
        userId,
        productId,
        rating: dto.rating,
        content: dto.content,
        imageUrl,
        isVerifiedPurchase: true,
      },
    });

    // Fire Gameball write_review event
    const hasImage = !!imageUrl;
    this.gameball
      .sendWriteReviewEvent(userId, productId, hasImage)
      .then(() =>
        this.prisma.review.update({
          where: { id: review.id },
          data: { gameballEventSent: true },
        }),
      )
      .catch((err) =>
        this.logger.error(
          `Gameball write_review event failed for review ${review.id}: ${err.message}`,
        ),
      );

    return review;
  }

  async findByProduct(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          rating: true,
          content: true,
          imageUrl: true,
          isVerifiedPurchase: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.review.count({ where: { productId } }),
    ]);

    return {
      data: reviews,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
