/*

Code for creating a pool connection with mysql library

Executes multiple SQL queries in one transaction and rolls back if one or more fail

Populate an object array with sql strings and corresponding values array

*/

var mysql = require('mysql');

var pool = mysql.createPool('mysql://localhost');

var queries:{sql:string, values?:any}[] = [];

queries[0] = 'INSERT INTO dbo.foo (bar) VALUES (?)';
queries[1] = 'INSERT INTO dbo.foo (bar) VALUES (?)';
queries[2] = 'INSERT INTO dbo.foo (bar) VALUES (?)';

const results = await multipleQueryTransaction(pool, queries);

function multipleQueryTransaction(pool:any, queries: {sql:string | QueryOptions, values?:any}[]) {
  return new Promise((resolve, reject)=> {
    pool.getConnection((err,conn) => {
      conn.beginTransaction((err)=>{

        this.execMultiQuery(conn, queries,function(err:any, results:any) {

          // if any one of queries fail, rollback and reject promise with SQL error
          if (err) {
            conn.rollback(function() {
              reject(err);
              done();
            });
          } else {
            conn.commit(function() {
              resolve(results);
              done();
            });
          }
        });
      });

      //call after promise is resolved to clean up connection
      function done() {
        conn.release();
      }
    });
  })
}

  private execMultiQuery(conn:any, queries: {sql:string | QueryOptions, values?:any}[], next:any) {
    let allResults:any = [];
    let e:any;

    for(let i = 0; i < queries.length; ++i) {
      allResults.push(new Promise(resolve => {
        conn.query(queries[i].sql, queries[i].values, function(err:any, res:any) {
          if (err) {e = err;}
          resolve(res);
        })
      }))
    }

    //wait for all DB queries to finish
    Promise.all(allResults).then(function(values) {
      //the last SQL error will be stored in e.  return to callback
      //else return the array of results
      if(e) {
        return next(e);
      }
      else {
        return next(null, values);
      }

    })
  }

