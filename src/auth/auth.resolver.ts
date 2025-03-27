import {Args, Mutation, Resolver} from '@nestjs/graphql';
import {AuthService} from './auth.service';
import {RegisterInput} from './dto/register.input';
import {LoginInput} from './dto/login.input';
import {BiometricInput} from './dto/biometric.input';
import {AuthResponse} from './entities/auth-response.entity';
import {UnauthorizedException, UseGuards} from '@nestjs/common';
import {JwtGuard} from './guards/jwt.guard';
import {CurrentUser} from './decorators/current-user.decorator';
import {BiometricGuard} from './guards/biometric.guard';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';

/**
 * GraphQL resolver for handling authentication operations.
 * Uses Swagger decorators for API documentation.
 */
@ApiTags('Authentication')  // Groups all auth endpoints in Swagger UI
@Resolver()  // Marks this as a GraphQL resolver class
export class AuthResolver {
    constructor(private readonly authService: AuthService) {}  // Inject AuthService

    /**
     * Register a new user
     * @param registerInput - User registration data (email + password)
     * @returns AuthResponse with JWT token
     */
    @ApiOperation({summary: 'Register a new user'})
    @ApiResponse({status: 201, description: 'User registered successfully', type: AuthResponse})
    @ApiResponse({status: 400, description: 'Bad request'})
    @ApiResponse({status: 409, description: 'Email already exists'})
    @Mutation(() => AuthResponse)  // GraphQL mutation that returns AuthResponse
    register(@Args('input') registerInput: RegisterInput) {
        return this.authService.register(registerInput);
    }

    /**
     * Authenticate user with email and password
     * @param loginInput - User credentials (email + password)
     * @returns AuthResponse with JWT token
     */
    @ApiOperation({summary: 'Login with email and password'})
    @ApiResponse({status: 200, description: 'Login successful', type: AuthResponse})
    @ApiResponse({status: 401, description: 'Invalid credentials'})
    @Mutation(() => AuthResponse)
    login(@Args('input') loginInput: LoginInput) {
        return this.authService.login(loginInput);
    }

    /**
     * Authenticate user with biometric key
     * @param biometricInput - Contains biometric authentication key
     * @returns AuthResponse with JWT token
     */
    @ApiOperation({summary: 'Login with biometric key'})
    @ApiResponse({status: 200, description: 'Biometric login successful', type: AuthResponse})
    @ApiResponse({status: 401, description: 'Invalid biometric key'})
    @Mutation(() => AuthResponse)
    @UseGuards(BiometricGuard)  // Protects endpoint with biometric validation
    // @UseGuards(ThrottlerGuard)  // Example: Could add rate limiting
    biometricLogin(@Args('input') biometricInput: BiometricInput) {
        return this.authService.biometricLogin(biometricInput.biometricKey);
    }

    /**
     * Associate a biometric key with the authenticated user
     * @param user - Current user from JWT
     * @param biometricKey - Unique biometric identifier
     * @returns Boolean indicating success
     * @throws UnauthorizedException if user is not authenticated
     */
    @ApiOperation({summary: 'Setup biometric key for user'})
    @ApiBearerAuth()  // Indicates this endpoint requires JWT in Swagger
    @ApiResponse({status: 200, description: 'Biometric key setup successfully'})
    @ApiResponse({status: 401, description: 'Unauthorized'})
    @Mutation(() => Boolean)
    @UseGuards(JwtGuard)  // Requires valid JWT token
    async setupBiometric(
        @CurrentUser() user: { id: string },  // Extracts user from JWT payload
        @Args('biometricKey') biometricKey: string,
    ) {


        // Additional security check (though JwtGuard should already verify this)
        if (!user?.id) {
            throw new UnauthorizedException('Invalid user session');
        }

        await this.authService.setupBiometricKey(user.id, biometricKey);
        return true;
    }
}