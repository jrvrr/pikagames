const run = async () => {
    try {
        const response = await fetch("https://apipikagames.vercel.app/rifas/3a6dc281-f3a6-4394-9c32-c171c800e6cc/estado", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ estado: "xyz" })
        });
        const data = await response.text();
        console.log("STATUS:", response.status);
        console.log("RESPONSE:", data);
    } catch (err) {
        console.error("ERROR:", err.message);
    }
};
run();
