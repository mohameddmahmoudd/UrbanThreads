import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { GameballModule } from '../gameball/gameball.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [GameballModule, UploadModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
