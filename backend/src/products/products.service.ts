import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    categoryId?: string;
    q?: string;
  }) {
    const { page = 1, limit = 20, categoryId, q } = params;
    const skip = (page - 1) * limit;

    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          imageUrl: true,
          category: { select: { id: true, name: true } },
          variants: {
            where: { isActive: true },
            select: { id: true, name: true, price: true, stock: true },
          },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        imageUrl: true,
        isActive: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        variants: {
          where: { isActive: true },
          select: { id: true, name: true, sku: true, price: true, stock: true },
        },
        reviews: {
          take: 5,
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
        },
        _count: { select: { reviews: true } },
      },
    });

    if (!product || !product.isActive) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }
}
