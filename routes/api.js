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

router.get("/users/:id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        const result = await connection.execute(
            `SELECT
                USER_ID,
                USER_TYPE,
                FIRST_NAME,
                LAST_NAME,
                MOBILE_NO,
                EMAIL,
                GENDER,
                TO_CHAR(DOB,'YYYY-MM-DD'),
                ADDRESS,
                QUALIFICATION,
                TO_CHAR(JOINING_DATE,'YYYY-MM-DD')
             FROM USERS
             WHERE USER_ID = :id`,
            {
                id: req.params.id
            }
        );

        if (result.rows.length === 0) {

            return res.json({
                success: false,
                message: "User not found."
            });

        }

        const row = result.rows[0];

        res.json({

            success: true,

            user_id: row[0],
            user_type: row[1],
            first_name: row[2],
            last_name: row[3],
            mobile_no: row[4],
            email: row[5],
            gender: row[6],
            dob: row[7],
            address: row[8],
            qualification: row[9],
            joining_date: row[10]

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

router.put("/users/:id", async (req, res) => {

    let connection;

    try {

        connection = await getConnection();

        let sql;
        let binds;

        if (req.body.password && req.body.password.trim() !== "") {

            const passwordHash = await bcrypt.hash(req.body.password, 10);

            sql = `
                UPDATE USERS SET

                    USER_TYPE = :user_type,
                    FIRST_NAME = :first_name,
                    LAST_NAME = :last_name,
                    MOBILE_NO = :mobile_no,
                    EMAIL = :email,
                    PASSWORD_HASH = :password_hash,
                    GENDER = :gender,
                    DOB = TO_DATE(:dob,'YYYY-MM-DD'),
                    ADDRESS = :address,
                    QUALIFICATION = :qualification,
                    JOINING_DATE = TO_DATE(:joining_date,'YYYY-MM-DD')

                WHERE USER_ID = :user_id
            `;

            binds = {

                user_id: req.params.id,
                user_type: req.body.user_type,
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                mobile_no: req.body.mobile_no,
                email: req.body.email,
                password_hash: passwordHash,
                gender: req.body.gender.charAt(0),
                dob: req.body.dob,
                address: req.body.address,
                qualification: req.body.qualification,
                joining_date: req.body.joining_date

            };

        }
        else {

            sql = `
                UPDATE USERS SET

                    USER_TYPE = :user_type,
                    FIRST_NAME = :first_name,
                    LAST_NAME = :last_name,
                    MOBILE_NO = :mobile_no,
                    EMAIL = :email,
                    GENDER = :gender,
                    DOB = TO_DATE(:dob,'YYYY-MM-DD'),
                    ADDRESS = :address,
                    QUALIFICATION = :qualification,
                    JOINING_DATE = TO_DATE(:joining_date,'YYYY-MM-DD')

                WHERE USER_ID = :user_id
            `;

            binds = {

                user_id: req.params.id,
                user_type: req.body.user_type,
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                mobile_no: req.body.mobile_no,
                email: req.body.email,
                gender: req.body.gender.charAt(0),
                dob: req.body.dob,
                address: req.body.address,
                qualification: req.body.qualification,
                joining_date: req.body.joining_date

            };

        }

        await connection.execute(sql, binds, {

            autoCommit: true

        });

        res.json({

            success: true,
            message: "User updated successfully."

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