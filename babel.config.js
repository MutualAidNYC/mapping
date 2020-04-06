module.exports = {
  'presets': [
      ['@babel/preset-env', {
        useBuiltIns: 'usage',
        corejs: 3, // or 2,
        targets: [
            '>0.2%',
            'not dead',
            'not op_mini all'
        ],
      }]
  ]
};
