# Parte 2 — AI for Growth: Reflexión técnica

---

## 1. El prompt — decisiones de diseño

### Estructura elegida

Se usó un prompt con dos capas separadas:

**System prompt** — define el rol y las restricciones absolutas:
- Rol específico: analista de riesgo de fintech B2B latinoamericana
- Restricción explícita: "NUNCA inventes datos que no estén en el input"
- Formato: JSON puro, sin markdown ni backticks

**User prompt** — datos estructurados de la empresa con template fijo:
- Datos de comportamiento financiero (ops, mora, volumen, inactividad)
- Interacciones recientes (últimas 5, con canal y fecha)
- Schema JSON exacto que debe retornar

### Por qué este diseño

**Separación system/user:** Anthropic recomienda poner las instrucciones de comportamiento en el system prompt y los datos variables en el user prompt. Esto mejora la consistencia del output y reduce alucinaciones.

**Datos concretos, no narrativos:** en lugar de enviar un texto libre sobre la empresa, se estructuran los datos en categorías claras (financiero, interacciones). Esto reduce la ambigüedad y hace el prompt más reproducible.

**Schema explícito en el prompt:** pedir el JSON exacto con los campos y tipos esperados fuerza al modelo a seguir la estructura. Combinado con `parse_llm_response()` que limpia posibles backticks, el sistema es tolerante a pequeñas desviaciones del modelo.

**Campos `confidence` y `data_gaps`:** el modelo declara explícitamente qué tan seguro está de su evaluación y qué datos le faltaron. Esto es lo que diferencia un uso riguroso de LLMs de uno naïve — el sistema sabe cuándo no sabe.

---

## 2. Evaluación de calidad en producción

### Etapa 1 — Golden set inicial

Antes de lanzar a producción, construir un conjunto de 20-30 empresas evaluadas manualmente por KAMs senior. Para cada empresa:
- KAM asigna health_score (0-100) y churn_risk
- KAM escribe las 3 acciones que tomaría

Comparar la salida del LLM contra este benchmark usando:
- MAE (Mean Absolute Error) para el score numérico
- Accuracy para el churn_risk categórico
- Revisión cualitativa de las acciones recomendadas

**Umbral mínimo para producción:** MAE < 15 puntos, accuracy churn_risk > 70%.

### Etapa 2 — Feedback loop con KAMs

En la UI, agregar un mecanismo de feedback por cada health score generado:

```
¿Fue útil este análisis?  👍  👎
```

Los thumbs down disparan una revisión manual que alimenta el golden set. Con 50+ evaluaciones acumuladas, el golden set se vuelve estadísticamente significativo.

### Etapa 3 — LLM-as-judge

Para escalar la evaluación sin requerir revisión humana en cada caso, usar un segundo LLM (Claude Opus) como juez:

```
Dado el perfil de esta empresa y el health score generado,
evalúa si el análisis es: coherente / incoherente / alucinado.
Justifica en una oración.
```

Esto permite evaluar miles de outputs automáticamente y detectar degradación del modelo en el tiempo.

### Etapa 4 — Proxy metrics

La mejor validación es el mundo real: si las empresas con `churn_risk: high` efectivamente churnan más que las de `low`, el modelo tiene poder predictivo real. Medir mensualmente:

- Churn rate por segmento de churn_risk
- Tasa de conversión de acciones recomendadas ejecutadas por KAMs

---

## 3. Costo y latencia a escala

### Setup actual

- **Modelo:** Claude Haiku 3.5
- **Tokens por empresa:** ~800 input + ~300 output = ~1.100 tokens
- **Modo:** batch (generate-all por KAM)

### Estimación a 10.000 empresas/mes

| Concepto | Cálculo | Resultado |
|---|---|---|
| Input tokens | 10.000 × 800 | 8M tokens |
| Output tokens | 10.000 × 300 | 3M tokens |
| Costo input (Haiku) | 8M × $0.80/1M | $6.40 |
| Costo output (Haiku) | 3M × $4.00/1M | $12.00 |
| **Total mensual** | | **~$18.40/mes** |

**Latencia por empresa:** ~1-2 segundos con Haiku.
**Latencia para 10.000 empresas en paralelo (10 workers):** ~20-30 minutos.

