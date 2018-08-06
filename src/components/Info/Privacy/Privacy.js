import React from 'react';

import './Privacy.css';

const Privacy = ({ open, toggle }) => (
  <div className={`modal ${open ? 'is-active' : ''}`}>
    <div className="modal-background" onClick={toggle}></div>
    <button className="modal-close is-large" aria-label="close" onClick={toggle} />
    <div className="modal-content">
      <div className="box policy">
        <span className="policy__header">Spearz.io Privacy Policy</span>
        {/* eslint-disable */}
        <p>Spearz.io does not collect or store any personally identifiable information on its users. Users are assigned a random ID and name of their choice while playing—information that cannot be used to identify a user.</p>
        <p>Cookies are used by a third party (Google) to serve ads (Google Adsense) and analyze traffic (Google Analytics). Cookies are used to serve ads based on a user's prior visits to this website or other websites. Users may opt out of personalized advertising by visiting <a href="https://adssettings.google.com/" target="_blank">Ads Settings</a>.</p>
        <p>For more information regarding third-party vendors' use of cookies, you can visit <a href="http://optout.aboutads.info" target="_blank">www.aboutads.info</a>.</p>
        <p>For more information please refer to <a href="https://policies.google.com/technologies/partner-sites" target="_blank">How Google uses data when you use partner sites or apps</a>.</p>
        <p>By continuing to use and play spearz.io you consent to the use of cookies as described above.</p>
        {/* eslint-enable */}
      </div>
    </div>
  </div>
);

export default Privacy;
