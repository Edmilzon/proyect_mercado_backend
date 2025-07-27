import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS para permitir peticiones desde el frontend
  app.enableCors({
    origin: [
      'http://localhost:3000',           // Next.js desarrollo
      'http://localhost:3001',           // Puerto alternativo
      'http://127.0.0.1:3000',          // IP local
      'http://127.0.0.1:3001',          // IP local alternativo
      'https://tienda-proyect.netlify.app', // Tu dominio específico de Netlify
      'https://*.netlify.app',          // Otros dominios de Netlify
      'https://*.vercel.app',           // Vercel deployments
      // Para desarrollo, puedes descomentar la siguiente línea para permitir todos los orígenes
      // '*',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
    ],
    credentials: true, // Para cookies y headers de autenticación
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Configurar prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 5000);
  
  console.log(`🚀 Servidor corriendo en puerto ${process.env.PORT ?? 5000}`);
  console.log(`🌐 CORS habilitado para desarrollo local y Netlify`);
}
bootstrap();
