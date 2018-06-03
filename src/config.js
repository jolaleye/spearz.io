const config = {
  nativeWidth: 1920,
  nativeHeight: 1080,

  get deviceWidth() { return window.innerWidth; },
  get deviceHeight() { return window.innerHeight; },

  get scale() {
    return Math.max(
      config.deviceWidth / config.nativeWidth,
      config.deviceHeight / config.nativeHeight,
    );
  },
};

export default config;
