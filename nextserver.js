const express = require('express');
const next = require('next');
// const fs = require('fs');
// const https = require("https");
const http = require('http');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
// const jwt = require('jsonwebtoken');
const port = 7002;
const dev = false;
const app = next({ dev, port });
const handle = app.getRequestHandler();

// function verifyToken(req, res, next) {
//     const token = req.headers['authorization']?.split(' ')[1]; // Expects 'Bearer <token>'
  
//     if (!token) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }
  
//     try {
//       // Verify the token
//       const decoded = jwt.verify(token, process.env.JWT_SECRET); // Ensure you have your secret in env
//       req.user = decoded; // Attach the decoded user to the request object
//       next(); // Proceed with the next middleware or route handler
//     } catch (err) {
//       return res.status(401).json({ message: 'Unauthorized' });
//     }
//   }

app.prepare().then(() => {
    const server = express();
    server.use(compression());
    server.use(cors());

    // server.use((req, res, next) => {
    //     if (req.hostname === 'xdminds.com' && req.protocol === 'http') {
    //         res.writeHead(301, {
    //             Location: `https://www.${req.headers.host}${req.url}`
    //         });
    //         res.end();
    //     }
    //     next();
    // });
    // server.use((req, res, next) => {
    //     if (req.hostname === 'xdminds.com') {
    //         const wwwUrl = `https://www.${req.headers.host}${req.originalUrl}`;
    //         return res.redirect(301, wwwUrl);
    //     }
    //     next();
    // });
    server.use('/fonts', express.static(path.join(__dirname, 'fonts/feather-icons/feather.css')));

    server.use('/_next/static/', express.static(path.join(__dirname, '.next/static'), {
        maxAge: '365d', // Cache static files for one year
        immutable: true // Set immutable flag to indicate unchanging resources
    }));
    server.use((req, res, next) => {
        if (/\.(js|css|woff|jpg|png|gif|ttf|webp)$/.test(req.url)) {
            res.setHeader("Cache-Control", "public, max-age=31536000");
        }
        next();
    });
    server.use('/robots.txt', express.static(path.join(__dirname, 'public', 'robots.txt')));

    server.all('*', (req, res) => {
        return handle(req, res);
    });

    const serverListener = http.createServer(server);

    serverListener.listen(port, err => {
        if (err) throw err;
        console.log(`> Ready on ${process.env.NODE_ENV === 'prod' ? 'https:' : 'http:'}localhost:${port}`);
    });

});