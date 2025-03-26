import {Test} from '@nestjs/testing';
import {AuthResolver} from './auth.resolver';
import {AuthService} from './auth.service';
import {UnauthorizedException} from '@nestjs/common';
import {RegisterInput} from './dto/register.input';
import {LoginInput} from './dto/login.input';
import {AuthResponse} from './entities/auth-response.entity';

describe('AuthResolver', () => {
    let authResolver: AuthResolver;
    let authService: AuthService;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [
                AuthResolver,
                {
                    provide: AuthService,
                    useValue: {
                        register: jest.fn(),
                        login: jest.fn(),
                        biometricLogin: jest.fn(),
                        setupBiometricKey: jest.fn(),
                    },
                },
            ],
        }).compile();

        authResolver = moduleRef.get<AuthResolver>(AuthResolver);
        authService = moduleRef.get<AuthService>(AuthService);
    });

    describe('register', () => {
        it('should register a new user', async () => {
            const mockInput: RegisterInput = {
                email: 'test@example.com',
                password: 'password123',
            };
            const mockResponse: AuthResponse = {
                access_token: 'mockToken',
            };

            jest.spyOn(authService, 'register').mockResolvedValue(mockResponse);

            const result = await authResolver.register(mockInput);
            expect(result).toEqual(mockResponse);
            expect(authService.register).toHaveBeenCalledWith(mockInput);
        });

        it('should throw error when registration fails', async () => {
            const mockInput: RegisterInput = {
                email: 'test@example.com',
                password: 'password123',
            };

            jest.spyOn(authService, 'register').mockRejectedValue(new Error('Registration failed'));

            await expect(authResolver.register(mockInput)).rejects.toThrow();
        });
    });

    describe('login', () => {
        it('should login a user', async () => {
            const mockInput: LoginInput = {
                email: 'test@example.com',
                password: 'password123',
            };
            const mockResponse: AuthResponse = {
                access_token: 'mockToken',

            };

            jest.spyOn(authService, 'login').mockResolvedValue(mockResponse);

            const result = await authResolver.login(mockInput);
            expect(result).toEqual(mockResponse);
            expect(authService.login).toHaveBeenCalledWith(mockInput);
        });

        it('should throw error when login fails', async () => {
            const mockInput: LoginInput = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };

            jest.spyOn(authService, 'login').mockRejectedValue(new UnauthorizedException());

            await expect(authResolver.login(mockInput)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('biometricLogin', () => {
        it('should login with biometric key', async () => {
            const mockInput = {biometricKey: 'device-fingerprint-123'};
            const mockResponse: AuthResponse = {
                access_token: 'mockToken'
            };

            jest.spyOn(authService, 'biometricLogin').mockResolvedValue(mockResponse);

            const result = await authResolver.biometricLogin(mockInput);
            expect(result).toEqual(mockResponse);
            expect(authService.biometricLogin).toHaveBeenCalledWith(mockInput.biometricKey);
        });

        it('should throw error when biometric login fails', async () => {
            const mockInput = {biometricKey: 'invalid-fingerprint'};

            jest.spyOn(authService, 'biometricLogin').mockRejectedValue(new UnauthorizedException());

            await expect(authResolver.biometricLogin(mockInput)).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('setupBiometric', () => {
        it('should setup biometric key for authenticated user', async () => {
            const mockUser = {id: '1'};
            const mockBiometricKey = 'new-fingerprint';

            jest.spyOn(authService, 'setupBiometricKey').mockResolvedValue(undefined);

            const result = await authResolver.setupBiometric(mockUser, mockBiometricKey);
            expect(result).toBe(true);
            expect(authService.setupBiometricKey).toHaveBeenCalledWith(mockUser.id, mockBiometricKey);
        });

        it('should throw error when user is not authenticated', async () => {
            const mockUser = ""; // or undefined
            const mockBiometricKey = 'new-fingerprint';

            await expect(authResolver.setupBiometric({id: mockUser}, mockBiometricKey))
                .rejects.toThrow(UnauthorizedException);
            expect(authService.setupBiometricKey).not.toHaveBeenCalled();
        });
    });
});