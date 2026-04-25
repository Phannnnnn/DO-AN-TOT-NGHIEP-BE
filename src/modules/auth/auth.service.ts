import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  login(user: any) {
    const payload = { id: user.id, fullName: user.fullName, role: user.role };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: (process.env.JWT_REFRESH_TOKEN_EXPIRES as any) || '7d',
    });

    this.userService.saveRefreshToken(refreshToken, user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: payload,
    };
  }

  async verifyRefreshToken(refreshToken: string) {
    const refreshDecoded = await this.jwtService.decode(refreshToken);

    if (refreshDecoded) {
      return this.userService.verifyRefreshToken(
        refreshToken,
        refreshDecoded.id,
      );
    }
    return null;
  }
}
