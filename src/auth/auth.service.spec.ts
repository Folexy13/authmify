import {Test} from '@nestjs/testing';
import {AuthService} from './auth.service';
import {PrismaService} from '../prisma/prisma.service';
import {JwtService} from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {ConflictException, UnauthorizedException} from '@nestjs/common';
import {RegisterInput} from './dto/register.input';
import {LoginInput} from './dto/login.input';

describe('AuthService', () => {
    let authService: AuthService;
    let prismaService: PrismaService;
    let jwtService: JwtService;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            create: jest.fn(),
                            findUnique: jest.fn(),
                            update: jest.fn(),
                        },
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock-token'),
                    },
                },
            ],
        }).compile();

        authService = moduleRef.get<AuthService>(AuthService);
        prismaService = moduleRef.get<PrismaService>(PrismaService);
        jwtService = moduleRef.get<JwtService>(JwtService);

        // Mock bcrypt
        jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password');
        jest.spyOn(bcrypt, 'compare').mockImplementation((plain, hashed) =>
            Promise.resolve(plain === 'correct-password' && hashed === 'hashed-password')
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user', async () => {
            const registerInput: RegisterInput = {
                email: 'test@example.com',
                password: 'password123',
            };

            const mockUser = {
                id: '1',
                email: registerInput.email,
                password: 'hashed-password',
                biometricKey: null, createdAt: new Date(), updatedAt: new Date(),
            };

            jest.spyOn(prismaService.user, 'create').mockResolvedValue(mockUser);

            const result = await authService.register(registerInput);

            expect(prismaService.user.create).toHaveBeenCalledWith({
                data: {
                    email: registerInput.email,
                    password: 'hashed-password',
                },
            });
            expect(result).toEqual({
                access_token: 'mock-token',
            });
        });

        it('should throw ConflictException if email already exists', async () => {
            const registerInput: RegisterInput = {
                email: 'existing@example.com',
                password: 'password123',
            };

            // Mock Prisma to throw a unique constraint error
            jest.spyOn(prismaService.user, 'create').mockRejectedValue({
                code: 'P2002',
                meta: { target: ['email'] },
            });

            await expect(authService.register(registerInput))
                .rejects.toThrow(ConflictException);
        });
    });

    describe('login', () => {
        it('should login with valid credentials', async () => {
            const loginInput: LoginInput = {
                email: 'test@example.com',
                password: 'correct-password',
            };

            const mockUser = {
                id: '1',
                email: loginInput.email,
                password: 'hashed-password',
                biometricKey: null, createdAt: new Date(), updatedAt: new Date(),
            };

            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

            const result = await authService.login(loginInput);

            expect(result).toEqual({
                access_token: 'mock-token',
            });
        });

        it('should throw UnauthorizedException with invalid email', async () => {
            const loginInput: LoginInput = {
                email: 'nonexistent@example.com',
                password: 'password123',
            };

            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

            await expect(authService.login(loginInput)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException with invalid password', async () => {
            const loginInput: LoginInput = {
                email: 'test@example.com',
                password: 'wrong-password',
            };

            const mockUser = {
                id: '1',
                email: loginInput.email,
                password: 'hashed-password',
                biometricKey: null, createdAt: new Date(), updatedAt: new Date(),
            };

            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

            await expect(authService.login(loginInput)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('biometricLogin', () => {
        it('should login with valid biometric key', async () => {
            const biometricKey = 'valid-biometric-key';
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                password: "",
                biometricKey, createdAt: new Date(), updatedAt: new Date(),
            };

            jest.spyOn(authService, 'validateBiometricKey').mockResolvedValue(mockUser);

            const result = await authService.biometricLogin(biometricKey);

            expect(result).toEqual({
                access_token: 'mock-token',
            });
        });

        it('should throw UnauthorizedException with invalid biometric key', async () => {
            const biometricKey = 'invalid-biometric-key';

            jest.spyOn(authService, 'validateBiometricKey').mockResolvedValue(null);

            await expect(authService.biometricLogin(biometricKey)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('setupBiometricKey', () => {
        it('should setup biometric key for user', async () => {
            const userId = '1';
            const biometricKey = 'new-biometric-key';

            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);
            jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

            await authService.setupBiometricKey(userId, biometricKey);

            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: {id: userId},
                data: {biometricKey},
            });
        });

        it('should throw ConflictException if biometric key is in use', async () => {
            const userId = '1';
            const biometricKey = 'existing-biometric-key';

            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
                id: '2', // Different user
                biometricKey,
            } as any);

            await expect(authService.setupBiometricKey(userId, biometricKey))
                .rejects.toThrow(ConflictException);
        });

        it('should allow updating own biometric key', async () => {
            const userId = '1';
            const biometricKey = 'existing-biometric-key';

            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
                id: userId, // Same user
                biometricKey,
            } as any);
            jest.spyOn(prismaService.user, 'update').mockResolvedValue({} as any);

            await authService.setupBiometricKey(userId, biometricKey);

            expect(prismaService.user.update).toHaveBeenCalled();
        });
    });

    describe('validateBiometricKey', () => {
        it('should return user with valid biometric key', async () => {
            const biometricKey = 'valid-biometric-key';
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                biometricKey,
                password: "", createdAt: new Date(), updatedAt: new Date(),
            };

            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser);

            const result = await authService.validateBiometricKey(biometricKey);

            expect(result).toEqual(mockUser);
            expect(prismaService.user.findUnique).toHaveBeenCalledWith({
                where: {biometricKey},
            });
        });

        it('should return null with invalid biometric key', async () => {
            const biometricKey = 'invalid-biometric-key';

            jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

            const result = await authService.validateBiometricKey(biometricKey);

            expect(result).toBeNull();
        });
    });

    describe('generateToken', () => {
        it('should generate a valid JWT token', async () => {
            const user = {
                id: '1',
                email: 'test@example.com',
            };

            const result = authService.generateToken(user);

            expect(result).toEqual({
                access_token: 'mock-token',
            });
            expect(jwtService.sign).toHaveBeenCalledWith({
                sub: user.id,
                email: user.email,
            });
        });
    });
});