import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CurrentUser } from '../common/decorators';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  createPaymentIntent(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createPaymentIntent(userId, dto);
  }

  @Post('confirm')
  confirmPayment(
    @CurrentUser('id') userId: string,
    @Body('paymentIntentId') paymentIntentId: string,
  ) {
    return this.ordersService.confirmPayment(userId, paymentIntentId);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ordersService.findUserOrders(userId, page, limit);
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.ordersService.findOneForUser(userId, orderId);
  }
}
