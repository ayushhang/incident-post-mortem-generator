import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log("Connected to database");
    } catch (err: any) {
      this.logger.warn(`Could not connect to database: ${err?.message || err}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log("Disconnected from database");
    } catch (err: any) {
      this.logger.warn(`Error disconnecting from database: ${err?.message || err}`);
    }
  }
}
