import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://a17827f5b0fa628644b3d3b8ffdf8007@o4511750885670912.ingest.us.sentry.io/4511751380729856",
  tracesSampleRate: 0,
  enableLogs: false,
  debug: false,
});
