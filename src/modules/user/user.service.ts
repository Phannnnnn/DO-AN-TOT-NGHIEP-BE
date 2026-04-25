import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>) {
    const existUserName = await this.userRepository.findOneBy({
      userName: userData.userName,
    });
    const existEmail = await this.userRepository.findOneBy({
      email: userData.email,
    });

    if (existUserName || existEmail) {
      throw new ConflictException('Tên đăng nhập hoặc email đã được sử dụng.');
    }

    const user = this.userRepository.create(userData);
    const hashPassword = await bcrypt.hash(user.password, 10);
    user.password = hashPassword;

    return this.userRepository.save(user);
  }

  async validateUser(userName: string, password: string) {
    const user = await this.userRepository.findOne({
      where: [{ userName: userName }, { email: userName }],
    });

    if (!user) {
      return null;
    }
    const result = await bcrypt.compare(password, user.password);
    if (!result) {
      return null;
    }
    user.lastLogin = new Date();
    return this.userRepository.save(user);
  }

  async saveRefreshToken(refreshToken: string, id: number) {
    const user = await this.userRepository.findOneBy({ id });
    if (user) {
      const hashedRefresh = await bcrypt.hash(refreshToken, 10);
      user.refreshToken = hashedRefresh;
      this.userRepository.save(user);
    }

    return null;
  }

  async verifyRefreshToken(refreshToken: string, id: number) {
    const user = await this.userRepository.findOneBy({ id });

    if (user && user?.refreshToken) {
      const result = await bcrypt.compare(refreshToken, user.refreshToken);
      if (result) {
        return user;
      }
    }
    return null;
  }
}
