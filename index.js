const express = require("express");
const session = require("express-session");
const http = require("http"); // 主要用作request，此处不用axios是因为不想用
const https = require("https"); // 用作https服务对外开放
const fs = require("fs");
const path = require("path");
const config = require("./exence.global");
const info = require("./utils/info");
const CaptchaGenerator = require("./utils/captcha");
const ex_sqlite = require("./drivers/ex_sqlite");
const adminRouter = require("./routers/admin");
const serverRouter = require("./routers/server");
const ExConfigs = require("./services/ex_configs"); // 自问不答：魔系代码？为什么要在index写services？

const exConfigs = new ExConfigs(ex_sqlite);
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

app.use('/api/admin', adminRouter(app, ex_sqlite)); // Admin-API服务
app.use('/api/server', serverRouter(app, ex_sqlite)); // Server-API服务
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

// 使用 express 创建静态服务以供反代
const staticApp = express();
staticApp.use("/", express.static(path.join(__dirname, "themes/", config.theme)));
// 404页面
// 此处将404页面放在staticApp中而不是app中
staticApp.use("/", (req, res) => {
    fs.access(path.join(__dirname, 'themes/', config.theme, '404.html'), fs.constants.F_OK, (err) => {
        if (err) {
            res.status(404).send('404 Not Found');
        } else {
            res.sendFile(path.join(__dirname, 'themes/', config.theme, '404.html'));
        }
    })
})
staticApp.listen(config.template_port, () => {
    info('info', `模板服务器已在http://localhost:${config.template_port}启用`);
    // 通过app服务器代理模板服务器
    app.use("/", (req, res, next) => {
        // 请求
        const proxyReq = http.request({
            hostname: '127.0.0.1',
            port: config.template_port,
            path: req.path,
            method: req.method,
            headers: {
                ...req.headers,
                host: null,
                connection: 'close'
            }
        }, (proxyRes) => {
            // 复制响应头
            const filteredHeaders = { ...proxyRes.headers };
            // 检查是否为文本响应
            const contentType = proxyRes.headers['content-type'] || '';
            const isText = contentType.includes('text');
            // 只有文本响应才进行内容替换
            if (isText) {
                // 移除Content-Length头，因为内容会被修改
                delete filteredHeaders['content-length'];
                res.writeHead(proxyRes.statusCode, filteredHeaders);
                // 获取替换数据
                exConfigs.listData((err, rows) => {
                    if (err) {
                        console.error('数据库错误:', err);
                        res.statusCode = 500;
                        res.end("<meta charset='utf-8'><p>主题渲染错误</p><pre>" + err + "</pre>");
                        return;
                    }
                    
                    // 构建替换映射
                    const replacements = new Map();
                    rows.forEach(row => replacements.set(`<%=${row.name}=>`, row.data));
                    
                    const { Transform } = require('stream');
                    const replaceStream = new Transform({
                        transform(chunk, encoding, callback) {
                            let content = chunk.toString();
                            replacements.forEach((value, key) => {
                                content = content.split(key).join(value);
                            });
                            this.push(content);
                            callback();
                        }
                    });
                    proxyRes
                        .on('error', (err) => {
                            console.error('代理响应错误:', err);
                            if (!res.headersSent) {
                                res.statusCode = 502;
                                res.end('Bad Gateway');
                            }
                        })
                        .pipe(replaceStream)
                        .on('error', (err) => {
                            console.error('替换流错误:', err);
                            if (!res.headersSent) {
                                res.statusCode = 500;
                                res.end('Internal Server Error');
                            }
                        })
                        .pipe(res);
                });
            } else {
                // 非HTML内容直接转发
                res.writeHead(proxyRes.statusCode, filteredHeaders);
                proxyRes
                    .on('error', (err) => {
                        console.error('代理响应错误:', err);
                        if (!res.headersSent) {
                            res.statusCode = 502;
                            res.end('Bad Gateway');
                        }
                    })
                    .pipe(res);
            }
        });
        req.pipe(proxyReq);
    })
});

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
    } else {
        app.listen(config.port, () => {
            info('info', `HTTP服务器已在http://localhost:${config.port}启用`);
        });
    }
} else {
    app.listen(config.port, () => {
        info('info', `HTTP服务器已在http://localhost:${config.port}启用`);
        info('warn', `SSL已禁用，建议启用ssl以保障服务安全性。`);
    });
}

/** Start AdminCP */