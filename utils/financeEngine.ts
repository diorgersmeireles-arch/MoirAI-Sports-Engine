/**
 * MoirAI Sports Engine — Módulo Financeiro e Inteligência de Valor
 * Desenvolvido por MADev
 *
 * Transforma dados brutos de probabilidades e odds em decisões financeiras
 * matemáticas usando Expected Value (EV) e o Critério de Kelly.
 * Todos os cálculos usam decimal.js para precisão absoluta.
 */

import Decimal from 'decimal.js';

Decimal.set({ precision: 20 });

// =============================================================================
// Interfaces de Retorno
// =============================================================================

export interface EVResult {
  expectedValue: number;     // Valor decimal (ex: 0.05 = 5% de EV)
  isValueBet: boolean;       // true se EV > 0
  recommendation: string;    // "Aposta de Valor Encontrada" | "Sem Valor"
}

export interface KellyResult {
  fraction: number;          // Fração da banca (0-1)
  currencyAmount: number;    // Valor em moeda
  percentage: number;        // Percentual da banca (0-100%)
  isFractional: boolean;     // true se usou fração (Kelly fracionário seguro)
}

// =============================================================================
// Funções Puras
// =============================================================================

/**
 * Calcula o Valor Esperado (EV) de uma aposta.
 *
 * EV = (Probabilidade_Real × Odds_Decimal) - 1
 *
 * Se EV > 0, a aposta tem valor esperado positivo e é marcada
 * como "Aposta de Valor Encontrada".
 * Se EV <= 0, a aposta não compensa estatisticamente.
 *
 * @param myProbability - Probabilidade real calculada pelo motor (0-1)
 * @param bookmakerOdds - Odd decimal oferecida pela casa (ex: 2.10)
 * @returns EVResult com a análise completa
 */
export function calculateExpectedValue(
  myProbability: number,
  bookmakerOdds: number
): EVResult {
  // Validação de entrada: probabilidade deve estar entre 0 e 1
  const prob = new Decimal(myProbability);
  const odds = new Decimal(bookmakerOdds);

  if (prob.lessThan(0) || prob.greaterThan(1)) {
    throw new Error(
      `Probabilidade deve estar entre 0 e 1. Recebido: ${myProbability}`
    );
  }
  if (odds.lessThanOrEqualTo(1)) {
    throw new Error(
      `Odds devem ser > 1.0 (decimal). Recebido: ${bookmakerOdds}`
    );
  }

  // EV = (P * O) - 1
  const ev = prob.times(odds).minus(1);
  const evNumber = ev.toNumber();

  return {
    expectedValue: evNumber,
    isValueBet: evNumber > 0,
    recommendation: evNumber > 0
      ? 'Aposta de Valor Encontrada'
      : 'Sem Valor Esperado Positivo',
  };
}

/**
 * Calcula o valor ideal a ser apostado usando o Critério de Kelly.
 *
 * Fórmula original:
 *   f* = (bp - q) / b
 *
 * Onde:
 *   b = odds decimais - 1 (lucro líquido por unidade apostada)
 *   p = probabilidade real de sucesso (0-1)
 *   q = 1 - p (probabilidade de falha)
 *
 * Para gestão conservadora de risco, retorna também o Kelly Fracionário (1/4),
 * que reduz a volatilidade e mitiga o risco de quebra em cenários
 * de overbetting devido a imprecisões nas probabilidades estimadas.
 *
 * @param myProbability - Probabilidade real calculada (0-1)
 * @param bookmakerOdds - Odd decimal oferecida
 * @param bankroll - Valor total da banca disponível
 * @param fractionalFraction - Fração do Kelly a usar (default: 0.25 = 1/4)
 * @returns KellyResult com valores em fração, moeda e percentual
 */
export function calculateKellyCriterion(
  myProbability: number,
  bookmakerOdds: number,
  bankroll: number,
  fractionalFraction: number = 0.25
): KellyResult {
  const p = new Decimal(myProbability);
  const b = new Decimal(bookmakerOdds).minus(1); // b = odds - 1
  const q = new Decimal(1).minus(p);
  const bankrollDec = new Decimal(bankroll);

  if (bankroll <= 0) {
    return {
      fraction: 0,
      currencyAmount: 0,
      percentage: 0,
      isFractional: false,
    };
  }

  // Kelly Cheio: f* = (b*p - q) / b
  let fullKelly: Decimal;
  if (b.isZero()) {
    fullKelly = new Decimal(0);
  } else {
    fullKelly = b.times(p).minus(q).div(b);
  }

  // Se Kelly for negativo, não apostar
  if (fullKelly.lessThanOrEqualTo(0)) {
    return {
      fraction: 0,
      currencyAmount: 0,
      percentage: 0,
      isFractional: false,
    };
  }

  // Aplica a fração conservadora (padrão: 1/4 Kelly)
  const fractionalKelly = fullKelly.times(fractionalFraction);
  const amount = fractionalKelly.times(bankrollDec);

  return {
    fraction: fractionalKelly.toNumber(),
    currencyAmount: amount.toNumber(),
    percentage: fractionalKelly.times(100).toNumber(),
    isFractional: fractionalFraction < 1,
  };
}
