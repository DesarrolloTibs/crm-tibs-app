import * as yup from 'yup';

/**
 * Expresión regular estricta para variables estándar de Meta: {{1}}, {{2}}, etc.
 */
export const META_VAR_REGEX = /\{\{(\d+)\}\}/g;

/**
 * Expresión regular para detectar cualquier uso de llaves dobles {{...}}
 */
export const ALL_DOUBLE_BRACKETS_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * Resultado del análisis del ratio Variable-to-Text de Meta
 */
export interface VariableRatioAnalysis {
  variableCount: number;
  variables: number[];
  fixedCharCount: number;
  fixedWordCount: number;
  isRatioValid: boolean;
  ratioStatus: 'no-variables' | 'optimal' | 'warning' | 'insufficient';
  ratioMessage: string;
}

/**
 * Analiza el cuerpo del mensaje para determinar si cumple con las reglas
 * de proporción paramétrica (Variable-to-Text ratio) de Meta y evitar
 * el error #2388293 ("The variable-to-text ratio is too high").
 */
export function analyzeVariableRatio(bodyText: string): VariableRatioAnalysis {
  if (!bodyText) {
    return {
      variableCount: 0,
      variables: [],
      fixedCharCount: 0,
      fixedWordCount: 0,
      isRatioValid: true,
      ratioStatus: 'no-variables',
      ratioMessage: 'Sin variables detectadas.',
    };
  }

  const matches = Array.from(bodyText.matchAll(META_VAR_REGEX));
  const variables = matches.map((m) => parseInt(m[1], 10));
  const variableCount = variables.length;

  const fixedText = bodyText.replace(META_VAR_REGEX, ' ').trim();
  const fixedCharCount = fixedText.length;
  const words = fixedText.split(/\s+/).filter(Boolean);
  const fixedWordCount = words.length;

  if (variableCount === 0) {
    return {
      variableCount: 0,
      variables: [],
      fixedCharCount,
      fixedWordCount,
      isRatioValid: true,
      ratioStatus: 'no-variables',
      ratioMessage: 'Mensaje estático sin variables.',
    };
  }

  // Regla de oro de Meta: al menos 6-10 palabras fijas y ~35 caracteres
  const minChars = 35;
  const minWords = Math.max(6, variableCount * 5);

  const passesChars = fixedCharCount >= minChars;
  const passesWords = fixedWordCount >= minWords;
  const isRatioValid = passesChars && passesWords;

  if (isRatioValid) {
    return {
      variableCount,
      variables,
      fixedCharCount,
      fixedWordCount,
      isRatioValid: true,
      ratioStatus: 'optimal',
      ratioMessage: 'Ratio óptimo de texto fijo para variables.',
    };
  }

  return {
    variableCount,
    variables,
    fixedCharCount,
    fixedWordCount,
    isRatioValid: false,
    ratioStatus: 'insufficient',
    ratioMessage:
      'La proporción entre variables y texto es insuficiente. Meta exige al menos 6 a 10 palabras (mínimo 35 caracteres) de texto fijo para evitar el rechazo con error #2388293.',
  };
}

/**
 * Esquema Yup estándar exclusivo para el cuerpo (bodyText).
 * Aplica todas las reglas matemáticas de variables, correlatividad y ratio de Meta.
 */
export const whatsappBodySchema = yup
  .string()
  .trim()
  .required('El cuerpo del mensaje es obligatorio.')
  .max(1024, 'El cuerpo del mensaje no puede exceder 1024 caracteres.')
  // 1. Formato numérico de variables ({{1}}, {{2}}, etc.)
  .test(
    'valid-variable-format',
    'Las variables deben ser numéricas estrictas entre llaves dobles, por ejemplo {{1}}, {{2}} o {{3}}.',
    (value) => {
      if (!value) return true;
      const allMatches = Array.from(value.matchAll(ALL_DOUBLE_BRACKETS_REGEX));
      for (const match of allMatches) {
        if (!/^\d+$/.test(match[1])) return false;
      }
      return true;
    }
  )
  // 2. Numeración correlativa empezando en 1 (Validación estricta de Meta)
  .test(
    'sequential-variables',
    'Las variables deben ser correlativas empezando en {{1}}.',
    (value, context) => {
      if (!value) return true;
      const matches = Array.from(value.matchAll(META_VAR_REGEX));
      if (matches.length === 0) return true;

      const numbers = matches.map((m) => parseInt(m[1], 10));
      const uniqueNumbers = Array.from(new Set(numbers)).sort((a, b) => a - b);

      if (uniqueNumbers[0] !== 1) {
        return context.createError({
          message:
            'Las variables de Meta deben comenzar obligatoriamente en {{1}}. Si usas {{2}} o {{3}}, debes incluir primero {{1}}.',
        });
      }

      for (let i = 0; i < uniqueNumbers.length; i++) {
        if (uniqueNumbers[i] !== i + 1) {
          return context.createError({
            message: `Las variables de Meta deben ser estrictamente correlativas empezando en {{1}} (ej. {{1}}, {{2}}, {{3}}). Falta la variable {{${i + 1}}}.`,
          });
        }
      }
      return true;
    }
  )
  // 3. No variables huérfanas
  .test(
    'no-orphan-variables',
    'La plantilla no puede contener únicamente variables sin texto contextual alrededor.',
    (value) => {
      if (!value) return true;
      const matches = Array.from(value.matchAll(META_VAR_REGEX));
      if (matches.length === 0) return true;

      const fixedText = value.replace(META_VAR_REGEX, '').trim();
      return fixedText.length > 0;
    }
  )
  // 4. Posición: ninguna línea puede tener solo variables
  .test(
    'variable-line-position',
    'Las variables no deben estar flotando solas en una línea sin texto que las acompañe.',
    (value) => {
      if (!value) return true;
      const lines = value.split(/\r?\n/);
      for (const line of lines) {
        if (line.includes('{{')) {
          const lineFixed = line.replace(META_VAR_REGEX, '').trim();
          if (lineFixed.length === 0) return false;
        }
      }
      return true;
    }
  )
  // 5. Ratio Variable-to-Text de Meta (Error #2388293)
  .test(
    'variable-to-text-ratio',
    'La proporción entre variables y texto es insuficiente. Meta exige al menos 6 a 10 palabras (mínimo 35 caracteres) de texto fijo para evitar el rechazo con error #2388293.',
    (value) => {
      if (!value) return true;
      const analysis = analyzeVariableRatio(value);
      return analysis.isRatioValid;
    }
  );

/**
 * Esquema Yup estándar del formulario completo de la Plantilla Base.
 */
export const whatsappBaseTemplateSchema = yup.object({
  headerText: yup
    .string()
    .trim()
    .max(60, 'El encabezado no puede exceder 60 caracteres.')
    .nullable(),

  bodyText: whatsappBodySchema,

  footerText: yup
    .string()
    .trim()
    .max(60, 'El pie de página no puede exceder 60 caracteres.')
    .nullable(),
});

export type WhatsAppBaseTemplateFormData = yup.InferType<typeof whatsappBaseTemplateSchema>;
