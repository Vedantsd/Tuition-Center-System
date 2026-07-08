// test-db.js
// Run with: node test-db.js
// This does ONE thing: tries to connect to Oracle using your existing
// config/oracle.js, and prints exactly what happened - success or the
// real underlying error (no server, no routes, nothing else involved).

const getConnection = require("./config/oracle");

(async () => {

    console.log("Attempting to connect to Oracle...");

    let connection;

    try {

        connection = await getConnection();

        console.log("✅ SUCCESS: Connected to Oracle.");

        const result = await connection.execute("SELECT 1 FROM dual");
        console.log("✅ Test query worked:", result.rows);

    } catch (err) {

        console.log("❌ FAILED to connect. Full error below:");
        console.log(err);

    } finally {

        if (connection) {
            await connection.close();
            console.log("Connection closed.");
        }

        process.exit(0);
    }

})();