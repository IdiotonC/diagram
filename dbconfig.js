const mysql = require("mysql");

const mysqlConnection = {
    init: () => {
        return mysql.createConnection({
            host: '192.168.55.13',
            port: '3306',
            user: 'sunrin',
            password: 'sunrin',
            database: 'diagram'
        })
    },

    open: (con) => {
        con.connect(err => {
            if(err) console.log("MySql failed! : ", err);
            else console.log("MySql Connected!!!");
        });
    },
}

module.exports = mysqlConnection;