### Optimizaciones para producción

**Batch processing nocturno:** no tiene sentido regenerar scores en tiempo real para todas las empresas. Un job nocturno que regenera solo las empresas con actividad reciente (nuevas operaciones, interacciones) reduce el costo ~60%.

**Caché por empresa:** si los datos de una empresa no cambiaron desde la última generación, reutilizar el score existente. Invalidar solo cuando hay nueva operación o interacción.

**Priorización:** regenerar primero las empresas `at_risk` y las que tienen operaciones recientes. Las empresas `churned` se regeneran con menor frecuencia.

---

## 4. Manejo de errores

### Falta de datos

Si una empresa tiene pocas operaciones o interacciones, el modelo lo declara explícitamente en `data_gaps`. En el sistema:

```python
if len(company.operations) < 3:
    # Agregar advertencia al prompt
    prompt += "\nNOTA: Esta empresa tiene datos limitados. 
               Sé explícito sobre la incertidumbre en tu evaluación."
```

El frontend muestra el badge de `confidence: low` cuando corresponde.

### Fallas del LLM

El sistema maneja tres tipos de fallo:

1. **Timeout / error de red:** retry automático hasta 3 veces con backoff exponencial
2. **JSON inválido:** `parse_llm_response()` limpia backticks y formatos comunes; si falla, se registra el error y se mantiene el score anterior
3. **Campos faltantes:** validación explícita de campos requeridos antes de guardar

### Outputs inválidos

Si el score retornado está fuera de rango (< 0 o > 100), o el churn_risk no es low/medium/high:

```python
data["health_score"] = max(0, min(100, data["health_score"]))
if data["churn_risk"] not in ["low", "medium", "high"]:
    data["churn_risk"] = "medium"  # fallback conservador
```

---

## 5. Riesgos y mitigaciones

### Alucinaciones

**Riesgo:** el modelo inventa datos financieros o inventa interacciones que no ocurrieron.

**Mitigación:**
- Instrucción explícita en system prompt: "NUNCA inventes datos"
- El prompt solo incluye datos verificados de la DB
- El campo `data_gaps` obliga al modelo a declarar qué no sabe
- LLM-as-judge detecta outputs incoherentes con los datos de entrada

### Sesgos del modelo

**Riesgo:** el modelo puede tener sesgos hacia ciertos sectores o países (ej: calificar peor a empresas de construcción por asociación con riesgo).

**Mitigación:**
- Monitorear distribución de scores por sector y país
- Si hay diferencias estadísticamente significativas no justificadas por datos, ajustar el prompt
- Incluir en el golden set empresas de todos los sectores y países

### Decisiones incorrectas de negocio

**Riesgo:** un KAM toma una decisión basada en un health score incorrecto (ej: no contactar a una empresa que en realidad está en riesgo).

**Mitigación:**
- El sistema muestra siempre el `confidence` del score
- Los KAMs son el último filtro — el score es una señal, no una orden
- Feedback loop captura cuando el KAM discrepa con el score
- Los scores no bloquean acciones: siempre se puede ver el detalle completo de la empresa

### Dependencia del proveedor

**Riesgo:** si Anthropic cambia precios o depreca el modelo, el sistema se ve afectado.

**Mitigación:**
- El prompt está diseñado para ser agnóstico al modelo
- La capa de abstracción en `health.py` permite cambiar de modelo en un lugar
- Alternativas evaluadas: Gemini Flash (gratis), Llama 3 vía Groq (gratis)

---

## Resumen ejecutivo para la presentación

> El sistema genera health scores usando Claude Haiku 3.5, con un costo estimado de ~$18/mes para 10.000 empresas. El prompt está diseñado para ser conservador — el modelo declara explícitamente su confianza y los datos que le faltaron. La calidad se evalúa con un golden set validado por KAMs, un feedback loop en la UI y LLM-as-judge para escala. Los principales riesgos (alucinaciones, sesgos, dependencia del proveedor) tienen mitigaciones concretas implementadas o planificadas.

---

*JP Gazmuri Cervantes · Growth Engineer II · Xepelin*
