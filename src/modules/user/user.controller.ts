import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../entities/user.entity';
import { UsersQueryDto } from './dto/users-query.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Roles(UserRole.ADMIN)
  @Get()
  users(@Query() query: UsersQueryDto) {
    return this.userService.findAll({
      page: query.page || 1,
      limit: query.limit || 10,
    });
  }

  @Get(':id')
  userById(@Param('id') id: number) {
    return this.userService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.userService.remove(id);
  }

  @Post(':id/change-password')
  changePassword(@Param('id') id: number, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Post(':id/reset-password')
  resetPassword(@Param('id') id: number, @Body() dto: ResetPasswordDto) {
    return this.userService.resetPassword(id, dto);
  }
}
