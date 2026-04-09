const run = async () => {
    try {
        const response = await fetch("https://apipikagames.vercel.app/rifas");
        const data = await response.json();
        console.log("RIFAS ARRAY LENGTH:", data.rifas?.length);
        if (data.rifas && data.rifas.length > 0) {
            console.log("FIRST RIFA KEYS:", Object.keys(data.rifas[0]));
            console.log("FIRST RIFA PREMIOS:", data.rifas[0].premios);
        }
    } catch (err) {
        console.error("ERROR:", err.message);
    }
};
run();
