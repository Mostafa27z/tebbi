import{c as r}from"./utils-C1HFZ46x.js";/**
 * @license lucide-react v0.475.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M10.268 21a2 2 0 0 0 3.464 0",key:"vwvbt9"}],["path",{d:"M22 8c0-2.3-.8-4.3-2-6",key:"5bb3ad"}],["path",{d:"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326",key:"11g9vi"}],["path",{d:"M4 2C2.8 3.7 2 5.7 2 8",key:"tap9e0"}]],p=r("BellRing",u);function d(){try{const o=window.AudioContext||window.webkitAudioContext;if(!o)return;const e=new o;e.state==="suspended"&&e.resume();const i=(s,t,a)=>{const n=e.createOscillator(),c=e.createGain();n.type="sine",n.frequency.setValueAtTime(s,e.currentTime+t),c.gain.setValueAtTime(.2,e.currentTime+t),c.gain.exponentialRampToValueAtTime(.001,e.currentTime+t+a),n.connect(c),c.connect(e.destination),n.start(e.currentTime+t),n.stop(e.currentTime+t+a)};i(659.25,0,.35),i(830.61,.22,.4),i(987.77,.45,.7)}catch{}}export{p as B,d as p};
