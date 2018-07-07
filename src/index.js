import React from 'react';
import ReactDOM from 'react-dom';

import './main.css';
import StartContainer from './components/Start/StartContainer';

const App = () => (
  <StartContainer />
);

ReactDOM.render(<App />, document.getElementById('root'));
