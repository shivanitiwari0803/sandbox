import express from "express";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
app.use(morgan("combined"));

app.get("/api/status/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/status/ready", (req, res) => {
  res.status(200).json({
    status: "ready",
  });
});

const proxies = {}

function getProxy(sandboxId){
 const target = `http://sandbox-service-${sandboxId}`;

  if(!proxies[sandboxId]){
    proxies[sandboxId] = createProxyMiddleware({
      target,
      changeOrigin:true,
      ws:true
    })
  }
  return proxies[sandboxId]
}

app.use((req, res, next) => {
  const host = req.headers.host;

  const sandboxId = host.split(".")[0];

  return getProxy(sandboxId)(req, res, next);
});

export default app;
