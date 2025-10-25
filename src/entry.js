import { plugin, defaultConfig } from '@formkit/vue';
import { de } from '@formkit/i18n';
import i18n from './i18n/de.json';

const config = defaultConfig({
  locales: { de },
  locale: 'de',
  messages: {
    de: {
      validation: i18n.validation,
    },
  },
});

export default (app) => {
  app.use(plugin, config);
};