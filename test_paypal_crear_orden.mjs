const run = async () => {
    try {
        const payload = {
            rifa_id: "3a6dc281-f3a6-4394-9c32-c171c800e6cc", // Reemplaza con un ID de rifa válido
            numero: 1, // Número de boleto
            monto: "50.00",
            usuario_id: "usuario_id_ejemplo" // Reemplaza con un usuario válido
        };

        console.log('Enviando payload:', payload);

        const response = await fetch("https://apipikagames.vercel.app/paypal/crear-orden", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await response.text();
        console.log("STATUS:", response.status);
        console.log("RESPONSE:", data);
    } catch (err) {
        console.error("ERROR:", err.message);
    }
};

run();