// response.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  // ExecutionContext: thông tin về request hiện tại (HTTP, gRPC, WebSocket...)
  // CallHandler: đại diện cho handler tiếp theo trong pipeline (controller method)
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next
      .handle() // gọi controller method, trả về Observable
      .pipe(
        // map: biến đổi data trả về từ controller
        map((data) => ({
          success: true,
          data,
        })),
      );
  }
}
