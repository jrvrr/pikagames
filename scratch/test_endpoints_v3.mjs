const endpoints = [
    "https://apipikagames.vercel.app/usuarios/get",
    "https://apipikagames.vercel.app/usuarios/all",
    "https://apipikagames.vercel.app/api/usuarios",
    "https://apipikagames.vercel.app/usuarios/index",
    "https://apipikagames.vercel.app/auth/users",
    "https://apipikagames.vercel.app/usuarios/pendientes",
    "https://apipikagames.vercel.app/rifas/pendientes",
    "https://apipikagames.vercel.app/login/usuarios"
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
