import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Convex Auth's routes (JWKS and OpenID config used to verify parent-app tokens).
auth.addHttpRoutes(http);

export default http;
