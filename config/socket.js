import { Server } from "socket.io";

let io = null;

export function getIO() {
  return io;
}

/**
 * Attach Socket.io to the HTTP server and authenticate via Express session.
 */
export function initSocket(server, app, sessionMiddleware) {
  io = new Server(server, {
    cors: { origin: false },
  });

  const wrap = (middleware) => (socket, next) =>
    middleware(socket.request, {}, next);

  io.use(wrap(sessionMiddleware));
  io.use(wrap(app.get("passportInit")));
  io.use(wrap(app.get("passportSession")));

  io.on("connection", (socket) => {
    const user = socket.request.user;
    if (!user?._id) {
      socket.disconnect(true);
      return;
    }
    socket.join(`user:${user._id}`);
  });

  app.set("io", io);
  return io;
}
