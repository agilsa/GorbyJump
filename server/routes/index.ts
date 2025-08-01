import { Express } from "express";
import twitterRoutes from "./twitter";

export function registerRoutes(app: Express) {
  // Register Twitter routes
  app.use(twitterRoutes);
  
return app;