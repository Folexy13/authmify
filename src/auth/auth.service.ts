import {ConflictException, Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {PrismaService} from '../prisma/prisma.service';
import {RegisterInput} from './dto/register.input';
import {LoginInput} from './dto/login.input';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) {
    }

    async register(registerInput: RegisterInput) {
        const hashedPassword = await bcrypt.hash(registerInput.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: registerInput.email,
                password: hashedPassword,
            },
        });

        return this.generateToken(user);
    }

    async login(loginInput: LoginInput) {
        const user = await this.prisma.user.findUnique({
            where: {email: loginInput.email},
        });

        if (!user || !(await bcrypt.compare(loginInput.password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateToken(user);
    }

    async biometricLogin(biometricKey: string) {
        const user = await this.validateBiometricKey(biometricKey);
        if (!user) {
            throw new UnauthorizedException();
        }
        return this.generateToken(user);
    }

    async setupBiometricKey(userId: string, biometricKey: string) {
        // Check if biometric key is already in use
        const existingUser = await this.prisma.user.findFirst({
            where: {biometricKey},
        });

        if (existingUser && existingUser.id !== userId) {
            throw new ConflictException('Biometric key already in use');
        }

        await this.prisma.user.update({
            where: {id: userId},
            data: {biometricKey},
        });
    }

    async validateBiometricKey(biometricKey: string) {
        return this.prisma.user.findUnique({
            where: {biometricKey},
        });
    }

    private generateToken(user: { id: string; email: string }) {
        const payload = {sub: user.id, email: user.email};
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}