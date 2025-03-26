import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { AuthService } from '../auth.service';
import {Request} from 'express';

@Injectable()
export class BiometricStrategy extends PassportStrategy(Strategy, 'biometric') {
    constructor(private authService: AuthService) {
        super();
    }

    async validate(request: Request): Promise<any> {
        const biometricKey = request.body['input']['biometricKey'];
        const user = await this.authService.validateBiometricKey(biometricKey);
        if (!user) {
            throw new UnauthorizedException('Invalid biometric key');
        }
        return user;
    }
}