// Minimal Metro config that extends Expo's default to avoid diagnostics warnings
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
