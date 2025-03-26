import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class BiometricGuard extends AuthGuard('biometric') {
    getRequest(context: ExecutionContext) {
        const ctx = GqlExecutionContext.create(context);
        const request = ctx.getContext().req;
        // Add the GraphQL args to the request body for passport-custom
        request.body = ctx.getArgs();
        return request;
    }
}