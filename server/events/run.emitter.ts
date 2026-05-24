import { EventEmitter } from "events";

class RunEventEmitter extends EventEmitter {}

export const runEmitter = new RunEventEmitter();
