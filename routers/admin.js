const express = require("express");
const Controller = require("../controllers/admin");

module.exports = function(app, ex_sqlite) {
    const router = express.Router();
    const controller = new Controller(app, ex_sqlite);

    router.post("/login", controller.login.bind(controller));
    router.get("/state", controller.state.bind(controller));

    return router;
}