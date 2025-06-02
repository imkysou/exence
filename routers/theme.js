const express = require("express");
const fs = require("fs");
const info = require("../utils/info");
const ExConfigs = require("../services/ex_configs");

module.exports = function(theme, ex_sqlite) {
    const router = express.Router();
    const exConfigs = new ExConfigs(ex_sqlite);

    const renderPage = (source) => {
        return new Promise((resolve, reject) => {
            let data;
            exConfigs.listData((err, rows) => {
                if (err) {
                    info('error', '数据库错误:' + err);
                    reject(err);
                } else {
                    data = rows;
                    for (let i = 0; i < data.length; i++) {
                        source = source.split(`<%=${data[i]['name']}=>`).join(data[i]['data']);
                    }
                    resolve(source);
                }
            });
        })
    }

    const getPage = (theme, name) => {
        return new Promise((resolve, reject) => {
            fs.access(`./themes/${theme}/${name}.html`, (err) => {
                if (err) {
                    info('error', '主题不存在:' + err);
                    reject(err);
                } else {
                    fs.readFile(`./themes/${theme}/${name}.html`, (err, data) => {
                        if (err) {
                            info('error', '主题读取错误:' + err);
                            reject(err);
                        } else {
                            resolve(data.toString());
                        }
                    })
                }
            });
        })
    }

    const render = (req, res, pageName) => {
        let pageContent = "";
        getPage(theme, pageName).then((source) => {
            pageContent = source;
            renderPage(pageContent).then((source) => {
                res.send(source);
            }).catch((err) => {
                info('error', '主题渲染错误, ' + err);
                res.send("<meta charset='utf-8'><p>主题渲染错误</p><pre>" + err + "</pre>");
            })
        }).catch((err) => {
            info('error', '主题读取错误, ' + err);
            res.send("<meta charset='utf-8'><p>主题读取错误</p><pre>" + err + "</pre>");
        })
    }

    router.get("/", (req, res) => {
        render(req, res, "index");
    });

    router.get("/register", (req, res) => {
        render(req, res, "register");
    });

    return router;
}