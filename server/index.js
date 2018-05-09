const express = require('express');

const app = express();

// serve the React front-end in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(`${__dirname}/../build`));
  app.get('/*', (req, res) => {
    res.sendFile(`${__dirname}/../build/index.html`);
  });
}

app.listen(3001, () => console.log('Server started on port 3001'));
