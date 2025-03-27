import {ConflictException, Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {PrismaService} from '../prisma/prisma.service';
import {RegisterInput} from './dto/register.input';
import {LoginInput} from './dto/login.input';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,  // Inject Prisma service for database operations
        private jwtService: JwtService, // Inject JWT service for token generation
    ) {
    }

    /**
     * Handles user registration
     * @param registerInput - Contains email and password for new user
     * @throws Error if email is already in use
     * @returns JWT token for the newly registered user
     */
    async register(registerInput: RegisterInput) {
        // First check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerInput.email }
        });

        if (existingUser) {
            throw new Error('Email already in use'); // Consider using ConflictException here
        }

        // Hash the password for security before storing
        const hashedPassword = await bcrypt.hash(registerInput.password, 10);

        // Create new user in database
        const user = await this.prisma.user.create({
            data: {
                email: registerInput.email,
                password: hashedPassword,
            },
        });

        // Generate and return JWT token
        return this.generateToken(user);
    }

    /**
     * Handles user login with email and password
     * @param loginInput - Contains email and password
     * @throws UnauthorizedException if credentials are invalid
     * @returns JWT token for authenticated user
     */
    async login(loginInput: LoginInput) {
        // Find user by email
        const user = await this.prisma.user.findUnique({
            where: {email: loginInput.email},
        });

        // Check if user exists and password matches
        if (!user || !(await bcrypt.compare(loginInput.password, user.password))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Generate and return JWT token
        return this.generateToken(user);
    }

    /**
     * Handles biometric authentication
     * @param biometricKey - Unique biometric identifier
     * @throws UnauthorizedException if biometric key is invalid
     * @returns JWT token if authentication succeeds
     */
    async biometricLogin(biometricKey: string) {
        const user = await this.validateBiometricKey(biometricKey);
        if (!user) {
            throw new UnauthorizedException();
        }
        return this.generateToken(user);
    }

    /**
     * Associates a biometric key with a user account
     * @param userId - ID of the user to associate with
     * @param biometricKey - Unique biometric identifier
     * @throws ConflictException if biometric key is already in use by another user
     */
    async setupBiometricKey(userId: string, biometricKey: string) {
        // Check if biometric key is already in use
        const existingUser = await this.prisma.user.findUnique({
            where: {biometricKey},
        });

        // Prevent key reuse by different users
        if (existingUser && existingUser.id !== userId) {
            throw new ConflictException('Biometric key already in use');
        }

        // Update user with new biometric key
        await this.prisma.user.update({
            where: {id: userId},
            data: {biometricKey},
        });
    }

    /**
     * Validates a biometric key by checking if it exists in the database
     * @param biometricKey - Unique biometric identifier to validate
     * @returns User object if found, null otherwise
     */
    async validateBiometricKey(biometricKey: string) {
        return this.prisma.user.findUnique({
            where: {biometricKey},
        });
    }

    /**
     * Generates a JWT token for a user
     * @param user - Must contain id and email
     * @returns Object containing the access token
     */
    private generateToken(user: { id: string; email: string }) {
        // Create token payload with user ID (as 'sub') and email
        const payload = {sub: user.id, email: user.email};
        return {
            access_token: this.jwtService.sign(payload), // Sign the token
        };
    }
}