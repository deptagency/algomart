#!/usr/bin/env node

import 'dotenv/config'

import { chunkArray } from './utils.mjs'

const countriesList = {
  AF: {
    flag_emoji: '🇦🇫',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Afghanistan',
      },
      {
        languageCode: 'es-ES',
        title: 'Afganistán',
      },
      {
        languageCode: 'fr-FR',
        title: 'Afghanistan',
      },
    ],
  },
  AX: {
    flag_emoji: '🇦🇽',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Åland Islands',
      },
      {
        languageCode: 'es-ES',
        title: 'Åland',
      },
      {
        languageCode: 'fr-FR',
        title: 'Îles Åland',
      },
    ],
  },
  AL: {
    flag_emoji: '🇦🇱',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Albania',
      },
      {
        languageCode: 'es-ES',
        title: 'Albania',
      },
      {
        languageCode: 'fr-FR',
        title: 'Albanie',
      },
    ],
  },
  DZ: {
    flag_emoji: '🇩🇿',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Algeria',
      },
      {
        languageCode: 'es-ES',
        title: 'Argelia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Algérie',
      },
    ],
  },
  AS: {
    flag_emoji: '🇦🇸',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'American Samoa',
      },
      {
        languageCode: 'es-ES',
        title: 'Samoa Americana',
      },
      {
        languageCode: 'fr-FR',
        title: 'Samoa américaines',
      },
    ],
  },
  AD: {
    flag_emoji: '🇦🇩',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Andorra',
      },
      {
        languageCode: 'es-ES',
        title: 'Andorra',
      },
      {
        languageCode: 'fr-FR',
        title: 'Andorre',
      },
    ],
  },
  AO: {
    flag_emoji: '🇦🇴',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Angola',
      },
      {
        languageCode: 'es-ES',
        title: 'Angola',
      },
      {
        languageCode: 'fr-FR',
        title: 'Angola',
      },
    ],
  },
  AI: {
    flag_emoji: '🇦🇮',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Anguilla',
      },
      {
        languageCode: 'es-ES',
        title: 'Anguila',
      },
      {
        languageCode: 'fr-FR',
        title: 'Anguilla',
      },
    ],
  },
  AQ: {
    flag_emoji: '🇦🇶',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Antarctica',
      },
      {
        languageCode: 'es-ES',
        title: 'Antártida',
      },
      {
        languageCode: 'fr-FR',
        title: 'Antarctique',
      },
    ],
  },
  AG: {
    flag_emoji: '🇦🇬',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Antigua and Barbuda',
      },
      {
        languageCode: 'es-ES',
        title: 'Antigua y Barbuda',
      },
      {
        languageCode: 'fr-FR',
        title: 'Antigua-et-Barbuda',
      },
    ],
  },
  AR: {
    flag_emoji: '🇦🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Argentina',
      },
      {
        languageCode: 'es-ES',
        title: 'Argentina',
      },
      {
        languageCode: 'fr-FR',
        title: 'Argentine',
      },
    ],
  },
  AM: {
    flag_emoji: '🇦🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Armenia',
      },
      {
        languageCode: 'es-ES',
        title: 'Armenia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Arménie',
      },
    ],
  },
  AW: {
    flag_emoji: '🇦🇼',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Aruba',
      },
      {
        languageCode: 'es-ES',
        title: 'Aruba',
      },
      {
        languageCode: 'fr-FR',
        title: 'Aruba',
      },
    ],
  },
  AU: {
    flag_emoji: '🇦🇺',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Australia',
      },
      {
        languageCode: 'es-ES',
        title: 'Australia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Australie',
      },
    ],
  },
  AT: {
    flag_emoji: '🇦🇹',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Austria',
      },
      {
        languageCode: 'es-ES',
        title: 'Austria',
      },
      {
        languageCode: 'fr-FR',
        title: 'Autriche',
      },
    ],
  },
  AZ: {
    flag_emoji: '🇦🇿',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Azerbaijan',
      },
      {
        languageCode: 'es-ES',
        title: 'Azerbaiyán',
      },
      {
        languageCode: 'fr-FR',
        title: 'Azerbaïdjan',
      },
    ],
  },
  BS: {
    flag_emoji: '🇧🇸',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Bahamas',
      },
      {
        languageCode: 'es-ES',
        title: 'Bahamas',
      },
      {
        languageCode: 'fr-FR',
        title: 'Bahamas',
      },
    ],
  },
  BH: {
    flag_emoji: '🇧🇭',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Bahrain',
      },
      {
        languageCode: 'es-ES',
        title: 'Baréin',
      },
      {
        languageCode: 'fr-FR',
        title: 'Bahreïn',
      },
    ],
  },
  BD: {
    flag_emoji: '🇧🇩',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Bangladesh',
      },
      {
        languageCode: 'es-ES',
        title: 'Bangladés',
      },
      {
        languageCode: 'fr-FR',
        title: 'Bangladesh',
      },
    ],
  },
  BB: {
    flag_emoji: '🇧🇧',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Barbados',
      },
      {
        languageCode: 'es-ES',
        title: 'Barbados',
      },
      {
        languageCode: 'fr-FR',
        title: 'Barbade',
      },
    ],
  },
  BY: {
    flag_emoji: '🇧🇾',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Belarus',
      },
      {
        languageCode: 'es-ES',
        title: 'Bielorrusia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Biélorussie',
      },
    ],
  },
  BE: {
    flag_emoji: '🇧🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Belgium',
      },
      {
        languageCode: 'es-ES',
        title: 'Bélgica',
      },
      {
        languageCode: 'fr-FR',
        title: 'Belgique',
      },
    ],
  },
  BZ: {
    flag_emoji: '🇧🇿',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Belize',
      },
      {
        languageCode: 'es-ES',
        title: 'Belice',
      },
      {
        languageCode: 'fr-FR',
        title: 'Belize',
      },
    ],
  },
  BJ: {
    flag_emoji: '🇧🇯',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Benin',
      },
      {
        languageCode: 'es-ES',
        title: 'Benín',
      },
      {
        languageCode: 'fr-FR',
        title: 'Bénin',
      },
    ],
  },
  BM: {
    flag_emoji: '🇧🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Bermuda',
      },
      {
        languageCode: 'es-ES',
        title: 'Bermudas',
      },
      {
        languageCode: 'fr-FR',
        title: 'Bermudes',
      },
    ],
  },
  BT: {
    flag_emoji: '🇧🇹',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Bhutan',
      },
      {
        languageCode: 'es-ES',
        title: 'Bután',
      },
      {
        languageCode: 'fr-FR',
        title: 'Bhoutan',
      },
    ],
  },
  BO: {
    flag_emoji: '🇧🇴',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Bolivia',
      },
      {
        languageCode: 'es-ES',
        title: 'Bolivia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Bolivie',
      },
    ],
  },
  BQ: {
    flag_emoji: '🇧🇶',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Bonaire, Sint Eustatius and Saba',
      },
      {
        languageCode: 'es-ES',
        title: 'Bonaire, San Eustaquio y Saba',
      },
      {
        languageCode: 'fr-FR',
        title: 'Pays-Bas caribéens',
      },
    ],
  },
  BA: {
    flag_emoji: '🇧🇦',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Bosnia and Herzegovina',
      },
      {
        languageCode: 'es-ES',
        title: 'Bosnia y Herzegovina',
      },
      {
        languageCode: 'fr-FR',
        title: 'Bosnie-Herzégovine',
      },
    ],
  },
  BW: {
    flag_emoji: '🇧🇼',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Botswana',
      },
      {
        languageCode: 'es-ES',
        title: 'Botsuana',
      },
      {
        languageCode: 'fr-FR',
        title: 'Botswana',
      },
    ],
  },
  BV: {
    flag_emoji: '🇧🇻',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Bouvet Island',
      },
      {
        languageCode: 'es-ES',
        title: 'Isla Bouvet',
      },
      {
        languageCode: 'fr-FR',
        title: 'Île Bouvet',
      },
    ],
  },
  BR: {
    flag_emoji: '🇧🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Brazil',
      },
      {
        languageCode: 'es-ES',
        title: 'Brasil',
      },
      {
        languageCode: 'fr-FR',
        title: 'Brésil',
      },
    ],
  },
  IO: {
    flag_emoji: '🇮🇴',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'British Indian Ocean Territory',
      },
      {
        languageCode: 'es-ES',
        title: 'Territorio Británico del Océano Índico',
      },
      {
        languageCode: 'fr-FR',
        title: "Territoire britannique de l'océan Indien",
      },
    ],
  },
  BN: {
    flag_emoji: '🇧🇳',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Brunei Darussalam',
      },
      {
        languageCode: 'es-ES',
        title: 'Brunéi',
      },
      {
        languageCode: 'fr-FR',
        title: 'Brunei',
      },
    ],
  },
  BG: {
    flag_emoji: '🇧🇬',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Bulgaria',
      },
      {
        languageCode: 'es-ES',
        title: 'Bulgaria',
      },
      {
        languageCode: 'fr-FR',
        title: 'Bulgarie',
      },
    ],
  },
  BF: {
    flag_emoji: '🇧🇫',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Burkina Faso',
      },
      {
        languageCode: 'es-ES',
        title: 'Burkina Faso',
      },
      {
        languageCode: 'fr-FR',
        title: 'Burkina Faso',
      },
    ],
  },
  BI: {
    flag_emoji: '🇧🇮',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Burundi',
      },
      {
        languageCode: 'es-ES',
        title: 'Burundi',
      },
      {
        languageCode: 'fr-FR',
        title: 'Burundi',
      },
    ],
  },
  KH: {
    flag_emoji: '🇰🇭',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Cambodia',
      },
      {
        languageCode: 'es-ES',
        title: 'Camboya',
      },
      {
        languageCode: 'fr-FR',
        title: 'Cambodge',
      },
    ],
  },
  CM: {
    flag_emoji: '🇨🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Cameroon',
      },
      {
        languageCode: 'es-ES',
        title: 'Camerún',
      },
      {
        languageCode: 'fr-FR',
        title: 'Cameroun',
      },
    ],
  },
  CA: {
    flag_emoji: '🇨🇦',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Canada',
      },
      {
        languageCode: 'es-ES',
        title: 'Canadá',
      },
      {
        languageCode: 'fr-FR',
        title: 'Canada',
      },
    ],
  },
  CV: {
    flag_emoji: '🇨🇻',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Cabo Verde',
      },
      {
        languageCode: 'es-ES',
        title: 'Cabo Verde',
      },
      {
        languageCode: 'fr-FR',
        title: 'Cap-Vert',
      },
    ],
  },
  KY: {
    flag_emoji: '🇰🇾',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Cayman Islands',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Caimán',
      },
      {
        languageCode: 'fr-FR',
        title: 'Îles Caïmans',
      },
    ],
  },
  CF: {
    flag_emoji: '🇨🇫',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Central African Republic',
      },
      {
        languageCode: 'es-ES',
        title: 'República Centroafricana',
      },
      {
        languageCode: 'fr-FR',
        title: 'République centrafricaine',
      },
    ],
  },
  TD: {
    flag_emoji: '🇹🇩',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Chad',
      },
      {
        languageCode: 'es-ES',
        title: 'Chad',
      },
      {
        languageCode: 'fr-FR',
        title: 'Tchad',
      },
    ],
  },
  CL: {
    flag_emoji: '🇨🇱',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Chile',
      },
      {
        languageCode: 'es-ES',
        title: 'Chile',
      },
      {
        languageCode: 'fr-FR',
        title: 'Chili',
      },
    ],
  },
  CN: {
    flag_emoji: '🇨🇳',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'China',
      },
      {
        languageCode: 'es-ES',
        title: 'China',
      },
      {
        languageCode: 'fr-FR',
        title: 'Chine',
      },
    ],
  },
  CX: {
    flag_emoji: '🇨🇽',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Christmas Island',
      },
      {
        languageCode: 'es-ES',
        title: 'Isla de Navidad',
      },
      {
        languageCode: 'fr-FR',
        title: 'Île Christmas',
      },
    ],
  },
  CC: {
    flag_emoji: '🇨🇨',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Cocos (Keeling) Islands',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Cocos',
      },
      {
        languageCode: 'fr-FR',
        title: 'Îles Cocos',
      },
    ],
  },
  CO: {
    flag_emoji: '🇨🇴',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Colombia',
      },
      {
        languageCode: 'es-ES',
        title: 'Colombia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Colombie',
      },
    ],
  },
  KM: {
    flag_emoji: '🇰🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Comoros',
      },
      {
        languageCode: 'es-ES',
        title: 'Comoras',
      },
      {
        languageCode: 'fr-FR',
        title: 'Comores',
      },
    ],
  },
  CG: {
    flag_emoji: '🇨🇬',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Congo',
      },
      {
        languageCode: 'es-ES',
        title: 'República del Congo',
      },
      {
        languageCode: 'fr-FR',
        title: 'République du Congo',
      },
    ],
  },
  CD: {
    flag_emoji: '🇨🇩',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Congo, Democratic Republic of the',
      },
      {
        languageCode: 'es-ES',
        title: 'República Democrática del Congo',
      },
      {
        languageCode: 'fr-FR',
        title: 'République démocratique du Congo',
      },
    ],
  },
  CK: {
    flag_emoji: '🇨🇰',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Cook Islands',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Cook',
      },
      {
        languageCode: 'fr-FR',
        title: 'Îles Cook',
      },
    ],
  },
  CR: {
    flag_emoji: '🇨🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Costa Rica',
      },
      {
        languageCode: 'es-ES',
        title: 'Costa Rica',
      },
      {
        languageCode: 'fr-FR',
        title: 'Costa Rica',
      },
    ],
  },
  CI: {
    flag_emoji: '🇨🇮',
    translations: [
      {
        languageCode: 'en-UK',
        title: "Côte d'Ivoire",
      },
      {
        languageCode: 'es-ES',
        title: 'Costa de Marfil',
      },
      {
        languageCode: 'fr-FR',
        title: "Côte d'Ivoire",
      },
    ],
  },
  HR: {
    flag_emoji: '🇭🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Croatia',
      },
      {
        languageCode: 'es-ES',
        title: 'Croacia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Croatie',
      },
    ],
  },
  CU: {
    flag_emoji: '🇨🇺',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Cuba',
      },
      {
        languageCode: 'es-ES',
        title: 'Cuba',
      },
      {
        languageCode: 'fr-FR',
        title: 'Cuba',
      },
    ],
  },
  CW: {
    flag_emoji: '🇨🇼',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Curaçao',
      },
      {
        languageCode: 'es-ES',
        title: 'Curazao',
      },
      {
        languageCode: 'fr-FR',
        title: 'Curaçao',
      },
    ],
  },
  CY: {
    flag_emoji: '🇨🇾',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Cyprus',
      },
      {
        languageCode: 'es-ES',
        title: 'Chipre',
      },
      {
        languageCode: 'fr-FR',
        title: 'Chypre (pays)',
      },
    ],
  },
  CZ: {
    flag_emoji: '🇨🇿',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Czechia',
      },
      {
        languageCode: 'es-ES',
        title: 'República Checa',
      },
      {
        languageCode: 'fr-FR',
        title: 'Tchéquie',
      },
    ],
  },
  DK: {
    flag_emoji: '🇩🇰',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Denmark',
      },
      {
        languageCode: 'es-ES',
        title: 'Dinamarca',
      },
      {
        languageCode: 'fr-FR',
        title: 'Danemark',
      },
    ],
  },
  DJ: {
    flag_emoji: '🇩🇯',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Djibouti',
      },
      {
        languageCode: 'es-ES',
        title: 'Yibuti',
      },
      {
        languageCode: 'fr-FR',
        title: 'Djibouti',
      },
    ],
  },
  DM: {
    flag_emoji: '🇩🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Dominica',
      },
      {
        languageCode: 'es-ES',
        title: 'Dominica',
      },
      {
        languageCode: 'fr-FR',
        title: 'Dominique',
      },
    ],
  },
  DO: {
    flag_emoji: '🇩🇴',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Dominican Republic',
      },
      {
        languageCode: 'es-ES',
        title: 'República Dominicana',
      },
      {
        languageCode: 'fr-FR',
        title: 'République dominicaine',
      },
    ],
  },
  EC: {
    flag_emoji: '🇪🇨',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Ecuador',
      },
      {
        languageCode: 'es-ES',
        title: 'Ecuador',
      },
      {
        languageCode: 'fr-FR',
        title: 'Équateur',
      },
    ],
  },
  EG: {
    flag_emoji: '🇪🇬',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Egypt',
      },
      {
        languageCode: 'es-ES',
        title: 'Egipto',
      },
      {
        languageCode: 'fr-FR',
        title: 'Égypte',
      },
    ],
  },
  SV: {
    flag_emoji: '🇸🇻',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'El Salvador',
      },
      {
        languageCode: 'es-ES',
        title: 'El Salvador',
      },
      {
        languageCode: 'fr-FR',
        title: 'Salvador',
      },
    ],
  },
  GQ: {
    flag_emoji: '🇬🇶',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Equatorial Guinea',
      },
      {
        languageCode: 'es-ES',
        title: 'Guinea Ecuatorial',
      },
      {
        languageCode: 'fr-FR',
        title: 'Guinée équatoriale',
      },
    ],
  },
  ER: {
    flag_emoji: '🇪🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Eritrea',
      },
      {
        languageCode: 'es-ES',
        title: 'Eritrea',
      },
      {
        languageCode: 'fr-FR',
        title: 'Érythrée',
      },
    ],
  },
  EE: {
    flag_emoji: '🇪🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Estonia',
      },
      {
        languageCode: 'es-ES',
        title: 'Estonia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Estonie',
      },
    ],
  },
  ET: {
    flag_emoji: '🇪🇹',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Ethiopia',
      },
      {
        languageCode: 'es-ES',
        title: 'Etiopía',
      },
      {
        languageCode: 'fr-FR',
        title: 'Éthiopie',
      },
    ],
  },
  FK: {
    flag_emoji: '🇫🇰',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Falkland Islands (Malvinas)',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Malvinas',
      },
      {
        languageCode: 'fr-FR',
        title: 'Malouines',
      },
    ],
  },
  FO: {
    flag_emoji: '🇫🇴',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Faroe Islands',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Feroe',
      },
      {
        languageCode: 'fr-FR',
        title: 'Îles Féroé',
      },
    ],
  },
  FJ: {
    flag_emoji: '🇫🇯',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Fiji',
      },
      {
        languageCode: 'es-ES',
        title: 'Fiyi',
      },
      {
        languageCode: 'fr-FR',
        title: 'Fidji',
      },
    ],
  },
  FI: {
    flag_emoji: '🇫🇮',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Finland',
      },
      {
        languageCode: 'es-ES',
        title: 'Finlandia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Finlande',
      },
    ],
  },
  FR: {
    flag_emoji: '🇫🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'France',
      },
      {
        languageCode: 'es-ES',
        title: 'Francia',
      },
      {
        languageCode: 'fr-FR',
        title: 'France',
      },
    ],
  },
  GF: {
    flag_emoji: '🇬🇫',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'French Guiana',
      },
      {
        languageCode: 'es-ES',
        title: 'Guayana Francesa',
      },
      {
        languageCode: 'fr-FR',
        title: 'Guyane',
      },
    ],
  },
  PF: {
    flag_emoji: '🇵🇫',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'French Polynesia',
      },
      {
        languageCode: 'es-ES',
        title: 'Polinesia Francesa',
      },
      {
        languageCode: 'fr-FR',
        title: 'Polynésie française',
      },
    ],
  },
  TF: {
    flag_emoji: '🇹🇫',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'French Southern Territories',
      },
      {
        languageCode: 'es-ES',
        title: 'Tierras Australes y Antárticas Francesas',
      },
      {
        languageCode: 'fr-FR',
        title: 'Terres australes et antarctiques françaises',
      },
    ],
  },
  GA: {
    flag_emoji: '🇬🇦',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Gabon',
      },
      {
        languageCode: 'es-ES',
        title: 'Gabón',
      },
      {
        languageCode: 'fr-FR',
        title: 'Gabon',
      },
    ],
  },
  GM: {
    flag_emoji: '🇬🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Gambia',
      },
      {
        languageCode: 'es-ES',
        title: 'Gambia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Gambie',
      },
    ],
  },
  GE: {
    flag_emoji: '🇬🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Georgia',
      },
      {
        languageCode: 'es-ES',
        title: 'Georgia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Géorgie',
      },
    ],
  },
  DE: {
    flag_emoji: '🇩🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Germany',
      },
      {
        languageCode: 'es-ES',
        title: 'Alemania',
      },
      {
        languageCode: 'fr-FR',
        title: 'Allemagne',
      },
    ],
  },
  GH: {
    flag_emoji: '🇬🇭',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Ghana',
      },
      {
        languageCode: 'es-ES',
        title: 'Ghana',
      },
      {
        languageCode: 'fr-FR',
        title: 'Ghana',
      },
    ],
  },
  GI: {
    flag_emoji: '🇬🇮',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Gibraltar',
      },
      {
        languageCode: 'es-ES',
        title: 'Gibraltar',
      },
      {
        languageCode: 'fr-FR',
        title: 'Gibraltar',
      },
    ],
  },
  GR: {
    flag_emoji: '🇬🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Greece',
      },
      {
        languageCode: 'es-ES',
        title: 'Grecia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Grèce',
      },
    ],
  },
  GL: {
    flag_emoji: '🇬🇱',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Greenland',
      },
      {
        languageCode: 'es-ES',
        title: 'Groenlandia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Groenland',
      },
    ],
  },
  GD: {
    flag_emoji: '🇬🇩',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Grenada',
      },
      {
        languageCode: 'es-ES',
        title: 'Granada',
      },
      {
        languageCode: 'fr-FR',
        title: 'Grenade',
      },
    ],
  },
  GP: {
    flag_emoji: '🇬🇵',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Guadeloupe',
      },
      {
        languageCode: 'es-ES',
        title: 'Guadalupe',
      },
      {
        languageCode: 'fr-FR',
        title: 'Guadeloupe',
      },
    ],
  },
  GU: {
    flag_emoji: '🇬🇺',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Guam',
      },
      {
        languageCode: 'es-ES',
        title: 'Guam',
      },
      {
        languageCode: 'fr-FR',
        title: 'Guam',
      },
    ],
  },
  GT: {
    flag_emoji: '🇬🇹',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Guatemala',
      },
      {
        languageCode: 'es-ES',
        title: 'Guatemala',
      },
      {
        languageCode: 'fr-FR',
        title: 'Guatemala',
      },
    ],
  },
  GG: {
    flag_emoji: '🇬🇬',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Guernsey',
      },
      {
        languageCode: 'es-ES',
        title: 'Guernsey',
      },
      {
        languageCode: 'fr-FR',
        title: 'Guernesey',
      },
    ],
  },
  GN: {
    flag_emoji: '🇬🇳',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Guinea',
      },
      {
        languageCode: 'es-ES',
        title: 'Guinea',
      },
      {
        languageCode: 'fr-FR',
        title: 'Guinée',
      },
    ],
  },
  GW: {
    flag_emoji: '🇬🇼',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Guinea-Bissau',
      },
      {
        languageCode: 'es-ES',
        title: 'Guinea-Bisáu',
      },
      {
        languageCode: 'fr-FR',
        title: 'Guinée-Bissau',
      },
    ],
  },
  GY: {
    flag_emoji: '🇬🇾',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Guyana',
      },
      {
        languageCode: 'es-ES',
        title: 'Guyana',
      },
      {
        languageCode: 'fr-FR',
        title: 'Guyana',
      },
    ],
  },
  HT: {
    flag_emoji: '🇭🇹',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Haiti',
      },
      {
        languageCode: 'es-ES',
        title: 'Haití',
      },
      {
        languageCode: 'fr-FR',
        title: 'Haïti',
      },
    ],
  },
  HM: {
    flag_emoji: '🇭🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Heard Island and McDonald Islands',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Heard y McDonald',
      },
      {
        languageCode: 'fr-FR',
        title: 'Îles Heard-et-MacDonald',
      },
    ],
  },
  VA: {
    flag_emoji: '🇻🇦',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Holy See',
      },
      {
        languageCode: 'es-ES',
        title: 'Vaticano, Ciudad del',
      },
      {
        languageCode: 'fr-FR',
        title: 'Saint-Siège (État de la Cité du Vatican)',
      },
    ],
  },
  HN: {
    flag_emoji: '🇭🇳',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Honduras',
      },
      {
        languageCode: 'es-ES',
        title: 'Honduras',
      },
      {
        languageCode: 'fr-FR',
        title: 'Honduras',
      },
    ],
  },
  HK: {
    flag_emoji: '🇭🇰',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Hong Kong',
      },
      {
        languageCode: 'es-ES',
        title: 'Hong Kong',
      },
      {
        languageCode: 'fr-FR',
        title: 'Hong Kong',
      },
    ],
  },
  HU: {
    flag_emoji: '🇭🇺',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Hungary',
      },
      {
        languageCode: 'es-ES',
        title: 'Hungría',
      },
      {
        languageCode: 'fr-FR',
        title: 'Hongrie',
      },
    ],
  },
  IS: {
    flag_emoji: '🇮🇸',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Iceland',
      },
      {
        languageCode: 'es-ES',
        title: 'Islandia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Islande',
      },
    ],
  },
  IN: {
    flag_emoji: '🇮🇳',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'India',
      },
      {
        languageCode: 'es-ES',
        title: 'India',
      },
      {
        languageCode: 'fr-FR',
        title: 'Inde',
      },
    ],
  },
  ID: {
    flag_emoji: '🇮🇩',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Indonesia',
      },
      {
        languageCode: 'es-ES',
        title: 'Indonesia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Indonésie',
      },
    ],
  },
  IR: {
    flag_emoji: '🇮🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Iran',
      },
      {
        languageCode: 'es-ES',
        title: 'Irán',
      },
      {
        languageCode: 'fr-FR',
        title: 'Iran',
      },
    ],
  },
  IQ: {
    flag_emoji: '🇮🇶',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Iraq',
      },
      {
        languageCode: 'es-ES',
        title: 'Irak',
      },
      {
        languageCode: 'fr-FR',
        title: 'Irak',
      },
    ],
  },
  IE: {
    flag_emoji: '🇮🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Ireland',
      },
      {
        languageCode: 'es-ES',
        title: 'Irlanda',
      },
      {
        languageCode: 'fr-FR',
        title: 'Irlande',
      },
    ],
  },
  IM: {
    flag_emoji: '🇮🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Isle of Man',
      },
      {
        languageCode: 'es-ES',
        title: 'Isla de Man',
      },
      {
        languageCode: 'fr-FR',
        title: 'Île de Man',
      },
    ],
  },
  IL: {
    flag_emoji: '🇮🇱',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Israel',
      },
      {
        languageCode: 'es-ES',
        title: 'Israel',
      },
      {
        languageCode: 'fr-FR',
        title: 'Israël',
      },
    ],
  },
  IT: {
    flag_emoji: '🇮🇹',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Italy',
      },
      {
        languageCode: 'es-ES',
        title: 'Italia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Italie',
      },
    ],
  },
  JM: {
    flag_emoji: '🇯🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Jamaica',
      },
      {
        languageCode: 'es-ES',
        title: 'Jamaica',
      },
      {
        languageCode: 'fr-FR',
        title: 'Jamaïque',
      },
    ],
  },
  JP: {
    flag_emoji: '🇯🇵',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Japan',
      },
      {
        languageCode: 'es-ES',
        title: 'Japón',
      },
      {
        languageCode: 'fr-FR',
        title: 'Japon',
      },
    ],
  },
  JE: {
    flag_emoji: '🇯🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Jersey',
      },
      {
        languageCode: 'es-ES',
        title: 'Jersey',
      },
      {
        languageCode: 'fr-FR',
        title: 'Jersey',
      },
    ],
  },
  JO: {
    flag_emoji: '🇯🇴',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Jordan',
      },
      {
        languageCode: 'es-ES',
        title: 'Jordania',
      },
      {
        languageCode: 'fr-FR',
        title: 'Jordanie',
      },
    ],
  },
  KZ: {
    flag_emoji: '🇰🇿',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Kazakhstan',
      },
      {
        languageCode: 'es-ES',
        title: 'Kazajistán',
      },
      {
        languageCode: 'fr-FR',
        title: 'Kazakhstan',
      },
    ],
  },
  KE: {
    flag_emoji: '🇰🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Kenya',
      },
      {
        languageCode: 'es-ES',
        title: 'Kenia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Kenya',
      },
    ],
  },
  KI: {
    flag_emoji: '🇰🇮',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Kiribati',
      },
      {
        languageCode: 'es-ES',
        title: 'Kiribati',
      },
      {
        languageCode: 'fr-FR',
        title: 'Kiribati',
      },
    ],
  },
  KP: {
    flag_emoji: '🇰🇵',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'North Korea',
      },
      {
        languageCode: 'es-ES',
        title: 'Corea del Norte',
      },
      {
        languageCode: 'fr-FR',
        title: 'Corée du Nord',
      },
    ],
  },
  KR: {
    flag_emoji: '🇰🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'South Korea',
      },
      {
        languageCode: 'es-ES',
        title: 'Corea del Sur',
      },
      {
        languageCode: 'fr-FR',
        title: 'Corée du Sud',
      },
    ],
  },
  KW: {
    flag_emoji: '🇰🇼',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Kuwait',
      },
      {
        languageCode: 'es-ES',
        title: 'Kuwait',
      },
      {
        languageCode: 'fr-FR',
        title: 'Koweït',
      },
    ],
  },
  KG: {
    flag_emoji: '🇰🇬',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Kyrgyzstan',
      },
      {
        languageCode: 'es-ES',
        title: 'Kirguistán',
      },
      {
        languageCode: 'fr-FR',
        title: 'Kirghizistan',
      },
    ],
  },
  LA: {
    flag_emoji: '🇱🇦',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Laos',
      },
      {
        languageCode: 'es-ES',
        title: 'Laos',
      },
      {
        languageCode: 'fr-FR',
        title: 'Laos',
      },
    ],
  },
  LV: {
    flag_emoji: '🇱🇻',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Latvia',
      },
      {
        languageCode: 'es-ES',
        title: 'Letonia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Lettonie',
      },
    ],
  },
  LB: {
    flag_emoji: '🇱🇧',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Lebanon',
      },
      {
        languageCode: 'es-ES',
        title: 'Líbano',
      },
      {
        languageCode: 'fr-FR',
        title: 'Liban',
      },
    ],
  },
  LS: {
    flag_emoji: '🇱🇸',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Lesotho',
      },
      {
        languageCode: 'es-ES',
        title: 'Lesoto',
      },
      {
        languageCode: 'fr-FR',
        title: 'Lesotho',
      },
    ],
  },
  LR: {
    flag_emoji: '🇱🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Liberia',
      },
      {
        languageCode: 'es-ES',
        title: 'Liberia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Liberia',
      },
    ],
  },
  LY: {
    flag_emoji: '🇱🇾',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Libya',
      },
      {
        languageCode: 'es-ES',
        title: 'Libia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Libye',
      },
    ],
  },
  LI: {
    flag_emoji: '🇱🇮',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Liechtenstein',
      },
      {
        languageCode: 'es-ES',
        title: 'Liechtenstein',
      },
      {
        languageCode: 'fr-FR',
        title: 'Liechtenstein',
      },
    ],
  },
  LT: {
    flag_emoji: '🇱🇹',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Lithuania',
      },
      {
        languageCode: 'es-ES',
        title: 'Lituania',
      },
      {
        languageCode: 'fr-FR',
        title: 'Lituanie',
      },
    ],
  },
  LU: {
    flag_emoji: '🇱🇺',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Luxembourg',
      },
      {
        languageCode: 'es-ES',
        title: 'Luxemburgo',
      },
      {
        languageCode: 'fr-FR',
        title: 'Luxembourg',
      },
    ],
  },
  MO: {
    flag_emoji: '🇲🇴',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Macao',
      },
      {
        languageCode: 'es-ES',
        title: 'Macao',
      },
      {
        languageCode: 'fr-FR',
        title: 'Macao',
      },
    ],
  },
  MK: {
    flag_emoji: '🇲🇰',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'North Macedonia',
      },
      {
        languageCode: 'es-ES',
        title: 'Macedonia del Norte',
      },
      {
        languageCode: 'fr-FR',
        title: 'Macédoine du Nord',
      },
    ],
  },
  MG: {
    flag_emoji: '🇲🇬',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Madagascar',
      },
      {
        languageCode: 'es-ES',
        title: 'Madagascar',
      },
      {
        languageCode: 'fr-FR',
        title: 'Madagascar',
      },
    ],
  },
  MW: {
    flag_emoji: '🇲🇼',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Malawi',
      },
      {
        languageCode: 'es-ES',
        title: 'Malaui',
      },
      {
        languageCode: 'fr-FR',
        title: 'Malawi',
      },
    ],
  },
  MY: {
    flag_emoji: '🇲🇾',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Malaysia',
      },
      {
        languageCode: 'es-ES',
        title: 'Malasia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Malaisie',
      },
    ],
  },
  MV: {
    flag_emoji: '🇲🇻',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Maldives',
      },
      {
        languageCode: 'es-ES',
        title: 'Maldivas',
      },
      {
        languageCode: 'fr-FR',
        title: 'Maldives',
      },
    ],
  },
  ML: {
    flag_emoji: '🇲🇱',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Mali',
      },
      {
        languageCode: 'es-ES',
        title: 'Malí',
      },
      {
        languageCode: 'fr-FR',
        title: 'Mali',
      },
    ],
  },
  MT: {
    flag_emoji: '🇲🇹',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Malta',
      },
      {
        languageCode: 'es-ES',
        title: 'Malta',
      },
      {
        languageCode: 'fr-FR',
        title: 'Malte',
      },
    ],
  },
  MH: {
    flag_emoji: '🇲🇭',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Marshall Islands',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Marshall',
      },
      {
        languageCode: 'fr-FR',
        title: 'Îles Marshall',
      },
    ],
  },
  MQ: {
    flag_emoji: '🇲🇶',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Martinique',
      },
      {
        languageCode: 'es-ES',
        title: 'Martinica',
      },
      {
        languageCode: 'fr-FR',
        title: 'Martinique',
      },
    ],
  },
  MR: {
    flag_emoji: '🇲🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Mauritania',
      },
      {
        languageCode: 'es-ES',
        title: 'Mauritania',
      },
      {
        languageCode: 'fr-FR',
        title: 'Mauritanie',
      },
    ],
  },
  MU: {
    flag_emoji: '🇲🇺',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Mauritius',
      },
      {
        languageCode: 'es-ES',
        title: 'Mauricio',
      },
      {
        languageCode: 'fr-FR',
        title: 'Maurice',
      },
    ],
  },
  YT: {
    flag_emoji: '🇾🇹',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Mayotte',
      },
      {
        languageCode: 'es-ES',
        title: 'Mayotte',
      },
      {
        languageCode: 'fr-FR',
        title: 'Mayotte',
      },
    ],
  },
  MX: {
    flag_emoji: '🇲🇽',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Mexico',
      },
      {
        languageCode: 'es-ES',
        title: 'México',
      },
      {
        languageCode: 'fr-FR',
        title: 'Mexique',
      },
    ],
  },
  FM: {
    flag_emoji: '🇫🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Micronesia',
      },
      {
        languageCode: 'es-ES',
        title: 'Micronesia',
      },
      {
        languageCode: 'fr-FR',
        title: 'États fédérés de Micronésie',
      },
    ],
  },
  MA: {
    flag_emoji: '🇲🇦',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Morocco',
      },
      {
        languageCode: 'es-ES',
        title: 'Marruecos',
      },
      {
        languageCode: 'fr-FR',
        title: 'Maroc',
      },
    ],
  },
  MD: {
    flag_emoji: '🇲🇩',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Moldova',
      },
      {
        languageCode: 'es-ES',
        title: 'Moldavia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Moldavie',
      },
    ],
  },
  MC: {
    flag_emoji: '🇲🇨',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Monaco',
      },
      {
        languageCode: 'es-ES',
        title: 'Mónaco',
      },
      {
        languageCode: 'fr-FR',
        title: 'Monaco',
      },
    ],
  },
  MN: {
    flag_emoji: '🇲🇳',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Mongolia',
      },
      {
        languageCode: 'es-ES',
        title: 'Mongolia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Mongolie',
      },
    ],
  },
  ME: {
    flag_emoji: '🇲🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Montenegro',
      },
      {
        languageCode: 'es-ES',
        title: 'Montenegro',
      },
      {
        languageCode: 'fr-FR',
        title: 'Monténégro',
      },
    ],
  },
  MS: {
    flag_emoji: '🇲🇸',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Montserrat',
      },
      {
        languageCode: 'es-ES',
        title: 'Montserrat',
      },
      {
        languageCode: 'fr-FR',
        title: 'Montserrat',
      },
    ],
  },
  MZ: {
    flag_emoji: '🇲🇿',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Mozambique',
      },
      {
        languageCode: 'es-ES',
        title: 'Mozambique',
      },
      {
        languageCode: 'fr-FR',
        title: 'Mozambique',
      },
    ],
  },
  MM: {
    flag_emoji: '🇲🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Myanmar',
      },
      {
        languageCode: 'es-ES',
        title: 'Birmania',
      },
      {
        languageCode: 'fr-FR',
        title: 'Birmanie',
      },
    ],
  },
  NA: {
    flag_emoji: '🇳🇦',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Namibia',
      },
      {
        languageCode: 'es-ES',
        title: 'Namibia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Namibie',
      },
    ],
  },
  NR: {
    flag_emoji: '🇳🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Nauru',
      },
      {
        languageCode: 'es-ES',
        title: 'Nauru',
      },
      {
        languageCode: 'fr-FR',
        title: 'Nauru',
      },
    ],
  },
  NP: {
    flag_emoji: '🇳🇵',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Nepal',
      },
      {
        languageCode: 'es-ES',
        title: 'Nepal',
      },
      {
        languageCode: 'fr-FR',
        title: 'Népal',
      },
    ],
  },
  NL: {
    flag_emoji: '🇳🇱',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Netherlands',
      },
      {
        languageCode: 'es-ES',
        title: 'Países Bajos',
      },
      {
        languageCode: 'fr-FR',
        title: 'Pays-Bas',
      },
    ],
  },
  NC: {
    flag_emoji: '🇳🇨',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'New Caledonia',
      },
      {
        languageCode: 'es-ES',
        title: 'Nueva Caledonia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Nouvelle-Calédonie',
      },
    ],
  },
  NZ: {
    flag_emoji: '🇳🇿',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'New Zealand',
      },
      {
        languageCode: 'es-ES',
        title: 'Nueva Zelanda',
      },
      {
        languageCode: 'fr-FR',
        title: 'Nouvelle-Zélande',
      },
    ],
  },
  NI: {
    flag_emoji: '🇳🇮',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Nicaragua',
      },
      {
        languageCode: 'es-ES',
        title: 'Nicaragua',
      },
      {
        languageCode: 'fr-FR',
        title: 'Nicaragua',
      },
    ],
  },
  NE: {
    flag_emoji: '🇳🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Niger',
      },
      {
        languageCode: 'es-ES',
        title: 'Níger',
      },
      {
        languageCode: 'fr-FR',
        title: 'Niger',
      },
    ],
  },
  NG: {
    flag_emoji: '🇳🇬',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Nigeria',
      },
      {
        languageCode: 'es-ES',
        title: 'Nigeria',
      },
      {
        languageCode: 'fr-FR',
        title: 'Nigeria',
      },
    ],
  },
  NU: {
    flag_emoji: '🇳🇺',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Niue',
      },
      {
        languageCode: 'es-ES',
        title: 'Niue',
      },
      {
        languageCode: 'fr-FR',
        title: 'Niue',
      },
    ],
  },
  NF: {
    flag_emoji: '🇳🇫',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Norfolk Island',
      },
      {
        languageCode: 'es-ES',
        title: 'Isla Norfolk',
      },
      {
        languageCode: 'fr-FR',
        title: 'Île Norfolk',
      },
    ],
  },
  MP: {
    flag_emoji: '🇲🇵',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Northern Mariana Islands',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Marianas del Norte',
      },
      {
        languageCode: 'fr-FR',
        title: 'Îles Mariannes du Nord',
      },
    ],
  },
  NO: {
    flag_emoji: '🇳🇴',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Norway',
      },
      {
        languageCode: 'es-ES',
        title: 'Noruega',
      },
      {
        languageCode: 'fr-FR',
        title: 'Norvège',
      },
    ],
  },
  OM: {
    flag_emoji: '🇴🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Oman',
      },
      {
        languageCode: 'es-ES',
        title: 'Omán',
      },
      {
        languageCode: 'fr-FR',
        title: 'Oman',
      },
    ],
  },
  PK: {
    flag_emoji: '🇵🇰',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Pakistan',
      },
      {
        languageCode: 'es-ES',
        title: 'Pakistán',
      },
      {
        languageCode: 'fr-FR',
        title: 'Pakistan',
      },
    ],
  },
  PW: {
    flag_emoji: '🇵🇼',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Palau',
      },
      {
        languageCode: 'es-ES',
        title: 'Palaos',
      },
      {
        languageCode: 'fr-FR',
        title: 'Palaos',
      },
    ],
  },
  PS: {
    flag_emoji: '🇵🇸',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Palestine',
      },
      {
        languageCode: 'es-ES',
        title: 'Palestina',
      },
      {
        languageCode: 'fr-FR',
        title: 'Palestine',
      },
    ],
  },
  PA: {
    flag_emoji: '🇵🇦',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Panama',
      },
      {
        languageCode: 'es-ES',
        title: 'Panamá',
      },
      {
        languageCode: 'fr-FR',
        title: 'Panama',
      },
    ],
  },
  PG: {
    flag_emoji: '🇵🇬',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Papua New Guinea',
      },
      {
        languageCode: 'es-ES',
        title: 'Papúa Nueva Guinea',
      },
      {
        languageCode: 'fr-FR',
        title: 'Papouasie-Nouvelle-Guinée',
      },
    ],
  },
  PY: {
    flag_emoji: '🇵🇾',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Paraguay',
      },
      {
        languageCode: 'es-ES',
        title: 'Paraguay',
      },
      {
        languageCode: 'fr-FR',
        title: 'Paraguay',
      },
    ],
  },
  PE: {
    flag_emoji: '🇵🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Peru',
      },
      {
        languageCode: 'es-ES',
        title: 'Perú',
      },
      {
        languageCode: 'fr-FR',
        title: 'Pérou',
      },
    ],
  },
  PH: {
    flag_emoji: '🇵🇭',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Philippines',
      },
      {
        languageCode: 'es-ES',
        title: 'Filipinas',
      },
      {
        languageCode: 'fr-FR',
        title: 'Philippines',
      },
    ],
  },
  PN: {
    flag_emoji: '🇵🇳',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Pitcairn',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Pitcairn',
      },
      {
        languageCode: 'fr-FR',
        title: 'Îles Pitcairn',
      },
    ],
  },
  PL: {
    flag_emoji: '🇵🇱',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Poland',
      },
      {
        languageCode: 'es-ES',
        title: 'Polonia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Pologne',
      },
    ],
  },
  PT: {
    flag_emoji: '🇵🇹',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Portugal',
      },
      {
        languageCode: 'es-ES',
        title: 'Portugal',
      },
      {
        languageCode: 'fr-FR',
        title: 'Portugal',
      },
    ],
  },
  PR: {
    flag_emoji: '🇵🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Puerto Rico',
      },
      {
        languageCode: 'es-ES',
        title: 'Puerto Rico',
      },
      {
        languageCode: 'fr-FR',
        title: 'Porto Rico',
      },
    ],
  },
  QA: {
    flag_emoji: '🇶🇦',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Qatar',
      },
      {
        languageCode: 'es-ES',
        title: 'Catar',
      },
      {
        languageCode: 'fr-FR',
        title: 'Qatar',
      },
    ],
  },
  RE: {
    flag_emoji: '🇷🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Réunion',
      },
      {
        languageCode: 'es-ES',
        title: 'Reunión',
      },
      {
        languageCode: 'fr-FR',
        title: 'La Réunion',
      },
    ],
  },
  RO: {
    flag_emoji: '🇷🇴',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Romania',
      },
      {
        languageCode: 'es-ES',
        title: 'Rumania',
      },
      {
        languageCode: 'fr-FR',
        title: 'Roumanie',
      },
    ],
  },
  RU: {
    flag_emoji: '🇷🇺',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Russian Federation',
      },
      {
        languageCode: 'es-ES',
        title: 'Rusia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Russie',
      },
    ],
  },
  RW: {
    flag_emoji: '🇷🇼',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Rwanda',
      },
      {
        languageCode: 'es-ES',
        title: 'Ruanda',
      },
      {
        languageCode: 'fr-FR',
        title: 'Rwanda',
      },
    ],
  },
  BL: {
    flag_emoji: '🇧🇱',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Saint Barthélemy',
      },
      {
        languageCode: 'es-ES',
        title: 'San Bartolomé',
      },
      {
        languageCode: 'fr-FR',
        title: 'Saint-Barthélemy',
      },
    ],
  },
  SH: {
    flag_emoji: '🇸🇭',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Saint Helena, Ascension and Tristan da Cunha',
      },
      {
        languageCode: 'es-ES',
        title: 'Santa Elena, Ascensión y Tristán de Acuña',
      },
      {
        languageCode: 'fr-FR',
        title: 'Sainte-Hélène, Ascension et Tristan da Cunha',
      },
    ],
  },
  KN: {
    flag_emoji: '🇰🇳',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Saint Kitts and Nevis',
      },
      {
        languageCode: 'es-ES',
        title: 'San Cristóbal y Nieves',
      },
      {
        languageCode: 'fr-FR',
        title: 'Saint-Christophe-et-Niévès',
      },
    ],
  },
  LC: {
    flag_emoji: '🇱🇨',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Saint Lucia',
      },
      {
        languageCode: 'es-ES',
        title: 'Santa Lucía',
      },
      {
        languageCode: 'fr-FR',
        title: 'Sainte-Lucie',
      },
    ],
  },
  MF: {
    flag_emoji: '🇲🇫',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Saint Martin',
      },
      {
        languageCode: 'es-ES',
        title: 'San Martín',
      },
      {
        languageCode: 'fr-FR',
        title: 'Saint-Martin',
      },
    ],
  },
  PM: {
    flag_emoji: '🇵🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Saint Pierre and Miquelon',
      },
      {
        languageCode: 'es-ES',
        title: 'San Pedro y Miquelón',
      },
      {
        languageCode: 'fr-FR',
        title: 'Saint-Pierre-et-Miquelon',
      },
    ],
  },
  VC: {
    flag_emoji: '🇻🇨',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Saint Vincent and the Grenadines',
      },
      {
        languageCode: 'es-ES',
        title: 'San Vicente y las Granadinas',
      },
      {
        languageCode: 'fr-FR',
        title: 'Saint-Vincent-et-les-Grenadines',
      },
    ],
  },
  WS: {
    flag_emoji: '🇼🇸',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Samoa',
      },
      {
        languageCode: 'es-ES',
        title: 'Samoa',
      },
      {
        languageCode: 'fr-FR',
        title: 'Samoa',
      },
    ],
  },
  SM: {
    flag_emoji: '🇸🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'San Marino',
      },
      {
        languageCode: 'es-ES',
        title: 'San Marino',
      },
      {
        languageCode: 'fr-FR',
        title: 'Saint-Marin',
      },
    ],
  },
  ST: {
    flag_emoji: '🇸🇹',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Sao Tome and Principe',
      },
      {
        languageCode: 'es-ES',
        title: 'Santo Tomé y Príncipe',
      },
      {
        languageCode: 'fr-FR',
        title: 'Sao Tomé-et-Principe',
      },
    ],
  },
  SA: {
    flag_emoji: '🇸🇦',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Saudi Arabia',
      },
      {
        languageCode: 'es-ES',
        title: 'Arabia Saudita',
      },
      {
        languageCode: 'fr-FR',
        title: 'Arabie saoudite',
      },
    ],
  },
  SN: {
    flag_emoji: '🇸🇳',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Senegal',
      },
      {
        languageCode: 'es-ES',
        title: 'Senegal',
      },
      {
        languageCode: 'fr-FR',
        title: 'Sénégal',
      },
    ],
  },
  RS: {
    flag_emoji: '🇷🇸',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Serbia',
      },
      {
        languageCode: 'es-ES',
        title: 'Serbia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Serbie',
      },
    ],
  },
  SC: {
    flag_emoji: '🇸🇨',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Seychelles',
      },
      {
        languageCode: 'es-ES',
        title: 'Seychelles',
      },
      {
        languageCode: 'fr-FR',
        title: 'Seychelles',
      },
    ],
  },
  SL: {
    flag_emoji: '🇸🇱',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Sierra Leone',
      },
      {
        languageCode: 'es-ES',
        title: 'Sierra Leona',
      },
      {
        languageCode: 'fr-FR',
        title: 'Sierra Leone',
      },
    ],
  },
  SG: {
    flag_emoji: '🇸🇬',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Singapore',
      },
      {
        languageCode: 'es-ES',
        title: 'Singapur',
      },
      {
        languageCode: 'fr-FR',
        title: 'Singapour',
      },
    ],
  },
  SX: {
    flag_emoji: '🇸🇽',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Sint Maarten',
      },
      {
        languageCode: 'es-ES',
        title: 'San Martín',
      },
      {
        languageCode: 'fr-FR',
        title: 'Saint-Martin',
      },
    ],
  },
  SK: {
    flag_emoji: '🇸🇰',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Slovakia',
      },
      {
        languageCode: 'es-ES',
        title: 'Eslovaquia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Slovaquie',
      },
    ],
  },
  SI: {
    flag_emoji: '🇸🇮',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Slovenia',
      },
      {
        languageCode: 'es-ES',
        title: 'Eslovenia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Slovénie',
      },
    ],
  },
  SB: {
    flag_emoji: '🇸🇧',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Solomon Islands',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Salomón',
      },
      {
        languageCode: 'fr-FR',
        title: 'Îles Salomon',
      },
    ],
  },
  SO: {
    flag_emoji: '🇸🇴',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Somalia',
      },
      {
        languageCode: 'es-ES',
        title: 'Somalia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Somalie',
      },
    ],
  },
  ZA: {
    flag_emoji: '🇿🇦',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'South Africa',
      },
      {
        languageCode: 'es-ES',
        title: 'Sudáfrica',
      },
      {
        languageCode: 'fr-FR',
        title: 'Afrique du Sud',
      },
    ],
  },
  GS: {
    flag_emoji: '🇬🇸',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'South Georgia and the South Sandwich Islands',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Georgias del Sur y Sandwich del Sur',
      },
      {
        languageCode: 'fr-FR',
        title: 'Géorgie du Sud-et-les îles Sandwich du Sud',
      },
    ],
  },
  SS: {
    flag_emoji: '🇸🇸',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'South Sudan',
      },
      {
        languageCode: 'es-ES',
        title: 'Sudán del Sur',
      },
      {
        languageCode: 'fr-FR',
        title: 'Soudan du Sud',
      },
    ],
  },
  ES: {
    flag_emoji: '🇪🇸',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Spain',
      },
      {
        languageCode: 'es-ES',
        title: 'España',
      },
      {
        languageCode: 'fr-FR',
        title: 'Espagne',
      },
    ],
  },
  LK: {
    flag_emoji: '🇱🇰',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Sri Lanka',
      },
      {
        languageCode: 'es-ES',
        title: 'Sri Lanka',
      },
      {
        languageCode: 'fr-FR',
        title: 'Sri Lanka',
      },
    ],
  },
  SD: {
    flag_emoji: '🇸🇩',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Sudan',
      },
      {
        languageCode: 'es-ES',
        title: 'Sudán',
      },
      {
        languageCode: 'fr-FR',
        title: 'Soudan',
      },
    ],
  },
  SR: {
    flag_emoji: '🇸🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Suriname',
      },
      {
        languageCode: 'es-ES',
        title: 'Surinam',
      },
      {
        languageCode: 'fr-FR',
        title: 'Suriname',
      },
    ],
  },
  SJ: {
    flag_emoji: '🇸🇯',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Svalbard and Jan Mayen',
      },
      {
        languageCode: 'es-ES',
        title: 'Svalbard y Jan Mayen',
      },
      {
        languageCode: 'fr-FR',
        title: 'Svalbard et ile Jan Mayen',
      },
    ],
  },
  SZ: {
    flag_emoji: '🇸🇿',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Eswatini',
      },
      {
        languageCode: 'es-ES',
        title: 'Suazilandia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Eswatini',
      },
    ],
  },
  SE: {
    flag_emoji: '🇸🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Sweden',
      },
      {
        languageCode: 'es-ES',
        title: 'Suecia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Suède',
      },
    ],
  },
  CH: {
    flag_emoji: '🇨🇭',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Switzerland',
      },
      {
        languageCode: 'es-ES',
        title: 'Suiza',
      },
      {
        languageCode: 'fr-FR',
        title: 'Suisse',
      },
    ],
  },
  SY: {
    flag_emoji: '🇸🇾',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Syrian Arab Republic',
      },
      {
        languageCode: 'es-ES',
        title: 'Siria',
      },
      {
        languageCode: 'fr-FR',
        title: 'Syrie',
      },
    ],
  },
  TW: {
    flag_emoji: '🇹🇼',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Taiwan',
      },
      {
        languageCode: 'es-ES',
        title: 'Taiwán (República de China)',
      },
      {
        languageCode: 'fr-FR',
        title: 'Taïwan / (République de Chine (Taïwan))',
      },
    ],
  },
  TJ: {
    flag_emoji: '🇹🇯',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Tajikistan',
      },
      {
        languageCode: 'es-ES',
        title: 'Tayikistán',
      },
      {
        languageCode: 'fr-FR',
        title: 'Tadjikistan',
      },
    ],
  },
  TZ: {
    flag_emoji: '🇹🇿',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Tanzania',
      },
      {
        languageCode: 'es-ES',
        title: 'Tanzania',
      },
      {
        languageCode: 'fr-FR',
        title: 'Tanzanie',
      },
    ],
  },
  TH: {
    flag_emoji: '🇹🇭',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Thailand',
      },
      {
        languageCode: 'es-ES',
        title: 'Tailandia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Thaïlande',
      },
    ],
  },
  TL: {
    flag_emoji: '🇹🇱',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Timor-Leste',
      },
      {
        languageCode: 'es-ES',
        title: 'Timor Oriental',
      },
      {
        languageCode: 'fr-FR',
        title: 'Timor oriental',
      },
    ],
  },
  TG: {
    flag_emoji: '🇹🇬',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Togo',
      },
      {
        languageCode: 'es-ES',
        title: 'Togo',
      },
      {
        languageCode: 'fr-FR',
        title: 'Togo',
      },
    ],
  },
  TK: {
    flag_emoji: '🇹🇰',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Tokelau',
      },
      {
        languageCode: 'es-ES',
        title: 'Tokelau',
      },
      {
        languageCode: 'fr-FR',
        title: 'Tokelau',
      },
    ],
  },
  TO: {
    flag_emoji: '🇹🇴',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Tonga',
      },
      {
        languageCode: 'es-ES',
        title: 'Tonga',
      },
      {
        languageCode: 'fr-FR',
        title: 'Tonga',
      },
    ],
  },
  TT: {
    flag_emoji: '🇹🇹',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Trinidad and Tobago',
      },
      {
        languageCode: 'es-ES',
        title: 'Trinidad y Tobago',
      },
      {
        languageCode: 'fr-FR',
        title: 'Trinité-et-Tobago',
      },
    ],
  },
  TN: {
    flag_emoji: '🇹🇳',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Tunisia',
      },
      {
        languageCode: 'es-ES',
        title: 'Túnez',
      },
      {
        languageCode: 'fr-FR',
        title: 'Tunisie',
      },
    ],
  },
  TR: {
    flag_emoji: '🇹🇷',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Turkey',
      },
      {
        languageCode: 'es-ES',
        title: 'Turquía',
      },
      {
        languageCode: 'fr-FR',
        title: 'Turquie',
      },
    ],
  },
  TM: {
    flag_emoji: '🇹🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Turkmenistan',
      },
      {
        languageCode: 'es-ES',
        title: 'Turkmenistán',
      },
      {
        languageCode: 'fr-FR',
        title: 'Turkménistan',
      },
    ],
  },
  TC: {
    flag_emoji: '🇹🇨',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Turks and Caicos Islands',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Turcas y Caicos',
      },
      {
        languageCode: 'fr-FR',
        title: 'Îles Turques-et-Caïques',
      },
    ],
  },
  TV: {
    flag_emoji: '🇹🇻',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Tuvalu',
      },
      {
        languageCode: 'es-ES',
        title: 'Tuvalu',
      },
      {
        languageCode: 'fr-FR',
        title: 'Tuvalu',
      },
    ],
  },
  UG: {
    flag_emoji: '🇺🇬',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Uganda',
      },
      {
        languageCode: 'es-ES',
        title: 'Uganda',
      },
      {
        languageCode: 'fr-FR',
        title: 'Ouganda',
      },
    ],
  },
  UA: {
    flag_emoji: '🇺🇦',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Ukraine',
      },
      {
        languageCode: 'es-ES',
        title: 'Ucrania',
      },
      {
        languageCode: 'fr-FR',
        title: 'Ukraine',
      },
    ],
  },
  AE: {
    flag_emoji: '🇦🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'United Arab Emirates',
      },
      {
        languageCode: 'es-ES',
        title: 'Emiratos Árabes Unidos',
      },
      {
        languageCode: 'fr-FR',
        title: 'Émirats arabes unis',
      },
    ],
  },
  GB: {
    flag_emoji: '🇬🇧',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'United Kingdom',
      },
      {
        languageCode: 'es-ES',
        title: 'Reino Unido',
      },
      {
        languageCode: 'fr-FR',
        title: 'Royaume-Uni',
      },
    ],
  },
  US: {
    flag_emoji: '🇺🇸',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'United States of America',
      },
      {
        languageCode: 'es-ES',
        title: 'Estados Unidos',
      },
      {
        languageCode: 'fr-FR',
        title: 'États-Unis',
      },
    ],
  },
  UM: {
    flag_emoji: '🇺🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'United States Minor Outlying Islands',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Ultramarinas Menores de los Estados Unidos',
      },
      {
        languageCode: 'fr-FR',
        title: 'Îles mineures éloignées des États-Unis',
      },
    ],
  },
  UY: {
    flag_emoji: '🇺🇾',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Uruguay',
      },
      {
        languageCode: 'es-ES',
        title: 'Uruguay',
      },
      {
        languageCode: 'fr-FR',
        title: 'Uruguay',
      },
    ],
  },
  UZ: {
    flag_emoji: '🇺🇿',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Uzbekistan',
      },
      {
        languageCode: 'es-ES',
        title: 'Uzbekistán',
      },
      {
        languageCode: 'fr-FR',
        title: 'Ouzbékistan',
      },
    ],
  },
  VU: {
    flag_emoji: '🇻🇺',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Vanuatu',
      },
      {
        languageCode: 'es-ES',
        title: 'Vanuatu',
      },
      {
        languageCode: 'fr-FR',
        title: 'Vanuatu',
      },
    ],
  },
  VE: {
    flag_emoji: '🇻🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Venezuela',
      },
      {
        languageCode: 'es-ES',
        title: 'Venezuela',
      },
      {
        languageCode: 'fr-FR',
        title: 'Venezuela',
      },
    ],
  },
  VN: {
    flag_emoji: '🇻🇳',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Viet Nam',
      },
      {
        languageCode: 'es-ES',
        title: 'Vietnam',
      },
      {
        languageCode: 'fr-FR',
        title: 'Viêt Nam',
      },
    ],
  },
  VG: {
    flag_emoji: '🇻🇬',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Virgin Islands (British)',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Vírgenes Británicas',
      },
      {
        languageCode: 'fr-FR',
        title: 'Îles Vierges britanniques',
      },
    ],
  },
  VI: {
    flag_emoji: '🇻🇮',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Virgin Islands (U.S.)',
      },
      {
        languageCode: 'es-ES',
        title: 'Islas Vírgenes de los Estados Unidos',
      },
      {
        languageCode: 'fr-FR',
        title: 'Îles Vierges des États-Unis',
      },
    ],
  },
  WF: {
    flag_emoji: '🇼🇫',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Wallis and Futuna',
      },
      {
        languageCode: 'es-ES',
        title: 'Wallis y Futuna',
      },
      {
        languageCode: 'fr-FR',
        title: 'Wallis-et-Futuna',
      },
    ],
  },
  EH: {
    flag_emoji: '🇪🇭',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Western Sahara',
      },
      {
        languageCode: 'es-ES',
        title: 'República Árabe Saharaui Democrática',
      },
      {
        languageCode: 'fr-FR',
        title: 'République arabe sahraouie démocratique',
      },
    ],
  },
  YE: {
    flag_emoji: '🇾🇪',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Yemen',
      },
      {
        languageCode: 'es-ES',
        title: 'Yemen',
      },
      {
        languageCode: 'fr-FR',
        title: 'Yémen',
      },
    ],
  },
  ZM: {
    flag_emoji: '🇿🇲',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Zambia',
      },
      {
        languageCode: 'es-ES',
        title: 'Zambia',
      },
      {
        languageCode: 'fr-FR',
        title: 'Zambie',
      },
    ],
  },
  ZW: {
    flag_emoji: '🇿🇼',
    translations: [
      {
        languageCode: 'en-UK',
        title: 'Zimbabwe',
      },
      {
        languageCode: 'es-ES',
        title: 'Zimbabue',
      },
      {
        languageCode: 'fr-FR',
        title: 'Zimbabwe',
      },
    ],
  },
}

export async function seedCountries(directus) {
  console.log('- Countries')

  try {
    const countryRecords = []
    const countryCodesChunks = chunkArray(
      Object.keys(countriesList).map((code, idx) => ({
        code: code,
        flag_emoji: countriesList[code].flag_emoji,
        sort: idx + 1,
      })),
      100
    )

    await Promise.all(
      countryCodesChunks.map(async (group) => {
        const countryGroup = await directus.items('countries').createMany(group)

        countryRecords.push(...countryGroup.data)
      })
    )

    const translationRecords = countryRecords
      .map(({ code, id }) => {
        return countriesList[code].translations.map(
          ({ languageCode, title }) => ({
            countries_id: id,
            languages_code: languageCode,
            title: title,
          })
        )
      })
      .flat()

    const translationRecordsChunks = chunkArray(translationRecords, 100)

    await Promise.all(
      translationRecordsChunks.map(async (group) => {
        await directus.items('countries_translations').createMany(group)
      })
    )
  } catch (err) {
    console.log('Seed Countries Error.' + err)
  }
}
