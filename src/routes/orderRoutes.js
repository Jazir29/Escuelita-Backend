const router = require("express").Router();
const ctrl     = require("../controllers/orderController");
const itemCtrl = require("../controllers/orderItemController");

// Orders CRUD
router.get("/",                    ctrl.getAll);
router.get("/:id",                 ctrl.getById);
router.post("/",                   ctrl.create);
router.put("/:id",                 ctrl.update);
router.patch("/:id/status",        ctrl.updateStatus);
router.delete("/:id",              ctrl.remove);

// Order items (nested)
router.get("/:orderId/items",              itemCtrl.getItems);
router.post("/:orderId/items",             itemCtrl.addItem);
router.put("/:orderId/items/:itemId",      itemCtrl.updateItem);
router.delete("/:orderId/items/:itemId",   itemCtrl.removeItem);

module.exports = router;
