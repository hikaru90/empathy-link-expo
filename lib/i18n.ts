import { setLocale, getLocale } from './paraglide/runtime';
import * as Localization from 'expo-localization';

// Initialize language on app start
export function initializeI18n() {
  try {
    // Get device locale (e.g., 'en-US', 'de-DE')
    const deviceLocale = Localization.getLocales()[0]?.languageCode || 'de';

    // Map to available locales
    const availableLocales = ['en', 'de'];
    const locale = availableLocales.includes(deviceLocale) ? deviceLocale : 'de';

    console.log('Setting language to:', locale);
    setLocale(locale as 'en' | 'de');
    console.log('Current locale after setting:', getLocale());
  } catch (error) {
    console.error('Error initializing i18n:', error);
    // Fallback to default language
    setLocale('de');
  }
}

export { setLocale, getLocale };