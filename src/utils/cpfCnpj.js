/**
 * Validação de CPF e CNPJ com dígitos verificadores
 */

function cleanDocument(doc) {
  return doc.replace(/\D/g, '');
}

function calculateDigit(numbers, weights) {
  let sum = 0;
  for (let i = 0; i < numbers.length; i++) {
    sum += numbers[i] * weights[i];
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function validateCPF(cpf) {
  const cleaned = cleanDocument(cpf);

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false; // All digits same

  const numbers = cleaned.split('').map(Number);
  const weights1 = [10, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  const digit1 = calculateDigit(numbers.slice(0, 9), weights1);
  const digit2 = calculateDigit(numbers.slice(0, 10), weights2);

  return numbers[9] === digit1 && numbers[10] === digit2;
}

export function validateCNPJ(cnpj) {
  const cleaned = cleanDocument(cnpj);

  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false; // All digits same

  const numbers = cleaned.split('').map(Number);
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  const digit1 = calculateDigit(numbers.slice(0, 12), weights1);
  const digit2 = calculateDigit(numbers.slice(0, 13), weights2);

  return numbers[12] === digit1 && numbers[13] === digit2;
}

export function validateDocument(document, type) {
  const cleaned = cleanDocument(document);
  if (type === 'CPF') return validateCPF(cleaned);
  if (type === 'CNPJ') return validateCNPJ(cleaned);
  return false;
}

export function formatCPF(cpf) {
  const cleaned = cleanDocument(cpf);
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function formatCNPJ(cnpj) {
  const cleaned = cleanDocument(cnpj);
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}