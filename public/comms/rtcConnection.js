import { CANDIDATE } from '../types.js';
import { myID, start, signaller, callee, caller } from '../main.js';
import { hide, unhide, updateUI, submitButton, chatInput } from '../dom.js';
export let peerConnection;
/** The RTCDataChannel API enables peer-to-peer exchange of data */
export let dataChannel;
export const killPeer = () => peerConnection = null;
/** Resets the peerConnection and dataChannel, then calls 'start()' */
const reset = () => {
    dataChannel = null;
    peerConnection = null;
    hide(submitButton);
    hide(chatInput);
    start();
};
/** creates a peer connection
 * @param {boolean} - isOfferer - we're making the offer
 *          true if called by makeCall()
 *          false if called from handleOffer()
 */
function createPeerConnection(isOfferer) {
    console.log('Starting WebRTC as', isOfferer ? 'Offerer' : 'Offeree');
    peerConnection = new RTCPeerConnection({
        iceServers: [{
                urls: [
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302"
                ]
            }]
    });
    // local ICE layer passes candidates to us for delivery 
    // to the remote peer over the signaling channel
    peerConnection.onicecandidate = (e) => {
        const init = {
            candidate: null,
            sdpMid: "",
            sdpMLineIndex: 0
        };
        if (e.candidate) {
            init.candidate = e.candidate.candidate;
            init.sdpMid = e.candidate.sdpMid;
            init.sdpMLineIndex = e.candidate.sdpMLineIndex;
        }
        // sent over the signaller to the remote peer.
        signaller.postMessage({ from: callee.id, topic: CANDIDATE, payload: init });
    };
    // creating data channel 
    if (isOfferer) {
        console.log('Offerer -> creating dataChannel!');
        // createDataChannel is a factory method on the RTCPeerConnection object
        dataChannel = peerConnection.createDataChannel('chat');
        setupDataChannel();
    }
    else {
        // If user is not the offerer, wait for 
        // the offerer to pass us its data channel
        peerConnection.ondatachannel = (event) => {
            console.log('peerConnection.ondatachannel -> creating dataChannel!');
            dataChannel = event.channel;
            setupDataChannel();
        };
    }
}
// Hook up data channel event handlers
function setupDataChannel() {
    checkDataChannelState();
    dataChannel.onopen = checkDataChannelState;
    dataChannel.onclose = checkDataChannelState;
    dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.info('dataChannel.onmessage: ', data);
        const { from, payload } = data;
        const { content, who, emoji } = payload;
        updateUI(from, content, who, emoji);
    };
}
function checkDataChannelState() {
    console.log('WebRTC channel state is:', dataChannel.readyState);
    if (dataChannel.readyState === 'open') {
        updateUI(myID, ` 👬  You're now connected to ${caller.name}!`, 'server', '');
    }
    else if (dataChannel.readyState === 'closed') {
        updateUI(myID, `👀  ${caller.name} was disconnected! Waiting for
 new offer on: ${location.origin}`, 'server', '');
        // reset everything and restart
        caller.name = '';
        caller.id = '';
        caller.emoji = '';
        reset();
    }
}
export async function makeConnection() {
    createPeerConnection(true);
    const offer = await peerConnection.createOffer();
    signaller.postMessage({ from: callee.id, topic: 'offer', payload: { type: 'offer', sdp: offer.sdp } });
    // Note that RTCPeerConnection won't start gathering 
    // candidates until setLocalDescription() is called.
    await peerConnection.setLocalDescription(offer);
}
/**
 * handle a Session-Description-Offer
 * @param {RTCSessionDescriptionInit} offer - {topic: string, sdp: string}
 */
export async function handleOffer(offer) {
    if (peerConnection) {
        console.log('existing peerconnection');
        return;
    }
    createPeerConnection(false);
    await peerConnection.setRemoteDescription(offer);
    unhide(chatInput);
    const answer = await peerConnection.createAnswer();
    signaller.postMessage({ from: callee.id, topic: 'answer', payload: { type: 'answer', sdp: answer.sdp } });
    // Note that RTCPeerConnection won't start gathering 
    // candidates until setLocalDescription() is called.
    await peerConnection.setLocalDescription(answer);
}
/**
 * handle a Session-Description-Answer
 * @param {RTCSessionDescriptionInit} answer - {type: string, sdp: string}
 */
export async function handleAnswer(answer) {
    if (!peerConnection) {
        console.error('no peerconnection');
        return;
    }
    await peerConnection.setRemoteDescription(answer);
    unhide(chatInput);
}
/**
 * handle ICE-Candidate
 * @param {RTCIceCandidateInit} candidate - RTCIceCandidateInit
 */
export async function handleCandidate(candidate) {
    if (!peerConnection) {
        console.error('no peerconnection');
        return;
    }
    try {
        if (!candidate.candidate) {
            await peerConnection.addIceCandidate(null);
        }
        else {
            await peerConnection.addIceCandidate(candidate);
        }
    }
    catch (er) {
        console.info(er);
    }
}
