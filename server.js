import { createApp } from "./src/app.js";
import { env } from "./src/config/env.js";
import { pool, checkDatabase } from "./src/config/database.js";

let server;
let stopping = false;

async function shutdown() {
    if (stopping) return;
    stopping = true;
    const timer = setTimeout(() => process.exit(1), 10000);
    timer.unref();
    if (server) await new Promise(resolve => server.close(resolve));
    await pool.end();
    clearTimeout(timer);
}

try {
    const database = await checkDatabase();
    server = createApp().listen(env.port, env.host, () => {
        console.log(`Carranco académico: http://${env.host}:${env.port}`);
        console.log(`MySQL ${database.version}; ${database.tablas} tablas verificadas. Pagos deshabilitados.`);
    });
    server.on("error", async error => {
        console.error(error.code === "EADDRINUSE" ? "El puerto está ocupado. Cambia PORT en .env." : "No fue posible iniciar el servidor HTTP.");
        await shutdown();
        process.exitCode = 1;
    });
} catch (error) {
    const expected = error.message.startsWith("Faltan tablas:") || error.message.startsWith("Se requiere MySQL");
    console.error(expected ? error.message : "No fue posible verificar MySQL. Revisa .env, inicia MySQL y ejecuta npm run db:init.");
    await pool.end();
    process.exitCode = 1;
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
