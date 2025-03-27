import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Swagger Configuration
    const config = new DocumentBuilder()
        .setTitle('Authmify - nests + grapql test')
        .setDescription('API Description')
        .setVersion('1.0')
        .addBearerAuth() // For JWT support (matches @ApiBearerAuth() in  resolver)
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document); // Serves Swagger at `/api`

    await app.listen(8002);
}
bootstrap();