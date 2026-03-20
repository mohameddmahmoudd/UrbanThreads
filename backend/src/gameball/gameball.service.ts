import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { SignJWT, CompactEncrypt } from 'jose';

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

  async createOrUpdateCustomer(
    customerId: string,
    attrs: {
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
    },
  ): Promise<void> {
    const requestBody = {
      customerId,
      email: attrs.email,
      customerAttributes: {
        firstName: attrs.firstName,
        lastName: attrs.lastName,
        email: attrs.email,
        mobile: attrs.phone,
        channel: 'web',
        joinDate: new Date().toISOString(),
      },
    };
    const response = await this.retryCall(() =>
      this.client.post('/customers', requestBody),
    );
    this.logger.log(`Customer ${customerId} created/updated in Gameball`);
    this.logger.log(`Request: ${JSON.stringify(requestBody)}`);
    this.logger.log(`Response [${response.status}]: ${JSON.stringify(response.data)}`);
  }

  async sendProfileCompletedEvent(customerId: string): Promise<void> {
    const requestBody = {
      customerId,
      events: {
        profile_completed: {},
      },
    };
    const response = await this.retryCall(() =>
      this.client.post('/events', requestBody),
    );
    this.logger.log(`profile_completed event sent for customer ${customerId}`);
    this.logger.log(`Request: ${JSON.stringify(requestBody)}`);
    this.logger.log(`Response [${response.status}]: ${JSON.stringify(response.data)}`);
  }

  async sendWriteReviewEvent(
    customerId: string,
    productId: string,
    hasImage: boolean,
  ): Promise<void> {
    const requestBody = {
      customerId,
      events: {
        write_review: {
          product_id: productId,
          has_image: hasImage,
        },
      },
    };
    const response = await this.retryCall(() =>
      this.client.post('/events', requestBody),
    );
    this.logger.log(
      `write_review event sent for customer ${customerId}, product ${productId}`,
    );
    this.logger.log(`Request: ${JSON.stringify(requestBody)}`);
    this.logger.log(`Response [${response.status}]: ${JSON.stringify(response.data)}`);
  }

  async trackOrder(
    customerId: string,
    orderId: string,
    totalPaid: number,
    lineItems: LineItem[],
  ): Promise<void> {
    const requestBody = {
      customerId,
      orderId,
      orderDate: new Date().toISOString(),
      totalPaid,
      lineItems: lineItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    };
    const response = await this.retryCall(() =>
      this.client.post('/orders', requestBody),
    );
    this.logger.log(`Order ${orderId} tracked for customer ${customerId}`);
    this.logger.log(`Request: ${JSON.stringify(requestBody)}`);
    this.logger.log(`Response [${response.status}]: ${JSON.stringify(response.data)}`);
  }

  async holdPoints(
    customerId: string,
    amount: number,
  ): Promise<{ holdReference: string; pointsRedeemed: number }> {
    const requestBody = { customerId, amount };
    const response = await this.retryCall(() =>
      this.client.post('/transactions/hold', requestBody),
    );
    this.logger.log(`Points held for customer ${customerId}`);
    this.logger.log(`Request: ${JSON.stringify(requestBody)}`);
    this.logger.log(`Response [${response.status}]: ${JSON.stringify(response.data)}`);
    return {
      holdReference: response.data.holdReference,
      pointsRedeemed: response.data.pointsRedeemed ?? 0,
    };
  }

  async releaseHold(holdReference: string): Promise<void> {
    const requestBody = { holdReference };
    const response = await this.retryCall(() =>
      this.client.post('/transactions/hold/reverse', requestBody),
    );
    this.logger.log(`Hold ${holdReference} released`);
    this.logger.log(`Request: ${JSON.stringify(requestBody)}`);
    this.logger.log(`Response [${response.status}]: ${JSON.stringify(response.data)}`);
  }

  async redeemPoints(
    customerId: string,
    holdReference: string,
  ): Promise<void> {
    const requestBody = { customerId, holdReference };
    const response = await this.retryCall(() =>
      this.client.post('/transactions/redeem', requestBody),
    );
    this.logger.log(`Points redeemed for customer ${customerId}`);
    this.logger.log(`Request: ${JSON.stringify(requestBody)}`);
    this.logger.log(`Response [${response.status}]: ${JSON.stringify(response.data)}`);
  }

  async getWidgetToken(userId: string): Promise<string> {
    const keyBytes = new TextEncoder().encode(this.secretKey);
    const exp = Math.floor(Date.now() / 1000) + 2 * 60 * 60; // 2 hours

    const jws = await new SignJWT({ customerId: userId, exp })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .sign(keyBytes);

    const jwe = await new CompactEncrypt(new TextEncoder().encode(jws))
      .setProtectedHeader({ alg: 'A256KW', enc: 'A256CBC-HS512' })
      .encrypt(keyBytes);

    return jwe;
  }

  async getCustomerLoyalty(customerId: string) {
    try {
      this.logger.log(`Request: GET /customer/${customerId}`);
      const response = await this.client.get(`/customer/${customerId}`);
      this.logger.log(`Response [${response.status}]: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404) {
        this.logger.debug(`Customer ${customerId} not yet in Gameball (404)`);
      } else {
        this.logger.warn(
          `Failed to fetch loyalty for ${customerId}: ${error.message}`,
        );
      }
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
