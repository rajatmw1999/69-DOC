const express = require('express');
const app = express();
const { createProxyMiddleware } = require('http-proxy-middleware');

app.get('/', async(req, res) => {
    console.log("/ route");
    return res.send({"message":"Hello Cruel World"});
});

// Proxy endpoints
app.use('/superhero', createProxyMiddleware({
    target: 'https://akabab.github.io/superhero-api/api',
    changeOrigin: true,
    pathRewrite: {
        [`^/superhero`]: '',
    },
 }));


app.listen(6969, function(){
    console.log("server is running like usain bolt");
})