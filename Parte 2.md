# Parte 2 — AI for Growth: Reflexión técnica

---

## 1. El prompt — decisiones de diseño

### Arquitectura: dos capas

**System prompt** — rol y restricciones absolutas:
- Analista de riesgo de fintech B2B latinoamericana
- "NUNCA inventes datos que no estén en el input"
- Si faltan datos, declararlos explícitamente
- Output: JSON puro sin markdown ni backticks

**User prompt** — datos estructurados en dos secciones:

**Comportamiento financiero:**
- Total operaciones históricas y tasa de mora
- Volumen total y volumen últimos 30 días
- Días sin operar
- Productos utilizados (factoring, confirming, capital de trabajo)
- Línea de crédito aprobada, monto utilizado y tasa de utilización

**Señales de interacciones (enriquecidas):**
- Días desde último contacto
- Canal más frecuente (WhatsApp / email / llamada)
- Streak de contactos sin respuesta (señal fuerte de churn)
- Detalle de las últimas 5 interacciones con canal, fecha y resumen

### Por qué este diseño

**Separación system/user**: las instrucciones de comportamiento van en el system prompt; los datos variables en el user prompt. Mejora consistencia y reduce alucinaciones.

**Datos concretos, no narrativos**: en lugar de texto libre, datos estructurados por categoría. Más reproducible y menos ambiguo.

**Schema explícito con `confidence` y `data_gaps`**: el modelo declara qué tan seguro está de su evaluación y qué datos le faltaron. Esto es lo que diferencia un uso riguroso de LLMs de uno naïve.

**Línea de crédito como input**: la tasa de utilización (crédito usado / crédito aprobado) es uno de los indicadores más relevantes en lending. Una empresa con línea alta y utilización baja es oportunidad de expansión; con utilización muy alta puede estar sobre-endeudada.

**Señales de interacción enriquecidas**: no solo el texto de las últimas interacciones, sino métricas derivadas: días sin contacto, canal preferido, y si hay un patrón de no-respuesta. Un cliente que no contesta 3 veces seguidas es una señal clara que el modelo puede ponderar.

---

## 2. Output estructurado y validado

```json
{
  "health_score": 42,
  "churn_risk": "high",
  "summary": "Constructora Andes presenta señales mixtas...",
  "recommended_actions": [
    "Contacto directo para entender razones de inactividad",
    "Revisar operaciones en mora",
    "Validar si el interés en confirming se materializa"
  ],
  "confidence": "medium",
  "data_gaps": [
    "Estados financieros para contexto de solvencia",
    "Antigüedad de las operaciones en mora"
  ]
}
```

**Visibilidad en la UI**:
- `health_score` + `churn_risk`: progress circle con color semántico en listado y detalle
- `summary` + `recommended_actions`: card expandida en vista de detalle
- `confidence`: badge coloreado (verde/amarillo/rojo) visible debajo de las acciones
- `data_gaps`: badge con contador y tooltip al hacer hover — el KAM sabe qué información adicional mejoraría el análisis

---

## 3. Evaluación de calidad en producción

### Etapa 1 — Golden set inicial
20-30 empresas evaluadas manualmente por KAMs senior. Para cada empresa:
- KAM asigna `health_score` (0-100) y `churn_risk`
- KAM escribe las 3 acciones que tomaría

Métricas de comparación:
- MAE (Mean Absolute Error) para el score numérico → umbral: < 15 puntos
- Accuracy para `churn_risk` categórico → umbral: > 70%
- Revisión cualitativa de acciones recomendadas

### Etapa 2 — Feedback loop con KAMs
Botón de thumbs up/down en cada health score generado. Los thumbs down disparan revisión manual que alimenta el golden set. Con 50+ evaluaciones, el golden set se vuelve estadísticamente significativo.

### Etapa 3 — LLM-as-judge
Para escalar la evaluación sin revisión humana:
```
Dado el perfil de esta empresa y el health score generado,
evalúa si el análisis es: coherente / incoherente / alucinado.
```
Permite evaluar miles de outputs automáticamente y detectar degradación.

