import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface LineItem {
  productId: string;
  quantity: number;
  price: number;
}

@Injectable()
export class GameballService {
  private readonly logger = new Logger(GameballService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly secretKey: string;

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>('GAMEBALL_API_KEY', '');
    this.secretKey = this.config.get<string>('GAMEBALL_SECRET_KEY', '');

    this.client = axios.create({
      baseURL: 'https://api.gameball.co/api/v4.0/integrations',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.apiKey,
        secretkey: this.secretKey,
      },
      timeout: 10000,
    });
  }

  async sendProfileCompletedEvent(customerId: string): Promise<void> {
    await this.retryCall(() =>
      this.client.post('/events', {
        customerId,
        events: {
          profile_completed: {},
        },
      }),
    );
    this.logger.log(`profile_completed event sent for customer ${customerId}`);
  }

  async sendWriteReviewEvent(
    customerId: string,
    productId: string,
    hasImage: boolean,
  ): Promise<void> {
    await this.retryCall(() =>
      this.client.post('/events', {
        customerId,
        events: {
          write_review: {
            product_id: productId,
            has_image: hasImage,
          },
        },
      }),
    );
    this.logger.log(
      `write_review event sent for customer ${customerId}, product ${productId}`,
    );
  }

  async trackOrder(
    customerId: string,
    orderId: string,
    totalPaid: number,
    lineItems: LineItem[],
  ): Promise<void> {
    await this.retryCall(() =>
      this.client.post('/orders', {
        customerId,
        orderId,
        orderDate: new Date().toISOString(),
        totalPaid,
        lineItems: lineItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      }),
    );
    this.logger.log(`Order ${orderId} tracked for customer ${customerId}`);
  }

  async holdPoints(
    customerId: string,
    amount: number,
  ): Promise<{ holdReference: string; pointsRedeemed: number }> {
    const response = await this.retryCall(() =>
      this.client.post('/transactions/hold', {
        customerId,
        amount,
      }),
    );
    return {
      holdReference: response.data.holdReference,
      pointsRedeemed: response.data.pointsRedeemed ?? 0,
    };
  }

  async releaseHold(holdReference: string): Promise<void> {
    await this.retryCall(() =>
      this.client.post('/transactions/hold/reverse', {
        holdReference,
      }),
    );
    this.logger.log(`Hold ${holdReference} released`);
  }

  async redeemPoints(
    customerId: string,
    holdReference: string,
  ): Promise<void> {
    await this.retryCall(() =>
      this.client.post('/transactions/redeem', {
        customerId,
        holdReference,
      }),
    );
    this.logger.log(`Points redeemed for customer ${customerId}`);
  }

  async getCustomerLoyalty(customerId: string) {
    try {
      const response = await this.client.get(`/customer/${customerId}`);
      return response.data;
    } catch (error: any) {
      this.logger.warn(
        `Failed to fetch loyalty for ${customerId}: ${error.message}`,
      );
      return {
        pointsBalance: null,
        tier: null,
        badges: [],
        available: false,
      };
    }
  }

  private async retryCall<T>(
    fn: () => Promise<T>,
    retries = 3,
  ): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        this.logger.warn(
          `Gameball call failed (attempt ${attempt}/${retries}): ${error.message}`,
        );
        if (attempt === retries) throw error;
        await this.sleep(Math.pow(2, attempt) * 500);
      }
    }
    throw new Error('Unreachable');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
