import { createMiddleware } from "@tanstack/react-start";

// for example auth middleware
const auth = () => {
  // Implement your authentication logic here
  return Math.random() > 0.5; // or false based on authentication status
};

export const authMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    if (!auth()) throw new Error("User is not authenticated");

    return next();
  }
);
