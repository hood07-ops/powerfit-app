export const CPS_ROUTE_CODES = Object.freeze({
  BOXING: 'BOXING',
  KICKBOXING: 'KICKBOXING',
});

export const CPS_TOMO_PRICE_CLP = 5000;

export const CPS_TOMOS = Object.freeze([
  { tomoNo: 1, title: 'Fundamentos del Peleador', priceClp: CPS_TOMO_PRICE_CLP },
  { tomoNo: 2, title: 'Técnica de Golpes', priceClp: CPS_TOMO_PRICE_CLP },
  { tomoNo: 3, title: 'Defensa y Movimiento', priceClp: CPS_TOMO_PRICE_CLP },
  { tomoNo: 4, title: 'Táctica y Estrategia', priceClp: CPS_TOMO_PRICE_CLP },
  { tomoNo: 5, title: 'Kickboxing y K1', priceClp: CPS_TOMO_PRICE_CLP },
  { tomoNo: 6, title: 'Fuerza y Potencia', priceClp: CPS_TOMO_PRICE_CLP },
  { tomoNo: 7, title: 'Resistencia y Conditioning', priceClp: CPS_TOMO_PRICE_CLP },
  { tomoNo: 8, title: 'Recuperación y Nutrición', priceClp: CPS_TOMO_PRICE_CLP },
  { tomoNo: 9, title: 'Preparación Mental', priceClp: CPS_TOMO_PRICE_CLP },
  { tomoNo: 10, title: 'Planificación del Entrenamiento', priceClp: CPS_TOMO_PRICE_CLP },
  { tomoNo: 11, title: 'Combate y Competencia', priceClp: CPS_TOMO_PRICE_CLP },
  { tomoNo: 12, title: 'Análisis Técnico y Video', priceClp: CPS_TOMO_PRICE_CLP },
]);

export const CPS_STAGES = Object.freeze({
  BOXING: Object.freeze([
    { order: 1, label: 'Boxeo Nivel 1', minimumMonths: 4, minimumExamScore: 75 },
    { order: 2, label: 'Boxeo Nivel 2', minimumMonths: 4, minimumExamScore: 75 },
    { order: 3, label: 'Boxeo Nivel 3', minimumMonths: 5, minimumExamScore: 78 },
    { order: 4, label: 'Boxeo Nivel 4', minimumMonths: 6, minimumExamScore: 80 },
    { order: 5, label: 'Boxeo Nivel 5', minimumMonths: 7, minimumExamScore: 82 },
    { order: 6, label: 'Boxeo Nivel 6', minimumMonths: 8, minimumExamScore: 85 },
    { order: 7, label: 'Boxeo Nivel 7', minimumMonths: 8, minimumExamScore: 85 },
  ]),
  KICKBOXING: Object.freeze([
    { order: 1, label: 'Blanco', minimumMonths: 4, minimumExamScore: 75 },
    { order: 2, label: 'Naranjo', minimumMonths: 4, minimumExamScore: 75 },
    { order: 3, label: 'Verde', minimumMonths: 5, minimumExamScore: 78 },
    { order: 4, label: 'Azul', minimumMonths: 6, minimumExamScore: 80 },
    { order: 5, label: 'Café', minimumMonths: 7, minimumExamScore: 82 },
    { order: 6, label: 'Café-Negro', minimumMonths: 8, minimumExamScore: 85 },
    { order: 7, label: 'Negro', minimumMonths: 8, minimumExamScore: 85 },
  ]),
});

export function getCpsTomo(tomoNo) {
  const normalized = Number(tomoNo);
  return CPS_TOMOS.find((tomo) => tomo.tomoNo === normalized) ?? null;
}

export function getCpsStage(routeCode, stageOrder) {
  const stages = CPS_STAGES[String(routeCode || '').toUpperCase()] ?? [];
  const normalized = Number(stageOrder);
  return stages.find((stage) => stage.order === normalized) ?? null;
}
