const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const getConnection = require("../config/oracle");

router.post("/users", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        // Hash password
        const passwordHash = await bcrypt.hash(req.body.password, 10);

        const sql = `
        INSERT INTO USERS
        (
            USER_ID,
            USER_TYPE,
            FIRST_NAME,
            LAST_NAME,
            MOBILE_NO,
            EMAIL,
            PASSWORD_HASH,
            GENDER,
            DOB,
            ADDRESS,
            QUALIFICATION,
            JOINING_DATE
        )
        VALUES
        (
            :user_id,
            :user_type,
            :first_name,
            :last_name,
            :mobile_no,
            :email,
            :password_hash,
            :gender,
            TO_DATE(:dob,'YYYY-MM-DD'),
            :address,
            :qualification,
            TO_DATE(:joining_date,'YYYY-MM-DD')
        )
        `;

        await connection.execute(sql, {

            user_id: req.body.user_id,
            user_type: req.body.user_type,
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            mobile_no: req.body.mobile_no,
            email: req.body.email,
            password_hash: passwordHash,
            gender: req.body.gender.charAt(0), // F, M or O
            dob: req.body.dob,
            address: req.body.address,
            qualification: req.body.qualification,
            joining_date: req.body.joining_date

        }, {
            autoCommit: true
        });

        res.json({
            success: true,
            message: "User saved successfully."
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

module.exports = router;

router.get("/user-types", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT
                USER_TYPE_ID,
                USER_TYPE
             FROM USER_TYPE
             ORDER BY USER_TYPE_ID`
        );

        const userTypes = result.rows.map(row => ({
            user_type_id: row[0],
            user_type: row[1]
        }));

        res.json(userTypes);

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    } finally {

        if (connection)
            await connection.close();

    }

});