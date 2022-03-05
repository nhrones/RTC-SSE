
import { DEBUG } from './constants.ts'

/** 
 * A request to subscribe to a Server Sent Event stream 
 * @param (Request) _req the request object from the http request
 * @param (string) id - the identity of the SSE client
 * */
export function GET(_req: Request, id: string): Response {
    const thisID = id
    const sseChannel = new BroadcastChannel("c1");
    if (DEBUG) console.log('Started ' + thisID + ' SSE Stream!')
    const stream = new ReadableStream({
        start: (controller) => {
            sseChannel.onmessage = (e) => {
                const { data } = e
                if (DEBUG) console.info(thisID + ' sseChannel recieved (' + (typeof data) + '): ', data)
                if (DEBUG) console.log(`${thisID} got message from ${data.from}`)
                if (data.from && data.from !== thisID) {
                    controller.enqueue('data: ' + JSON.stringify(data) + '\n\n');
                }
            };
        },
        cancel() {
            sseChannel.close();
        },
    });

    return new Response(stream.pipeThrough(new TextEncoderStream()), {
        headers: { "content-type": "text/event-stream" },
    });
}
