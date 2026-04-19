#!/usr/bin/env node

/**
 * Script de verificación para mssistemas
 * Ejecuta: npm run build && npm test
 */

import { execSync } from 'child_process';
import process from 'process';

console.log('🔍 Iniciando verificación de mssistemas...\n');

try {
  // Verificar TypeScript compila sin errores
  console.log('📦 Compilando TypeScript...');
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript compila sin errores\n');

  // Ejecutar tests
  console.log('🧪 Ejecutando tests...');
  execSync('npm test', { stdio: 'inherit' });
  console.log('✅ Todos los tests pasan\n');

  console.log('🎉 Verificación completada exitosamente!');
  process.exit(0);
} catch (error) {
  console.error('❌ Verificación falló:', error);
  process.exit(1);
}
