const run = async () => {
    try {
        console.log("---- TEST GET ----");
        const resGet = await fetch("https://apipikagames.vercel.app/rifas/7e10061a-8cca-4fc0-8f93-8175692224bc");
        console.log("Status GET:", resGet.status);
        console.log("Response GET:", await resGet.text());

        console.log("\n---- TEST DELETE ----");
        const resDel = await fetch("https://apipikagames.vercel.app/rifas/7e10061a-8cca-4fc0-8f93-8175692224bc", { method: 'DELETE' });
        console.log("Status DELETE:", resDel.status);
        console.log("Response DELETE:", await resDel.text());

    } catch (err) {
        console.error("ERROR:", err.message);
    }
};
run();
