module.exports = (options, webpack) => {
  return {
    ...options,
    output: {
      ...options.output,
      libraryTarget: 'commonjs2'
    }
  };
};
