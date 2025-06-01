const crypto = require("crypto");
const info = require("../utils/info");
const CaptchaGenerator = require("../utils/captcha");
const ExAdmin = require("../services/ex_admin");


const captchaGenerator = new CaptchaGenerator();
class Admin {
    constructor(app, ex_sqlite) {
        this.app = app;
        this.db = ex_sqlite;
        this.exAdmin = new ExAdmin(ex_sqlite);
    }
    async login(req, res) {
        try {
            const { username, password, captcha } = req.body;

            // 检验验证码
            const { secret, hash } = req.session.captcha || {};
            const isValid = captchaGenerator.verify(captcha, secret, hash);
            delete req.session.captcha;
            if (isValid === false) {
                return res.json({
                    code: 1,
                    msg: "验证码错误"
                });
            }

            // 创建sha256加密密码
            const sha256 = crypto.createHash("sha256");
            sha256.update(password);
            const sha256Password = sha256.digest("hex");

            // 校验用户名和密码
            this.exAdmin.getAdmin(username, sha256Password, (err, row) => {
                if (err) {
                    info('error', '数据库错误:' + err);
                    return res.json({
                        code: 1,
                        msg: "数据库错误"
                    });
                }
                if (row) {
                    req.session.admin = row;
                    return res.json({
                        code: 0,
                        msg: "登录成功"
                    });
                }
                return res.json({
                    code: 1,
                    msg: "用户名或密码错误"
                });
            });
        } catch (err) {
            info('error', '服务器错误:' + err);
            res.json({
                code: 1,
                msg: "服务器错误"
            });
        }
    }
    state(req, res) {
        if (req.session.admin) {
            return res.json({
                code: 0,
                msg: "已登录",
                level: req.session.admin.level,
                username: req.session.admin.username
            });
        } else {
            return res.json({
                code: 1,
                msg: "未登录"
            });
        }
    }
    systemInfo(req, res) {
        
    }
}

module.exports = Admin;