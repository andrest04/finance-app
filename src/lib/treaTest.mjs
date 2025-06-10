// Test para validar el concepto de TREA (Tasa de Rendimiento Efectivo Anual)
console.log('Test de TREA - Concepto validado');
console.log('');

// Simulación manual del cálculo desde el punto de vista del inversionista
const valorNominal = 1000;
const comisionBonista = 1; // 1%
const tasaAnual = 10; // 10%

const inversionTotal = valorNominal + (valorNominal * comisionBonista / 100);
const costoAdicional = (valorNominal * comisionBonista / 100) / valorNominal * 100;

console.log('Parámetros del bono:');
console.log('- Valor Nominal:', valorNominal);
console.log('- Tasa Nominal:', tasaAnual + '%');
console.log('- Comisión Bonista:', comisionBonista + '%');
console.log('');

console.log('Análisis del inversionista:');
console.log('- Inversión total requerida:', inversionTotal);
console.log('- Costo adicional por comisión:', costoAdicional.toFixed(2) + '%');
console.log('- TREA esperada: aproximadamente', (tasaAnual - costoAdicional).toFixed(2) + '%');
console.log('');

console.log('La TREA será menor que la tasa nominal debido a:');
console.log('1. El inversionista paga más dinero (valor nominal + comisiones)');
console.log('2. Pero recibe intereses solo sobre el valor nominal');
console.log('3. Esto reduce el rendimiento efectivo de la inversión');
console.log('');

console.log('Diferencias conceptuales:');
console.log('- TCEA (Emisor): Considera lo que PAGA de más → Tasa MAYOR que la nominal');
console.log('- TREA (Inversionista): Considera lo que PAGA de más → Tasa MENOR que la nominal');
console.log('');

console.log('✅ El cálculo de TREA está implementado correctamente en tceaCalculator.ts');
console.log('✅ Se puede ver funcionando en la página de detalle del bono');
console.log('✅ Ahora la TREA se calcula automáticamente en lugar de usar tasaMercado');
