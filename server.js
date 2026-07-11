const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static("public"));

app.use("/api", require("./routes/api"));
app.use("/api", require("./routes/lookupValues"));

app.listen(3000, () => {
    console.log("Server Started...");
});

// const express = require("express");
// const cors = require("cors");
// const getConnection = require("./config/oracle");

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.use(express.static("public"));

// app.use("/api", require("./routes/api"));
// app.use("/api", require("./routes/lookupValues"));

// app.listen(3000, async () => {
//     console.log("Server Started...");

//     // ---- Built-in Oracle connection check ----
//     console.log("Checking Oracle DB connection...");

//     let connection;

//     try {
//         connection = await getConnection();
//         console.log("✅ ORACLE CONNECTED SUCCESSFULLY.");

//         const result = await connection.execute("SELECT 1 FROM dual");
//         console.log("✅ Test query result:", result.rows);

//     } catch (err) {
//         console.log("❌ ORACLE CONNECTION FAILED. Full error below:");
//         console.log(err);

//     } finally {
//         if (connection) {
//             await connection.close();
//         }
//     }
//     // -------------------------------------------
// });