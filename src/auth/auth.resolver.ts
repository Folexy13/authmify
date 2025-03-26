import {Args, Mutation, Resolver} from '@nestjs/graphql';
import {AuthService} from './auth.service';
import {RegisterInput} from './dto/register.input';
import {LoginInput} from './dto/login.input';
import {BiometricInput} from './dto/biometric.input';
import {AuthResponse} from './entities/auth-response.entity';
import {UseGuards} from '@nestjs/common';
import {JwtGuard} from './guards/jwt.guard';
import {CurrentUser} from './decorators/current-user.decorator';
import {BiometricGuard} from './guards/biometric.guard';
import {ApiBearerAuth, ApiOperation, ApiResponse, ApiTags} from '@nestjs/swagger';

@ApiTags('Authentication')
@Resolver()
export class AuthResolver {
    constructor(private readonly authService: AuthService) {
    }

    @ApiOperation({summary: 'Register a new user'})
    @ApiResponse({status: 201, description: 'User registered successfully', type: AuthResponse})
    @ApiResponse({status: 400, description: 'Bad request'})
    @ApiResponse({status: 409, description: 'Email already exists'})
    @Mutation(() => AuthResponse)
    register(@Args('input') registerInput: RegisterInput) {
        return this.authService.register(registerInput);
    }

    @ApiOperation({summary: 'Login with email and password'})
    @ApiResponse({status: 200, description: 'Login successful', type: AuthResponse})
    @ApiResponse({status: 401, description: 'Invalid credentials'})
    @Mutation(() => AuthResponse)
    login(@Args('input') loginInput: LoginInput) {
        return this.authService.login(loginInput);
    }

    @ApiOperation({summary: 'Login with biometric key'})
    @ApiResponse({status: 200, description: 'Biometric login successful', type: AuthResponse})
    @ApiResponse({status: 401, description: 'Invalid biometric key'})
    @Mutation(() => AuthResponse)
    @UseGuards(BiometricGuard)
    // @UseGuards(ThrottlerGuard)
    biometricLogin(@Args('input') biometricInput: BiometricInput) {
        return this.authService.biometricLogin(biometricInput.biometricKey);
    }

    @ApiOperation({summary: 'Setup biometric key for user'})
    @ApiBearerAuth()
    @ApiResponse({status: 200, description: 'Biometric key setup successfully'})
    @ApiResponse({status: 401, description: 'Unauthorized'})
    @Mutation(() => Boolean)
    @UseGuards(JwtGuard)
    async setupBiometric(
        @CurrentUser() user: { id: string },
        @Args('biometricKey') biometricKey: string,
    ) {
        await this.authService.setupBiometricKey(user.id, biometricKey);
        return true;
    }
}

