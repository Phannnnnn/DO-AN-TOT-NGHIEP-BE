import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Customer } from '../../entities/customer.entity';
import { CustomerService } from '../customer/customer.service';
import { UsersQueryDto } from './dto/users-query.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly customerService: CustomerService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existUserName = await this.userRepository.findOneBy({
      userName: createUserDto.userName,
    });
    const existEmail = await this.customerRepository.findOneBy({
      email: createUserDto.email,
    });

    if (existUserName || existEmail) {
      throw new ConflictException('Tên đăng nhập hoặc email đã được sử dụng.');
    }

    const user = this.userRepository.create({
      userName: createUserDto.userName,
      password: createUserDto.password,
      role: createUserDto.role,
    });

    const hashPassword = await bcrypt.hash(user.password, 10);
    user.password = hashPassword;

    const customer = await this.customerService.create({
      fullName: createUserDto.fullName,
      email: createUserDto.email,
    });

    user.customer = customer;
    await this.userRepository.save(user);

    return user;
  }

  async validateUser(userName: string, password: string) {
    const user = await this.userRepository.findOne({
      where: [{ userName: userName }],
      relations: ['customer'],
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
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (user && user?.refreshToken) {
      const result = await bcrypt.compare(refreshToken, user.refreshToken);
      if (result) {
        return user;
      }
    }
    return null;
  }

  async findAll(usersQueryDto: UsersQueryDto) {
    const [users, total] = await this.userRepository.findAndCount({
      relations: ['customer'],
      order: { created_At: 'DESC' },
      take: Number(usersQueryDto.limit),
      skip: (Number(usersQueryDto.page) - 1) * Number(usersQueryDto.limit),
    });

    return { users, totalPage: Math.ceil(total / Number(usersQueryDto.limit)) };
  }

  async findById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['customer'],
    });
    if (!user) throw new NotFoundException('User không tồn tại.');
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    if (user.role === 'ADMIN') {
      throw new ConflictException(
        'Không thể chỉnh sửa người dùng có vai trò ADMIN.',
      );
    }

    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    return this.findById(id);
  }

  async remove(id: number) {
    const user = await this.findById(id);
    if (user.role === 'ADMIN') {
      throw new ConflictException('Không thể xóa người dùng có vai trò ADMIN.');
    }
    await this.userRepository.delete(id);
    return user;
  }

  async changePassword(id: number, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('User không tồn tại.');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch)
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng.');

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);
    return { message: 'Đổi mật khẩu thành công.' };
  }

  async resetPassword(id: number, dto: ResetPasswordDto) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new NotFoundException('User không tồn tại.');
    if (user.role === 'ADMIN') {
      throw new ConflictException(
        'Không thể đặt lại mật khẩu cho người dùng có vai trò ADMIN.',
      );
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);
    return { message: 'Đặt lại mật khẩu thành công.' };
  }
}
