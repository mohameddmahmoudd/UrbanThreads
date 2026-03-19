import { Module } from '@nestjs/common';
import { GameballService } from './gameball.service';

@Module({
  providers: [GameballService],
  exports: [GameballService],
})
export class GameballModule {}
