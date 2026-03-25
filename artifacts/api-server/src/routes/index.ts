import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import ordersRouter from "./orders";
import customersRouter from "./customers";
import restaurantsRouter from "./restaurants";
import driversRouter from "./drivers";
import menuItemsRouter from "./menuItems";
import paymentsRouter from "./payments";
import authRouter from "./auth";
import restaurantRequestsRouter from "./restaurantRequests";
import restaurantPortalRouter from "./restaurantPortal";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/dashboard", dashboardRouter);
router.use("/orders", ordersRouter);
router.use("/customers", customersRouter);
router.use("/restaurants", restaurantsRouter);
router.use("/drivers", driversRouter);
router.use("/menu-items", menuItemsRouter);
router.use("/payments", paymentsRouter);
router.use("/restaurant-requests", restaurantRequestsRouter);
router.use("/restaurant", restaurantPortalRouter);

export default router;
