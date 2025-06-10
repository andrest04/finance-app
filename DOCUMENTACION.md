# Documentación de la Aplicación Finance App

## Resumen Ejecutivo

**Finance App** es una aplicación web especializada en el cálculo y análisis de bonos corporativos utilizando exclusivamente el **método francés** de amortización. La aplicación proporciona herramientas completas para emisores e inversionistas en el mercado de bonos.

## Características Principales

### 🎯 Enfoque Único: Método Francés
- La aplicación se centra exclusivamente en el método francés de amortización
- No incluye métodos alternativos como alemán o americano
- Todas las funcionalidades están optimizadas para este método específico

### 📊 Funcionalidades Core

#### Para Emisores:
- **Registro de bonos** con parámetros completos del método francés
- **Dashboard personalizado** con métricas de sus bonos emitidos
- **Gestión de comisiones** de emisor en los cálculos

#### Para Inversionistas:
- **Análisis comparativo** de múltiples bonos
- **Análisis de sensibilidad** a cambios en tasas de descuento
- **Dashboard de inversión** con métricas relevantes
- **Cálculo de TREA** (Tasa de Rendimiento Efectivo Anual)

### 🔧 Herramientas de Análisis

#### Indicadores Financieros:
- **Duración de Macaulay**
- **Duración modificada**
- **Convexidad**
- **TCEA** (Tasa de Costo Efectivo Anual) para emisores
- **TREA** (Tasa de Rendimiento Efectivo Anual) para inversionistas

#### Comparación y Filtros:
- Comparación visual con gráficos de barras
- Filtros por moneda, plazo, tasa y emisor
- Ordenamiento por múltiples criterios
- Análisis de sensibilidad con gráficos de línea

## Arquitectura Técnica

### Frontend:
- **Next.js 14** con App Router
- **React 18** con TypeScript
- **Tailwind CSS** para estilos
- **Recharts** para visualizaciones
- **Shadcn/ui** para componentes

### Backend:
- **Firebase Firestore** para base de datos
- **Firebase Authentication** para gestión de usuarios
- **Vercel** para deployment

### Estructura de Archivos Clave:

```
src/
├── lib/
│   ├── francesMetod.ts          # Cálculos del método francés
│   ├── bonoUtils.ts             # Utilidades y operaciones CRUD
│   ├── indicadoresBono.ts       # Indicadores financieros
│   ├── tceaCalculator.ts        # Cálculo de TCEA/TREA
│   └── ...
├── components/
│   ├── ui/
│   │   ├── BonoForm.tsx         # Formulario de registro
│   │   ├── ComparadorBonos.tsx  # Comparación múltiple
│   │   ├── BonoCashFlowTable.tsx # Tabla de flujos
│   │   └── ...
│   └── bonos/
│       └── AnalisisSensibilidad.tsx # Análisis de sensibilidad
└── app/
    ├── bonos/                   # Páginas de gestión de bonos
    ├── emisor/                  # Dashboard de emisores
    └── inversionista/           # Dashboard de inversionistas
```

## Flujo de Datos del Método Francés

### 1. Parámetros de Entrada:
- Valor nominal
- Tasa de interés anual
- Frecuencia de pago
- Plazo en años
- Tipo de gracia (Ninguno, Total, Parcial)
- Número de períodos de gracia
- Comisiones (emisor y bonista)

### 2. Cálculos Realizados:
- **Cuota constante** usando la fórmula de anualidades
- **Flujo de caja período a período** con intereses decrecientes y amortización creciente
- **Períodos de gracia** con tratamiento específico según tipo
- **TCEA/TREA** usando método Newton-Raphson

### 3. Resultados Generados:
- Tabla completa de flujos de caja
- Indicadores de riesgo (duración, convexidad)
- Métricas de rentabilidad
- Análisis comparativo

## Roles y Permisos

### Emisor:
- ✅ Crear nuevos bonos
- ✅ Ver y editar sus propios bonos
- ✅ Dashboard con estadísticas de emisión
- ✅ Calcular TCEA de sus bonos

### Inversionista:
- ✅ Ver todos los bonos disponibles
- ✅ Comparar múltiples bonos
- ✅ Realizar análisis de sensibilidad
- ✅ Calcular TREA de inversiones
- ❌ No puede crear o editar bonos

## Estado Actual del Proyecto

### ✅ Implementado:
- [x] Sistema de autenticación y roles
- [x] Registro completo de bonos con método francés
- [x] Cálculo preciso de flujos de caja
- [x] Comparador visual de bonos
- [x] Análisis de sensibilidad
- [x] Dashboards responsivos para ambos roles
- [x] Indicadores financieros completos
- [x] Filtros y ordenamiento avanzado

### 🎯 Enfoque Confirmado:
- [x] Método francés como única metodología
- [x] Títulos y descripciones claramente identifican el método
- [x] Documentación específica del método francés
- [x] Comentarios en código reflejan este enfoque único

### 📱 Responsive Design:
- [x] Adaptado para móviles, tablets y desktop
- [x] Grids responsivos en comparadores
- [x] Navegación optimizada para todos los dispositivos

## Próximos Pasos Sugeridos

1. **Testing Exhaustivo**: Validar todos los cálculos del método francés
2. **Optimización de Performance**: Cachear resultados de cálculos complejos
3. **Exportación de Datos**: PDF/Excel de análisis y comparaciones
4. **Notificaciones**: Alertas para vencimientos próximos
5. **Histórico de Precios**: Tracking de cambios en tasas de mercado

## Conclusión

La aplicación Finance App está completamente enfocada en el método francés de amortización de bonos, proporcionando una suite completa de herramientas para emisores e inversionistas. La arquitectura es sólida, el diseño es responsivo, y todas las funcionalidades están alineadas con este enfoque específico y único.
