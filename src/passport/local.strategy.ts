import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserService } from '../modules/user/user.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      usernameField: 'userName',
      passwordField: 'password',
    });
  }

  async validate(userName: string, password: string) {
    const user = await this.userService.validateUser(userName, password);

    if (!user) {
      throw new UnauthorizedException(
        'Tên đăng nhập hoặc mật khẩu không chính xác.',
      );
    }

    if (!user?.isActive) {
      throw new UnauthorizedException('Tài khoản đang bị khóa.');
    }

    return user;
  }
}
