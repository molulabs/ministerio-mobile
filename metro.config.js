const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Drizzle's migrations are .sql files bundled into the app (see babel.config.js).
config.resolver.sourceExts.push('sql');

module.exports = config;
