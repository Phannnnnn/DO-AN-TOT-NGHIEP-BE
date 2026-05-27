import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomModule } from './modules/room/room.module';
import { Room } from './entities/room.entity';
import { UserModule } from './modules/user/user.module';
import { User } from './entities/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { RoomType } from './entities/room-type.entity';
import { RoomTypeModule } from './modules/room_type/room_type.module';
import { CustomerModule } from './modules/customer/customer.module';
import { Customer } from './entities/customer.entity';
import { ServiceTypeModule } from './modules/service_type/service_type.module';
import { ServiceModule } from './modules/service/service.module';
import { ServiceType } from './entities/service-type.entity';
import { Service } from './entities/service.entity';
import { BookingModule } from './modules/booking/booking.module';
import { BookingDetailModule } from './modules/booking_detail/booking_detail.module';
import { BookingServiceModule } from './modules/booking_service/booking_service.module';
import { RoomImageModule } from './modules/room_image/room_image.module';
import { RoomAmenityModule } from './modules/room_amenity/room-amenity.module';
import { PricePlanModule } from './modules/price_plan/price_plan.module';
import { RoomTypeAmenityModule } from './modules/room_type_amenity/room_type_amenity.module';
import { RoomBedModule } from './modules/romm_bed/room_bed.module';
import { RoomTypeBedModule } from './modules/room_type_bed/room_type_bed.module';
import { RoomTypeBed } from './entities/room-type-bed.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { MailModule } from './modules/mail/mail.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ReportModule } from './modules/report/report.module';
import { PaymentModule } from './modules/payment/payment.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { RoomHoldModule } from './modules/room_hold/room_hold.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as any,
      host: process.env.DB_HOST,
      port: +(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Room, RoomType, Customer, ServiceType, Service],
      synchronize: true,
      autoLoadEntities: true,
      // logging: true,
    }),
    RoomModule,
    UserModule,
    AuthModule,
    RoomTypeModule,
    CustomerModule,
    ServiceTypeModule,
    ServiceModule,
    BookingModule,
    BookingDetailModule,
    BookingServiceModule,
    RoomAmenityModule,
    RoomBedModule,
    RoomImageModule,
    PricePlanModule,
    RoomTypeAmenityModule,
    RoomTypeBedModule,
    RoomTypeBed,
    MailModule,
    PaymentModule,
    DashboardModule,
    ReportModule,
    CloudinaryModule,
    RoomHoldModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
