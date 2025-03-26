// src/auth/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
    (data: unknown, context: ExecutionContext) => {
        const ctx = GqlExecutionContext.create(context);
        const user = ctx.getContext().req.user; // Add console.log here to debug


        if (!user) {
            throw new Error('User not found in request');
        }

        return user;
    },
);