import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DRIZZLE_TOKEN } from '../drizzle/drizzle.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../drizzle/schema';
import { users, blacklistedTokens } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { SignUpDto, SignInDto, AuthResponse } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_TOKEN)
    private db: NodePgDatabase<typeof schema>,
    private jwtService: JwtService,
  ) {}

  async getCurrentUser(userId: number) {
    try {
      console.log('Fetching user with ID:', userId); // Debug log

      const user = await this.db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId));

      console.log('Query result:', user); // Debug log

      if (!user || user.length === 0) {
        throw new UnauthorizedException('User not found');
      }

      return user[0];
    } catch (error) {
      console.error('Error fetching current user:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error fetching user details');
    }
  }

  async signUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    try {
      const { email, password, name } = signUpDto;

      const existingUser = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .then((res) => res[0]);

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const [newUser] = await this.db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          name,
        })
        .returning();

      const token = this.jwtService.sign({ sub: newUser.id });

      return {
        access_token: token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      };
    } catch (error) {
      console.error('Error in signUp:', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Error creating user');
    }
  }

  async signIn(signInDto: SignInDto): Promise<AuthResponse> {
    try {
      const { email, password } = signInDto;

      const user = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .then((res) => res[0]);

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const token = this.jwtService.sign({ sub: user.id });

      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      console.error('Error in signIn:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error during sign in');
    }
  }

  async signOut(token: string): Promise<void> {
    try {
      const payload = await this.jwtService.verifyAsync(token).catch(() => {
        throw new UnauthorizedException('Invalid token');
      });

      const existingToken = await this.db
        .select()
        .from(blacklistedTokens)
        .where(eq(blacklistedTokens.token, token))
        .then((res) => res[0]);

      if (existingToken) {
        throw new ConflictException('Token already invalidated');
      }

      await this.db.insert(blacklistedTokens).values({
        token,
        expiresAt: new Date(payload.exp * 1000), // Convert UNIX timestamp to Date
      });

      console.log('Token successfully blacklisted'); // Debug log
    } catch (error) {
      console.error('Error in signOut:', error);

      if (
        error instanceof UnauthorizedException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      if (error.code === '23505') {
        throw new ConflictException('Token already invalidated');
      }

      throw new InternalServerErrorException(
        `Error during sign out: ${error.message}`,
      );
    }
  }

  async deleteAccount(userId: number, password: string): Promise<void> {
    try {
      const user = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .then((res) => res[0]);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      await this.db.delete(users).where(eq(users.id, userId));
    } catch (error) {
      console.error('Error in deleteAccount:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error deleting account');
    }
  }
}
