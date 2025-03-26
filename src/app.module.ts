// src/app.module.ts
import {Module} from '@nestjs/common';
import {GraphQLModule} from '@nestjs/graphql';
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo';
import {AuthModule} from './auth/auth.module';
import {PrismaService} from './prisma/prisma.service';
import {PrismaModule} from './prisma/prisma.module';
import {join} from 'path';
import {ConfigModule} from '@nestjs/config';
import {AppResolver} from "./app.resolver";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true, // Makes ConfigService available everywhere
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
            driver: ApolloDriver,
            autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
            context: ({ req, res }) => ({ req, res }),
            playground: {
                settings: {
                    'request.credentials': 'include',
                },
            },

        }),
        AuthModule,
        PrismaModule,
    ],
    providers: [PrismaService, AppResolver],
})
export class AppModule {
}