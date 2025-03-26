import {Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {PassportModule} from '@nestjs/passport';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {AuthResolver} from './auth.resolver';
import {AuthService} from './auth.service';
import {JwtStrategy} from './strategies/jwt.strategy';
import {PrismaService} from '../prisma/prisma.service';
import {BiometricStrategy} from './strategies/biometric.strategy';

@Module({
    imports: [
        PassportModule.register({defaultStrategy: 'jwt'}),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: config.get<string>('JWT_EXPIRES_IN', '1d') // Default to '1d' if not set
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [
        AuthResolver,
        AuthService,
        JwtStrategy,
        PrismaService,
        BiometricStrategy,
    ],
    exports: [JwtStrategy, PassportModule]
})
export class AuthModule {
}