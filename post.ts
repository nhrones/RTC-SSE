
import { DEBUG } from './constants.ts'

/**
 * A handler used to POST a message to a common BroadcastChannel, 
 * to be eventually streamed to each connected SSE-client.
 * @param (Request) req - the original http request object
 * @returns (Promise<Response>) the `required` Response object 
 */
export async function POST(req: Request): Promise<Response> { 
    const data = await req.json();
    if (DEBUG) console.info('POST recieved ('+ (typeof data) + "): ", data)
    const tempBC = new BroadcastChannel("c1");
    tempBC.postMessage(data);
    tempBC.close();

    return new Response("");
}
