import React, { Component, Fragment } from 'react';

import { pack, unpack } from '../../../services/cereal';
import assetManager from '../../../assetManager';
import Message from './Message/Message';
import Leaderboard from './Leaderboard/Leaderboard';
import Feed from './Feed/Feed';

class HUD extends Component {
  state = {
    message: false,
    leaderboard: [],
    feed: [],
    dead: false,
  }

  componentDidMount() {
    this.mounted = true;

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

        default: break;
      }
    });
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  showMessage = type => {
    let msg;
    if (type === 'bounds') {
      msg = 'You\'re out of bounds!';
      assetManager.sounds.bounds.play();
    }

    if (this.mounted) this.setState({ message: { type, msg } });
  }

  clearMessage = type => {
    if (this.mounted && this.state.message && type === this.state.message.type) {
      this.setState({ message: false });
    }

    if (type === 'bounds') assetManager.sounds.bounds.pause();
  }

  showKill = name => {
    // reset the message timer so that subsequent messages aren't cleared early
    clearTimeout(this.killMessageTimer);

    if (this.mounted) this.setState({ message: { type: 'kill', name: name || '<unnamed>' } });

    // set a timer on the message
    this.killMessageTimer = setTimeout(() => {
      // if the message is still a kill message, clear it
      if (this.mounted && this.state.message.type === 'kill') {
        this.setState({ message: false });
      }
    }, 3000);
  }

  showDeath = (from, name) => {
    if (this.mounted && from === 'bounds') {
      this.setState({
        message: {
          type: 'deathByBounds',
          msg: 'You were out of bounds... (－‸ლ)',
        },
        dead: true,
      });
    } else if (this.mounted && from === 'player') {
      this.setState({
        message: {
          type: 'deathByPlayer',
          name: name || '<unnamed>',
        },
        dead: true,
      });
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

    if (this.mounted) this.setState({ leaderboard: leaders });
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
      if (this.mounted) this.setState({ feed });
    }
  }

  render = () => (
    <Fragment>
      {this.state.message ? <Message message={this.state.message} /> : null}
      {this.state.dead ? null : <Leaderboard leaderboard={this.state.leaderboard} />}
      {this.state.dead ? null : <Feed feed={this.state.feed} />}
    </Fragment>
  );
}

export default HUD;
