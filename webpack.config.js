const path = require('path');
const fs = require('fs');

// To add new files to bundle, just add the directory path here
// All files in the directory will be bundled in a public folder at src folder level
const modulePaths = [
  'src/js',
  'lib/modules/apostrophe-media-sources-wedia/src/js'
];

module.exports = async () => {
  const promises = modulePaths.map((filesPath) => {
    return new Promise((resolve, reject) => {
      fs.readdir(filesPath, (err, files) => {
        if (err) {
          reject(err);
        }

        const configs = files.map((filename) => {
          const outputPath = filesPath.replace('src', 'public');

          return {
            mode: 'production',
            target: 'es5',
            entry: `./${filesPath}/${filename}`,
            output: {
              path: path.join(__dirname, outputPath),
              filename
            },
            module: {
              rules: [
                {
                  test: /\.js$/,
                  loader: 'babel-loader'
                }
              ]
            }
          };
        });

        resolve(configs);
      });
    });
  });

  return (await Promise.all(promises)).reduce((acc, configs) => [ ...acc, ...configs ], []);
};
