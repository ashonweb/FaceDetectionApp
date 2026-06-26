module.exports = {
  webpack: {
    configure: (config) => {
      // @vladmandic/face-api uses dynamic require internally which triggers
      // webpack "critical dependency" warnings — suppress them so CI builds pass
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { module: /@vladmandic\/face-api/ },
      ];
      return config;
    },
  },
};
