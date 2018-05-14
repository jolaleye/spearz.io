import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import './main.css';
import StartContainer from './components/Start/StartContainer';
import Game from './components/Game';
import Restart from './components/Restart';

class App extends Component {
  state = { view: 'start' }

  changeView = view => this.setState({ view });

  render = () => {
    const { view } = this.state;

    if (view === 'start') return <StartContainer changeView={this.changeView} />;
    else if (view === 'game') return <Game changeView={this.changeView} />;
    return <Restart changeView={this.changeView} />;
  };
}

ReactDOM.render(<App />, document.getElementById('root'));
