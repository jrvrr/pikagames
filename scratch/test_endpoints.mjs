const endpoints = [
    "https://apipikagames.vercel.app/usuarios",
    "https://apipikagames.vercel.app/usuarios/all",
    "https://apipikagames.vercel.app/usuarios/todos",
    "https://apipikagames.vercel.app/admin/usuarios",
    "https://apipikagames.vercel.app/rifas/participantes/pendientes",
    "https://apipikagames.vercel.app/rifas/pendientes",
    "https://apipikagames.vercel.app/participantes/pendientes",
    "https://apipikagames.vercel.app/boletos/pendientes"
];

const check = async () => {
    for (const url of endpoints) {
        try {
            const res = await fetch(url);
            console.log(`URL: ${url} -> STATUS: ${res.status}`);
        } catch (e) {
            console.log(`URL: ${url} -> ERROR: ${e.message}`);
        }
    }
};

check();