### Etapa 4 — Proxy metrics
Si las empresas con `churn_risk: high` churnan más que las de `low`, el modelo tiene poder predictivo real. Medir mensualmente:
- Churn rate por segmento de churn_risk
- Tasa de adopción de acciones recomendadas por KAMs

---

## 4. Costo y latencia a escala

### Configuración actual
- Modelo: Claude Haiku 3.5
- Tokens por empresa: ~1.000 input + ~350 output = ~1.350 tokens (prompt enriquecido)
- Modo: batch por KAM o individual por empresa

### Estimación a 10.000 empresas/mes

| Concepto | Cálculo | Total |
|---|---|---|
| Input tokens | 10.000 × 1.000 | 10M tokens |
| Output tokens | 10.000 × 350 | 3.5M tokens |
| Costo input (Haiku) | 10M × $0.80/1M | $8.00 |
| Costo output (Haiku) | 3.5M × $4.00/1M | $14.00 |
| **Total mensual** | | **~$22/mes** |

**Latencia**: ~1-2 segundos por empresa. Para 10.000 empresas con 10 workers en paralelo: ~20-30 minutos en batch nocturno.

### Optimizaciones para producción

**Batch processing nocturno**: regenerar solo empresas con actividad reciente (nuevas operaciones o interacciones). Reduce costo ~60%.

**Caché por empresa**: si los datos no cambiaron desde la última generación, reutilizar el score. Invalidar solo al detectar nueva operación o interacción.

**Priorización**: regenerar primero las empresas `at_risk` y las con operaciones recientes. Las `churned` con menor frecuencia.

---

## 5. Manejo de errores

### Falta de datos
Si una empresa tiene pocas operaciones, el modelo lo declara en `data_gaps` y el campo `confidence` refleja la incertidumbre. En el UI, el badge de "confianza baja" avisa al KAM que tome el score con cautela.

### Fallas del LLM
Tres niveles de manejo:
1. **Timeout / error de red**: el botón muestra mensaje de error claro en la UI; el score anterior se mantiene
2. **JSON inválido**: `parse_llm_response()` limpia backticks y formatos comunes antes de parsear
3. **Campos faltantes o fuera de rango**: validación explícita antes de guardar; `health_score` se clampea a [0, 100]; `churn_risk` tiene fallback a "medium"

---

## 6. Riesgos y mitigaciones

### Alucinaciones
**Riesgo**: el modelo inventa datos financieros o interacciones.
**Mitigación**: restricción explícita en system prompt + el campo `data_gaps` obliga a declarar qué no sabe + LLM-as-judge detecta incoherencias.

### Sesgos por sector o país
**Riesgo**: el modelo puede calificar peor a ciertos sectores sin justificación en datos.
**Mitigación**: monitorear distribución de scores por sector/país. Si hay diferencias no justificadas, ajustar el prompt.

### Decisiones incorrectas de negocio
**Riesgo**: KAM toma decisión basada en score incorrecto.
**Mitigación**: el score es una señal, no una orden. El badge de `confidence` informa la certeza. Los KAMs siempre tienen acceso al detalle completo. El feedback loop captura discrepancias.

### Dependencia del proveedor
**Riesgo**: cambios de precio o deprecación de modelo en Anthropic.
**Mitigación**: el prompt es agnóstico al modelo. La capa de abstracción en `health.py` permite cambiar de proveedor en un lugar. Alternativas evaluadas: Gemini Flash (gratuito), Llama 3 vía Groq (gratuito).

---

## Resumen ejecutivo

El sistema genera health scores usando Claude Haiku 3.5, con un costo estimado de ~$22/mes para 10.000 empresas. El prompt está enriquecido con señales financieras (línea de crédito, utilización) y de interacciones (días sin contacto, streak de no-respuesta). El modelo declara explícitamente su confianza y los datos que le faltaron. La calidad se evalúa con golden set, feedback loop en la UI y LLM-as-judge para escala. Los campos `confidence` y `data_gaps` son visibles en la interfaz para que el KAM tome decisiones informadas.

---

*JP Gazmuri Cervantes · Growth Engineer II · Xepelin*
