import { Emoji } from '../types.js';
import { updateUI, hide, submitButton, chatInput } from '../dom.js';
import * as main from '../main.js';
import { RtcConnection } from './rtcConnection.js';
/**
 * Signaling Service
 *
 * This service handles signaling and iceCandidate exchange
 * to establish one or more WebRTC Connection instances
 * We'll connect to a server that streams messages to our local
 * EventSource instance
 *
 * */
export class SignalService {
    signaler;
    caller;
    callee;
    rtcConn;
    /** Signaling ctor
     * @param {ServiceType} - serviceType - service transport type
     *       one of: WebSocket or BroadcastChannel
     * @param {string} - url - the WebSocket-URL or a name for the BroadcastChannel
     * @param {string} - thisname - the initial callee name
    */
    constructor(thisname, id, thisEmoji) {
        this.rtcConn = new RtcConnection(thisname);
        // I'm expecting to get a 'signalOffer', where I would be the callee       
        this.callee = { id: id, name: thisname, emoji: thisEmoji };
        // When I get that offer, I'll set up the caller object?    
        this.caller = { id: '', name: '', emoji: Emoji[0] };
        this.signaler = new EventSource('/listen/' + this.callee.id);
        this.signaler.onopen = (e) => {
            console.log('signaler opened!');
            main.start();
        };
        // When problems occur (such as a network timeout,
        // or issues pertaining to access control), 
        // an error event is generated. 
        this.signaler.onerror = (err) => {
            console.error('Signaler(EventSource) failed: ', err);
        };
        // Handle incoming messages from the signaling server.
        // for incoming messages that `DO NOT` have an event field on them 
        //
        this.signaler.onmessage = (ev) => {
            const { data } = ev;
            const { from, topic, payload } = JSON.parse(data);
            console.info('signaler.onmessage!', data);
            console.log('topic', topic);
            switch (topic) {
                case 'chat':
                    const { content, who, emoji } = payload;
                    updateUI(from, content, who, emoji);
                    break;
                case 'offer': // a peer has made an offer (SDP)
                    this.rtcConn.handleOffer(payload);
                    break;
                case 'answer': // a peer has sent an answer (SDP)
                    this.rtcConn.handleAnswer(payload);
                    break;
                case 'candidate': // calls peer onicecandidate with new candidate
                    this.rtcConn.handleCandidate(payload);
                    break;
                case 'signalOffer': // A peer is offering to chat
                    // I'll initiate a connection unless I'm engaged already.
                    // check if I'm already engaged in a chat.
                    if (this.rtcConn.peerConnection) {
                        console.log(`Already connected with ${this.caller.name}, ignoring signal 'offer'!`);
                        return;
                    }
                    // set the callers name
                    this.caller.name = payload.name;
                    console.log(`${this.caller.name} has sent me a 'chat-offer' signal!  We'll signal an answer!`);
                    // send the caller the identity of this callee
                    this.postMessage({ from: this.callee.id, topic: 'signalAnswer', payload: this.callee });
                    // start the RTC-connection
                    this.rtcConn.makeConnection();
                    break;
                case 'signalAnswer': // someone's answering our offer!
                    // a role change is required
                    // set the new callers name
                    this.caller.name = payload.name;
                    // swap emojis
                    this.callee.emoji = this.caller.emoji;
                    this.caller.emoji = payload.emoji;
                    break;
                case 'bye': // peer hung up (pressed `hangup` button )
                    if (this.rtcConn.peerConnection) {
                        this.rtcConn.peerConnection.close();
                        this.rtcConn.killPeer();
                    }
                    hide(submitButton);
                    hide(chatInput);
                    break;
                default:
                    break;
            }
        };
    }
    /**
     * By default, if the connection between the client and server closes,
     * the connection is `restarted`.
     * The connection can only be terminated with the .close() method.
     */
    close() {
        this.signaler.close();
    }
    /** postMessage sends messages to peers via a signal service
     * @param {SignalMessage type} - message - message payload
     *
     * if (webRTC.dataChannel && webRTC.dataChannel.readyState === 'open') {
        if (DEBUG) console.log('DataChannel >> :', msg)
        webRTC.dataChannel.send(msg)
     */
    postMessage(message) {
        const msg = JSON.stringify(message);
        if (this.rtcConn.dataChannel && this.rtcConn.dataChannel.readyState === 'open') {
            console.log('DataChannel >> :', msg);
            this.rtcConn.dataChannel.send(msg);
        }
        else { //don't send to server
            console.log('Server >> :', msg);
            fetch("/send", {
                method: "POST",
                body: JSON.stringify(message)
            });
        }
    }
}
