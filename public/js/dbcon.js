var mysql = require('mysql');
var pool = mysql.createPool( {
    connectionLimit : 10,
    host            : 'classmysql.engr.oregonstate.edu',
    user            : 'cs290_klumpps',
    password        : '2715',
    database        : 'cs290_klumpps'
});

module.exports.pool = pool;
