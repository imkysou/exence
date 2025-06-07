const express = require("express");
const Controller = require("../controllers/server");

module.exports = function(app, ex_sqlite) {
    const router = express.Router();
    const controller = new Controller(app, ex_sqlite);

    router.get("/info", controller.info.bind(controller));
    router.post("/register", controller.register.bind(controller));
    router.post("/sendVerifyEmail", controller.sendVerifyEmail.bind(controller));

    return router;
}