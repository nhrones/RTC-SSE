import { Emoji } from './types.js';
import { updateUI } from './dom.js';
import * as main from './main.js';
/** Signalling Services */
export class Signalling {
    signaller;
    caller;
    callee;
    /** Signalling ctor
     * @param {ServiceType} - serviceType - service transport type
     *       one of: WebSocket or BroadcastChannel
     * @param {string} - url - the WebSocket-URL or a name for the BroadcastChannel
     * @param {string} - thisname - the initial callee name
    */
    constructor(thisname) {
        // I'm expecting to get a 'signalOffer', where I would be the callee
        this.callee = { id: 0, who: thisname, emoji: Emoji[0] };
        // When I get that offer, I'll set up the caller object?
        this.caller = { id: 1, who: "", emoji: Emoji[1] };
        this.signaller = new EventSource('/listen/' + thisname); // new WebSocket(url)
        this.signaller.onopen = (e) => {
            console.log('signaller opened!');
            main.start();
        };
        // When problems occur (such as a network timeout,
        // or issues pertaining to access control), 
        // an error event is generated. 
        this.signaller.onerror = (err) => {
            console.error('Signaller(EventSource) failed: ', err);
        };
        // Handle incoming messages from the signaling server.
        // for incoming messages that `DO NOT` have an event field on them 
        //
        this.signaller.onmessage = (ev) => {
            const { data } = ev;
            console.info('signaller.onmessage!', ev);
            updateUI(JSON.parse(data));
        };
    }
    /**
     * By default, if the connection between the client and server closes,
     * the connection is `restarted`.
     * The connection can only be terminated with the .close() method.
     */
    close() {
        this.signaller.close();
    }
    /** postMessage sends messages to peers via a signal service
     * @param {SignalMessage type} - message - message payload
     */
    postMessage(message) {
        fetch("/send", {
            method: "POST",
            body: JSON.stringify(message)
        });
    }
}
