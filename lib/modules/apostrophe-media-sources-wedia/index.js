const fs = require('fs');
const stream = require('stream');
const axios = require('axios');
const pipeline = require('util').promisify(stream.pipeline);

module.exports = {
  name: 'apostrophe-media-sources-wedia',
  label: 'Wedia',
  async construct (self, options) {
    self.pushAsset('script', 'user', { when: 'user' });

    self.options.mediaSourceConnector = {
      script: options.script
    };

    self.find = () => [];

    self.choices = () => [];

    /* eslint-disable camelcase */
    self.formatData = ({
      title,
      url,
      width,
      height,
      wedia_metadata
    }) => {
      return {
        mediaSourceId: wedia_metadata.id,
        title,
        downloadLink: url,
        width: parseInt(width, 10),
        height: parseInt(height, 10),
        tags: wedia_metadata.keywords.map((kw) => kw.name)
      };
    };

    self.download = async (req, file, tempPath) => {
      const formattedFile = self.formatData(file);

      console.log('formattedFile ===> ', require('util').inspect(formattedFile, {
        colors: true,
        depth: 2
      }));

      const { data, status } = await axios({
        method: 'get',
        url: formattedFile.downloadLink,
        // headers: {
        //   Authorization: `Client-ID ${accessKey}`
        // },
        responseType: 'stream'
      });

      if (status !== 200) {
        throw new Error('Error when downloading image from Unsplash API');
      }

      const fileName = self.apos.utils.generateId() + '.jpg';
      const filePath = `${tempPath}/${fileName}`;

      await pipeline(
        data,
        fs.createWriteStream(filePath)
      );

      return {
        fileName,
        formattedFile
      };
    };
  }
};
