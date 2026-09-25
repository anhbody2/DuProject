import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import type { RouteInfo } from '@nestjs/common/interfaces';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { AuthMiddleware } from './common/middlewares/auth.middleware';
import { CheckRole } from './common/middlewares/check-role.middleware';
import { DatabaseModule } from './database/database.module';
import { AddressesController } from './modules/addresses/addresses.controller';
import { AddressesModule } from './modules/addresses/addresses.module';
import { AuthController } from './modules/auth/auth.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CartController } from './modules/cart/cart.controller';
import { CartModule } from './modules/cart/cart.module';
import { CategoriesController } from './modules/categories/categories.controller';
import { CategoriesModule } from './modules/categories/categories.module';
import { FavoritesController } from './modules/favorites/favorites.controller';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { HealthController } from './modules/health/health.controller';
import { AdminOrdersController } from './modules/orders/admin-orders.controller';
import { OrdersController } from './modules/orders/orders.controller';
import { OrdersModule } from './modules/orders/orders.module';
import { StoreOrdersController } from './modules/orders/store-orders.controller';
import { ProductsController } from './modules/products/products.controller';
import { ProductsModule } from './modules/products/products.module';
import { ReviewsController } from './modules/reviews/reviews.controller';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { StoresController } from './modules/stores/stores.controller';
import { StoresModule } from './modules/stores/stores.module';
import { MeController } from './modules/users/me.controller';
import { UsersController } from './modules/users/users.controller';
import { UsersModule } from './modules/users/users.module';

const { GET, POST, PATCH, DELETE } = RequestMethod;

/** Routes reachable without a token. Everything else in PROTECTED requires AuthMiddleware. */
const PUBLIC_ROUTES: RouteInfo[] = [
  { path: 'auth/register', method: POST },
  { path: 'auth/login', method: POST },
  { path: 'categories', method: GET },
  { path: 'categories/:id', method: GET },
  { path: 'stores', method: GET },
  { path: 'stores/:id', method: GET },
  { path: 'stores/:id/locations', method: GET },
  { path: 'stores/:id/reviews', method: GET },
  { path: 'products', method: GET },
  { path: 'products/:id', method: GET },
  { path: 'products/:id/reviews', method: GET },
];

const PROTECTED_CONTROLLERS = [
  AuthController,
  MeController,
  UsersController,
  AddressesController,
  CategoriesController,
  StoresController,
  ProductsController,
  CartController,
  OrdersController,
  StoreOrdersController,
  AdminOrdersController,
  ReviewsController,
  FavoritesController,
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') as JwtSignOptions['expiresIn'],
        },
      }),
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    AddressesModule,
    CategoriesModule,
    StoresModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    ReviewsModule,
    FavoritesModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 1) auth: verify JWT and attach req.user (order matters - runs before CheckRole)
    consumer
      .apply(AuthMiddleware)
      .exclude(...PUBLIC_ROUTES)
      .forRoutes(...PROTECTED_CONTROLLERS);

    // 2) checkRole: admin-only routes
    consumer
      .apply(CheckRole('admin'))
      .forRoutes(
        UsersController,
        AdminOrdersController,
        { path: 'categories', method: POST },
        { path: 'categories/:id', method: PATCH },
        { path: 'categories/:id', method: DELETE },
        { path: 'stores/:id/status', method: PATCH },
      );

    // 3) checkRole: only store owners (or admins) can open a new store
    consumer.apply(CheckRole('store_owner', 'admin')).forRoutes({ path: 'stores', method: POST });
  }
}
