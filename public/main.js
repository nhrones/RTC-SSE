import { Emoji } from './types.js';
import { SignalService } from './comms/signalling.js';
import { hide, initUI, updateUI, submitButton, chatInput } from './dom.js';
let name = prompt("What's your name?", "Bill") || 'Nick';
let t = Date.now().toString();
export let myID = name + '-' + t.substring(t.length - 3);
let eString = prompt(`Pick an emoji!  
  1  🐸 
  2  🐼 
  3  🐭 
  4  🐯 
  5  🐶 
  6  👀 
  7  👓
Enter the number!`) || '7';
let eNum = parseInt(eString) - 1;
console.log('You picked ' + Emoji[eNum] + '!');
export const signaller = new SignalService(name, myID, Emoji[eNum]);
export const { caller, callee } = signaller;
// initialize all UI DOM elements
initUI();
//export let peerConnection: RTCPeerConnection;
//export const killPeer = () => peerConnection = null
/** The RTCDataChannel API enables peer-to-peer exchange of data */
//export let dataChannel: RTCDataChannel;
/** Start the peerConnection process by signalling an invitation */
export const start = () => {
    /*
      TODO To protect against a proxy server timeout,
      include a comment line
      (one starting with a ':' character),
      every 15 seconds or so.
    */
    console.log('main.start');
    signaller.postMessage({ from: callee.id, topic: 'signalOffer', payload: callee });
    hide(submitButton);
    hide(chatInput);
};
// /** Resets the peerConnection and dataChannel, then calls 'start()' */
// const reset = () => {
//     dataChannel = null
//     peerConnection = null
//     hide(submitButton)
//     hide(chatInput);
//     start()
// }
// /** creates a peer connection 
//  * @param {boolean} - isOfferer - we're making the offer     
//  *          true if called by makeCall()     
//  *          false if called from handleOffer()
//  */
// function createPeerConnection(isOfferer: boolean) {
//     console.log('Starting WebRTC as', isOfferer ? 'Offerer' : 'Offeree');
//     peerConnection = new RTCPeerConnection({
//         iceServers: [{
//             urls: [
//                 "stun:stun1.l.google.com:19302",
//                 "stun:stun2.l.google.com:19302"
//             ]
//         }]
//     });
//     // local ICE layer passes candidates to us for delivery 
//     // to the remote peer over the signaling channel
//     peerConnection.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
//         const topic = 'candidate';
//         const init: RTCIceCandidateInit = {
//             candidate: null,
//             sdpMid: "",
//             sdpMLineIndex: 0
//         };
//         if (e.candidate) {
//             init.candidate = e.candidate.candidate;
//             init.sdpMid = e.candidate.sdpMid;
//             init.sdpMLineIndex = e.candidate.sdpMLineIndex;
//         }
//         // sent over the signaller to the remote peer.
//         signaller.postMessage({from: callee.id, topic: 'candidate', payload: init });
//     };
//     // creating data channel 
//     if (isOfferer) {
//         console.log('Offerer -> creating dataChannel!')
//         // createDataChannel is a factory method on the RTCPeerConnection object
//         dataChannel = peerConnection.createDataChannel('chat');
//         setupDataChannel();
//     } else {
//         // If user is not the offerer, wait for 
//         // the offerer to pass us its data channel
//         peerConnection.ondatachannel = (event) => {
//             console.log('peerConnection.ondatachannel -> creating dataChannel!')
//             dataChannel = event.channel;
//             setupDataChannel();
//         }
//     }
// }
// // Hook up data channel event handlers
// function setupDataChannel() {
//     checkDataChannelState();
//     dataChannel.onopen = checkDataChannelState;
//     dataChannel.onclose = checkDataChannelState;
//     dataChannel.onmessage = (event: { data: string; }) => {
//         const data = JSON.parse(event.data)
//         console.info('dataChannel.onmessage: ', data)
//         const {from, topic, payload} = data
//         const {content, who, emoji} = payload
//         updateUI(from,content, who, emoji)
//     }
// }
// function checkDataChannelState() {
//     console.log('WebRTC channel state is:', dataChannel.readyState);;
//     if (dataChannel.readyState === 'open') {
//         updateUI(myID, ` 👬  You're now connected to ${caller.name}!`, 'server', '');
//     } else if (dataChannel.readyState === 'closed') {
//         updateUI(myID, `👀  ${caller.name} was disconnected! Waiting for
//  new offer on: ${location.origin}`, 'server', '');
//         // reset everything and restart
//         caller.name=''
//         caller.id=''
//         caller.emoji=''
//         reset()
//     }
// }
// export async function makeConnection() {
//     createPeerConnection(true);
//     const offer = await peerConnection.createOffer();
//     signaller.postMessage({from: callee.id, topic: 'offer', payload: { type: 'offer', sdp: offer.sdp } });
//     // Note that RTCPeerConnection won't start gathering 
//     // candidates until setLocalDescription() is called.
//     await peerConnection.setLocalDescription(offer);
// }
// /** 
//  * handle a Session-Description-Offer 
//  * @param {RTCSessionDescriptionInit} offer - {topic: string, sdp: string}
//  */
// export async function handleOffer(offer: RTCSessionDescriptionInit) {
//     if (peerConnection) {
//         console.log('existing peerconnection');
//         return;
//     }
//     createPeerConnection(false);
//     await peerConnection.setRemoteDescription(offer);
//     unhide(chatInput);
//     const answer = await peerConnection.createAnswer();
//     signaller.postMessage({from: callee.id, topic: 'answer', payload: { type: 'answer', sdp: answer.sdp } });
//     // Note that RTCPeerConnection won't start gathering 
//     // candidates until setLocalDescription() is called.
//     await peerConnection.setLocalDescription(answer);
// }
// /** 
//  * handle a Session-Description-Answer 
//  * @param {RTCSessionDescriptionInit} answer - {type: string, sdp: string}
//  */
// export async function handleAnswer(answer: RTCSessionDescriptionInit) {
//     if (!peerConnection) {
//         console.error('no peerconnection');
//         return;
//     }
//     await peerConnection.setRemoteDescription(answer);
//     unhide(chatInput);
// }
// /** 
//  * handle ICE-Candidate
//  * @param {RTCIceCandidateInit} candidate - RTCIceCandidateInit
//  */
// export async function handleCandidate(candidate: RTCIceCandidateInit) {
//     if (!peerConnection) {
//         console.error('no peerconnection');
//         return;
//     }
//     try {
//         if (!candidate.candidate) {
//             await peerConnection.addIceCandidate(null);
//         } else {
//             await peerConnection.addIceCandidate(candidate);
//         }
//     } catch (er) {
//         console.info(er)
//     }
// }
// Finally ... tell them your listening/waiting
updateUI(myID, `⌛  ${myID} is waiting for a connection\n from: ${location.origin}`, 'server', '');
