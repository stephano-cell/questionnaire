const express = require("express");
const proxy = require("http-proxy-middleware");

const app = express();
const port = 80;

const apiProxy = proxy.createProxyMiddleware("/", {
  target: "http://127.0.0.1:8080",
});
app.use(apiProxy);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
