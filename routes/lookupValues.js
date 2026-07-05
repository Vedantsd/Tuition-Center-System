const express = require("express");
const router = express.Router();
const getConnection = require("../config/oracle");

router.get("/lookup-values", async (req, res) => {

    let connection;

    const { type } = req.query;

    if (!type) {

        return res.status(400).json({
            success: false,
            message: "lookup_type (type) query param is required."
        });

    }

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT
                ID,
                LOOKUP_TYPE,
                LOOKUP_VALUE,
                IS_ACTIVE
             FROM LOOKUP_VALUES
             WHERE LOOKUP_TYPE = :type
             ORDER BY ID`,
            { type }
        );

        const data = result.rows.map(row => ({
            id: row[0],
            lookup_type: row[1],
            lookup_value: row[2],
            is_active: row[3] === 1
        }));

        res.json({
            success: true,
            data
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.get("/lookup-values/active", async (req, res) => {

    let connection;

    const { type } = req.query;

    if (!type) {

        return res.status(400).json({
            success: false,
            message: "lookup_type (type) query param is required."
        });

    }

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT
                ID,
                LOOKUP_VALUE
             FROM LOOKUP_VALUES
             WHERE LOOKUP_TYPE = :type
               AND IS_ACTIVE = 1
             ORDER BY LOOKUP_VALUE`,
            { type }
        );

        const data = result.rows.map(row => ({
            id: row[0],
            lookup_value: row[1]
        }));

        res.json({
            success: true,
            data
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.get("/lookup-values/types", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT DISTINCT LOOKUP_TYPE
             FROM LOOKUP_VALUES
             ORDER BY LOOKUP_TYPE`
        );

        res.json({
            success: true,
            data: result.rows.map(row => row[0])
        });

    }
    catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.post("/lookup-values", async (req, res) => {

    let connection;

    const { lookup_type, lookup_value, is_active } = req.body;

    if (!lookup_type || !lookup_value) {

        return res.status(400).json({
            success: false,
            message: "lookup_type and lookup_value are required."
        });

    }

    try {

        connection = await getConnection();

        await connection.execute(
            `INSERT INTO LOOKUP_VALUES
                (LOOKUP_TYPE, LOOKUP_VALUE, IS_ACTIVE)
             VALUES
                (:lookup_type, :lookup_value, :is_active)`,
            {
                lookup_type,
                lookup_value,
                is_active: is_active ? 1 : 0
            },
            {
                autoCommit: true
            }
        );

        res.json({
            success: true,
            message: "Value saved successfully."
        });

    }
    catch (err) {

        console.error(err);

        if (err.errorNum === 1) {

            return res.status(409).json({
                success: false,
                message: "This value already exists for this field."
            });

        }

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

router.put("/lookup-values/:id", async (req, res) => {

    let connection;

    const { id } = req.params;
    const { lookup_value, is_active } = req.body;

    if (!lookup_value) {

        return res.status(400).json({
            success: false,
            message: "lookup_value is required."
        });

    }

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `UPDATE LOOKUP_VALUES
             SET LOOKUP_VALUE = :lookup_value,
                 IS_ACTIVE = :is_active
             WHERE ID = :id`,
            {
                id,
                lookup_value,
                is_active: is_active ? 1 : 0
            },
            {
                autoCommit: true
            }
        );

        if (result.rowsAffected === 0) {

            return res.json({
                success: false,
                message: "Record not found."
            });

        }

        res.json({
            success: true,
            message: "Value updated successfully."
        });

    }
    catch (err) {

        console.error(err);

        if (err.errorNum === 1) {

            return res.status(409).json({
                success: false,
                message: "This value already exists for this field."
            });

        }

        res.status(500).json({
            success: false,
            message: err.message
        });

    }
    finally {

        if (connection)
            await connection.close();

    }

});

module.exports = router;