const express = require("express");
const session = require("express-session");
const https = require("https");
const fs = require("fs");
const path = require("path");
const config = require("./exence.global");
const info = require("./utils/info");
const CaptchaGenerator = require("./utils/captcha");
const ex_sqlite = require("./drivers/ex_sqlite");
const adminRouter = require("./routers/admin");

const captchaGenerator = new CaptchaGenerator({
    width: 150,
    height: 50,
    length: 5
});
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: Math.random().toString(36).substr(2, 15),
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}))

app.use('/', (req, res, next) => {
    info('info', `[${req.method}]${req.path}`);
    next();
})

app.use('/', express.static(path.join(__dirname, 'themes/' + config.theme)))
app.use('/assets', express.static(path.join(__dirname, 'public')));

app.use('/api/admin', adminRouter(app, ex_sqlite)); // Admin-API服务
app.use(config.admin.path, express.static(path.join(__dirname, 'admincp'))); //Admin-CP服务

app.get('/api/captcha', async (req, res) => {
    try {
        const { image, secret, hash } = await captchaGenerator.generate();
        req.session.captcha = { secret, hash };
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        res.send(image);
    } catch (error) {
        info('error', '生成验证码出错: ' + error);
        res.status(500).send('生成验证码失败');
    }
})

/** Start HTTP Server */
if (config.ssl.enabled === true) {
    const privateKey = fs.readFileSync(config.ssl.privateKey, "utf8");
    const certificate = fs.readFileSync(config.ssl.certificate, "utf8");
    const credentials = { key: privateKey, cert: certificate };
    https.createServer(credentials, app).listen(config.ssl.port, () => {
        info('info', `HTTPs服务器已在https://localhost:${config.ssl.port}启用`);
    });
    if (config.ssl.force_https === true) {
        const redirectServer = express();
        redirectServer.use((req, res, next) => {
            if (req.headers["x-forwarded-proto"] !== "https") {
                res.redirect(`https://${req.hostname}${req.url}`);
            } else {
                next();
            }
        });
        redirectServer.listen(config.port, () => {
            info('info', `HTTP服务器已在http://localhost:${config.port}启用，当您通过http方式访问网站时，将自动重定向到https。`);
        });
    }
} else {
    app.listen(config.port, () => {
        info('info', `HTTP服务器已在http://localhost:${config.port}启用`);
        info('warn', `SSL已禁用，建议启用ssl以保障服务安全性。`);
    });
}

/** Start AdminCP */