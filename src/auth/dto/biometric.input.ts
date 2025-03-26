import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, Length } from 'class-validator';

@InputType()
export class BiometricInput {
    @Field()
    @IsNotEmpty()
    @Length(64, 64, { message: 'Biometric key must be 64 characters long' })
    biometricKey: string;
}