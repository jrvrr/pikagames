const endpoints = [
    "https://apipikagames.vercel.app/usuarios/todos",
    "https://apipikagames.vercel.app/auth/usuarios",
    "https://apipikagames.vercel.app/admin/usuarios",
    "https://apipikagames.vercel.app/usuarios/list",
    "https://apipikagames.vercel.app/usuarios/all",
    "https://apipikagames.vercel.app/rifas/pendientes",
    "https://apipikagames.vercel.app/boletos/pendientes",
    "https://apipikagames.vercel.app/participantes/pendientes"
];

const check = async () => {
    for (const url of endpoints) {
        try {
            const res = await fetch(url);
            console.log(`URL: ${url} -> STATUS: ${res.status}`);
            if (res.status !== 404) {
                const body = await res.text();
                console.log(`BODY (first 100 char): ${body.substring(0, 100)}`);
            }
        } catch (e) {
            console.log(`URL: ${url} -> ERROR: ${e.message}`);
        }
    }
};

check();
