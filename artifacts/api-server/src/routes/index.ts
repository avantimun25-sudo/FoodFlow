import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import ordersRouter from "./orders";
import customersRouter from "./customers";
import restaurantsRouter from "./restaurants";
import driversRouter from "./drivers";
import menuItemsRouter from "./menuItems";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/dashboard", dashboardRouter);
router.use("/orders", ordersRouter);
router.use("/customers", customersRouter);
router.use("/restaurants", restaurantsRouter);
router.use("/drivers", driversRouter);
router.use("/menu-items", menuItemsRouter);
router.use("/payments", paymentsRouter);

export default router;
