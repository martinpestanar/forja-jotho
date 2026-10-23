export interface CountryInfo {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  samplePlaceholder: string;
  mobilePrefixRegex: RegExp;
  exactLength: number[];
}

export const SUPPORTED_COUNTRIES: CountryInfo[] = [
  {
    code: 'PE',
    name: 'Perú',
    dialCode: '+51',
    flag: '🇵🇪',
    samplePlaceholder: '987 654 321',
    mobilePrefixRegex: /^9\d{8}$/,
    exactLength: [9],
  },
  {
    code: 'MX',
    name: 'México',
    dialCode: '+52',
    flag: '🇲🇽',
    samplePlaceholder: '55 1234 5678',
    mobilePrefixRegex: /^[1-9]\d{9}$/,
    exactLength: [10],
  },
  {
    code: 'CO',
    name: 'Colombia',
    dialCode: '+57',
    flag: '🇨🇴',
    samplePlaceholder: '300 123 4567',
    mobilePrefixRegex: /^3\d{9}$/,
    exactLength: [10],
  },
  {
    code: 'AR',
    name: 'Argentina',
    dialCode: '+54',
    flag: '🇦🇷',
    samplePlaceholder: '9 11 1234 5678',
    mobilePrefixRegex: /^9?\d{10}$/,
    exactLength: [10, 11],
  },
  {
    code: 'CL',
    name: 'Chile',
    dialCode: '+56',
    flag: '🇨🇱',
    samplePlaceholder: '9 1234 5678',
    mobilePrefixRegex: /^9\d{8}$/,
    exactLength: [9],
  },
  {
    code: 'ES',
    name: 'España',
    dialCode: '+34',
    flag: '🇪🇸',
    samplePlaceholder: '612 345 678',
    mobilePrefixRegex: /^[67]\d{8}$/,
    exactLength: [9],
  },
  {
    code: 'US',
    name: 'Estados Unidos',
    dialCode: '+1',
    flag: '🇺🇸',
    samplePlaceholder: '202 555 0123',
    mobilePrefixRegex: /^[2-9]\d{9}$/,
    exactLength: [10],
  },
  {
    code: 'EC',
    name: 'Ecuador',
    dialCode: '+593',
    flag: '🇪🇨',
    samplePlaceholder: '99 123 4567',
    mobilePrefixRegex: /^9\d{8}$/,
    exactLength: [9],
  },
  {
    code: 'BO',
    name: 'Bolivia',
    dialCode: '+591',
    flag: '🇧🇴',
    samplePlaceholder: '7123 4567',
    mobilePrefixRegex: /^[67]\d{7}$/,
    exactLength: [8],
  },
];

export interface PhoneValidationResult {
  isValid: boolean;
  e164: string;
  errorMessage?: string;
  isWhatsAppEligible: boolean;
}

export function validateWhatsAppNumber(
  nationalNumber: string,
  country: CountryInfo
): PhoneValidationResult {
  // Remover espacios, guiones, paréntesis
  const cleanDigits = nationalNumber.replace(/\D/g, '');

  if (!cleanDigits) {
    return {
      isValid: false,
      e164: '',
      isWhatsAppEligible: false,
      errorMessage: 'Ingresa el número de WhatsApp móvil.',
    };
  }

  // Comprobar longitud
  if (!country.exactLength.includes(cleanDigits.length)) {
    return {
      isValid: false,
      e164: '',
      isWhatsAppEligible: false,
      errorMessage: `${country.name} requiere ${country.exactLength.join(' o ')} dígitos (ingresados: ${cleanDigits.length}).`,
    };
  }

  // Comprobar patrón móvil específico del país
  if (!country.mobilePrefixRegex.test(cleanDigits)) {
    return {
      isValid: false,
      e164: '',
      isWhatsAppEligible: false,
      errorMessage: `Número inválido para WhatsApp en ${country.name}. Ej: ${country.samplePlaceholder}`,
    };
  }

  // En Argentina WhatsApp requiere +54 9 ...
  let formattedNational = cleanDigits;
  if (country.code === 'AR' && !cleanDigits.startsWith('9')) {
    formattedNational = '9' + cleanDigits;
  }

  const e164 = `${country.dialCode}${formattedNational}`;

  return {
    isValid: true,
    e164,
    isWhatsAppEligible: true,
  };
}
