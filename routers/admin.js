const express = require("express");
const Controller = require("../controllers/admin");

module.exports = function(app, ex_sqlite) {
    const router = express.Router();
    const controller = new Controller(app, ex_sqlite);

    router.post("/login", controller.login.bind(controller));
    router.get("/state", controller.state.bind(controller));
    router.get("/configs", controller.configs.bind(controller));
    router.post("/delConfig", controller.delConfig.bind(controller));
    router.post("/updateConfig", controller.updateConfig.bind(controller));
    router.post("/insertConfig", controller.insertConfig.bind(controller));
    router.get("/servers", controller.servers.bind(controller));
    router.post("/delServer", controller.delServer.bind(controller));
    router.post("/updateServer", controller.updateServer.bind(controller));
    router.post("/insertServer", controller.insertServer.bind(controller));

    return router;
}