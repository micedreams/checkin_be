import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Delete,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto, AuthResponse } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponse> {
    return this.authService.signUp(signUpDto);
  }

  @Post('signin')
  signIn(@Body() signInDto: SignInDto): Promise<AuthResponse> {
    return this.authService.signIn(signInDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Request() req) {
    try {
      console.log('Request user:', req.user); // Debug log
      if (!req.user) {
        throw new UnauthorizedException('No user found in request');
      }
      return this.authService.getCurrentUser(req.user.id);
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  async signOut(
    @Headers('authorization') auth: string,
  ): Promise<{ message: string }> {
    try {
      if (!auth || !auth.startsWith('Bearer ')) {
        throw new BadRequestException('Invalid authorization header format');
      }

      const token = auth.split(' ')[1];
      if (!token) {
        throw new BadRequestException('No token provided');
      }

      await this.authService.signOut(token);
      return { message: 'Successfully signed out' };
    } catch (error) {
      console.error('Error in signOut controller:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('account')
  async deleteAccount(
    @Request() req,
    @Body('password') password: string,
  ): Promise<{ message: string }> {
    await this.authService.deleteAccount(req.user.id, password);
    return { message: 'Account successfully deleted' };
  }
}
