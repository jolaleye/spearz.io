import React, { Component, Fragment } from 'react';

import { pack, unpack } from '../../../services/cereal';
import assetManager from '../../../assetManager';
import Message from './Message/Message';
import Leaderboard from './Leaderboard/Leaderboard';
import Feed from './Feed/Feed';
import Score from './Score/Score';

class HUD extends Component {
  state = {
    message: false,
    leaderboard: [],
    feed: [],
    scoreChain: 0,
  }

  componentDidMount() {
    this.props.socket.addEventListener('message', packet => {
      const data = unpack(packet.data);
      switch (data._) {
        case 'message':
          if (!data.type) return;
          this.showMessage(data.type);
          break;

        case 'clearMessage':
          if (!data.type) return;
          this.clearMessage(data.type);
          break;

        case 'dead':
          if (!data.from) return;
          this.showDeath(data.from, data.name);
          break;

        case 'kill':
          this.showKill(data.name);
          break;

        case 'leaderboard':
          this.updateLeaderboard(data.players);
          break;

        case 'feed':
          this.addToFeed(data.type, data.names);
          break;

        case 'score':
          this.chainScore(data.value);
          break;

        default: break;
      }
    });
  }

  showMessage = type => {
    let msg;
    if (type === 'bounds') {
      msg = 'You\'re out of bounds!';
      assetManager.sounds.bounds.play();
    }

    this.setState({ message: { type, msg } });
  }

  clearMessage = type => {
    if (this.state.message && type === this.state.message.type) {
      this.setState({ message: false });
    }

    if (type === 'bounds') assetManager.sounds.bounds.pause();
  }

  showKill = name => {
    // reset the message timer so that subsequent messages aren't cleared early
    clearTimeout(this.killMessageTimer);

    this.setState({ message: { type: 'kill', name: name || '<unnamed>' } });

    // set a timer on the message
    this.killMessageTimer = setTimeout(() => {
      // if the message is still a kill message, clear it
      if (this.state.message.type === 'kill') {
        this.setState({ message: false });
      }
    }, 3000);
  }

  showDeath = (from, name) => {
    if (from === 'bounds') {
      this.setState({ message: {
        type: 'deathByBounds',
        msg: 'You were out of bounds... (－‸ლ)',
      } });
    } else if (from === 'player') {
      this.setState({ message: {
        type: 'deathByPlayer',
        name: name || '<unnamed>',
      } });
    }

    // death process finished, remove player and go back to the start screen
    setTimeout(() => {
      this.props.socket.send(pack('remove'));
      this.props.changeMode('start');
    }, 3000);
  }

  updateLeaderboard = players => {
    const leaders = players.map(player => ({
      ...player,
      active: player.id === this.props.socket.id,
    }));

    this.setState({ leaderboard: leaders });
  }

  addToFeed = (type, names) => {
    let message = null;

    switch (type) {
      case 'join':
        message = `${names[0] || '<unnamed>'} joined the game`;
        break;

      case 'leave':
        message = `${names[0] || '<unnamed>'} left the game`;
        break;

      case 'kill':
        message = `${names[0] || '<unnamed>'} killed ${names[1] || '<unnamed>'}`;
        break;

      default: break;
    }

    if (message) {
      const feed = [...this.state.feed];
      if (feed.length === 5) feed.shift();
      feed.push(message);
      this.setState({ feed });
    }
  }

  chainScore = value => {
    clearTimeout(this.scoreTimer);

    this.setState(prevState => ({ scoreChain: prevState.scoreChain + value }));

    // after 3 seconds, clear the score chain
    this.scoreTimer = setTimeout(() => this.setState({ scoreChain: 0 }), 2000);
  }

  render = () => (
    <Fragment>
      {this.state.message ? <Message message={this.state.message} /> : null}
      <Leaderboard leaderboard={this.state.leaderboard} />
      <Feed feed={this.state.feed} />
      {this.state.scoreChain ? <Score value={this.state.scoreChain} /> : null}
    </Fragment>
  );
}

export default HUD;
