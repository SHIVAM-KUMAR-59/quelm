import { Request, Response } from "express";
import { runEmitter } from "../../events/run.emitter";
import { logger } from "../../config/logger.config";

export const handleWorkflowRunServerSentEvents = async (req: Request, res: Response) => {
  const { runId } = req.params;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();

  // Initial connection event
  res.write("event: connected\n");
  res.write(
    `data: ${JSON.stringify({
      message: "Connection established successfully",
      runId,
    })}\n\n`,
  );

  // Event listener
  const eventListener = (eventData: unknown) => {
    res.write("event: workflow-update\n");
    res.write(`data: ${JSON.stringify(eventData)}\n\n`);
  };

  // Subscribe to events
  runEmitter.on(`run:${runId}`, eventListener);

  // Cleanup on disconnect
  req.on("close", () => {
    logger.debug(`SSE client disconnected for runID: ${runId}`);
    runEmitter.off(`run:${runId}`, eventListener);
    res.end();
  });
};
